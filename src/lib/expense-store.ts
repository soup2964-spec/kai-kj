"use client";

import { useCallback, useEffect, useState } from "react";
import { getAccountEmail } from "./account-id";
import { normalizeAccountingFields } from "./accounting-fields";
import { normalizeCreditCardReconcileFields } from "./credit-card-reconcile-fields";
import { normalizeBillableFields } from "./billable-engine";
import { normalizeCardBrand, normalizeCardLastFour } from "./card-last-four";
import { normalizeWorkOrderNumber } from "./work-order";
import {
  normalizeBookkeepingText,
  normalizeInboxStatus,
  normalizeReconciliationStatus,
} from "./receipt-workflow";
import {
  deleteExpenseRemote,
  fetchExpensesRemote,
  saveExpenseRemote,
  submitAccountingDecisionRemote,
  updateExpenseRemote,
  type AccountingDecision,
} from "./expense-sync";
import { reconcileStatementsRemote } from "./statement-sync";
import { normalizeLineItems } from "./receipt-line-items";
import type {
  BillableStatus,
  Expense,
  ReceiptInboxStatus,
  ScannedReceipt,
} from "./types";

const STORAGE_KEY = "kai-kj-expenses";

function normalizeExpense(expense: Expense): Expense {
  return {
    ...expense,
    lineItems: normalizeLineItems(expense.lineItems),
    cardLastFour: normalizeCardLastFour(expense.cardLastFour),
    cardBrand: normalizeCardBrand(expense.cardBrand),
    workOrderNumber: normalizeWorkOrderNumber(expense.workOrderNumber),
    inboxStatus: normalizeInboxStatus(expense.inboxStatus, expense),
    reconciliationStatus: normalizeReconciliationStatus(
      expense.reconciliationStatus,
    ),
    propertyName: normalizeBookkeepingText(expense.propertyName),
    vendorName: normalizeBookkeepingText(expense.vendorName),
    duplicateOfId: normalizeBookkeepingText(expense.duplicateOfId),
    ...normalizeBillableFields(expense),
    ...normalizeAccountingFields(expense),
    ...normalizeCreditCardReconcileFields(expense),
  };
}

function readExpenses(): Expense[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Expense[];
    return parsed.map(normalizeExpense);
  } catch {
    return [];
  }
}

function writeExpenses(expenses: Expense[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
}

function mergeRemoteAndLocal(
  remoteExpenses: Expense[],
  localExpenses: Expense[],
): Expense[] {
  const byId = new Map<string, Expense>();

  for (const expense of localExpenses) {
    byId.set(expense.id, normalizeExpense(expense));
  }

  for (const expense of remoteExpenses) {
    const local = byId.get(expense.id);
    byId.set(
      expense.id,
      normalizeExpense({
        ...expense,
        receiptImage: local?.receiptImage ?? expense.receiptImage,
        inboxStatus: local?.inboxStatus ?? expense.inboxStatus,
        reconciliationStatus:
          local?.reconciliationStatus ?? expense.reconciliationStatus,
        propertyName: local?.propertyName ?? expense.propertyName,
        vendorName: local?.vendorName ?? expense.vendorName,
        duplicateOfId: local?.duplicateOfId ?? expense.duplicateOfId,
      }),
    );
  }

  return [...byId.values()];
}

async function uploadMissingExpenses(
  remoteExpenses: Expense[],
  localExpenses: Expense[],
): Promise<Expense[]> {
  const remoteIds = new Set(remoteExpenses.map((expense) => expense.id));
  const missing = localExpenses.filter((expense) => !remoteIds.has(expense.id));
  const uploaded: Expense[] = [];

  for (const expense of missing) {
    try {
      uploaded.push(await saveExpenseRemote(expense));
    } catch {
      uploaded.push(expense);
    }
  }

  return uploaded;
}

async function tryAutoReconcileExpenses(expenses: Expense[]) {
  try {
    const result = await reconcileStatementsRemote({ expenses });
    if (result.updatedExpenses.length === 0) return expenses;

    const byId = new Map(result.updatedExpenses.map((expense) => [expense.id, expense]));
    return expenses.map((expense) => byId.get(expense.id) ?? expense);
  } catch {
    return expenses;
  }
}

async function tryAutoReconcileExpense(expense: Expense): Promise<Expense> {
  try {
    const result = await reconcileStatementsRemote({
      expenseId: expense.id,
      expenses: readExpenses(),
      transactions: undefined,
    });
    return result.updatedExpenses.find((item) => item.id === expense.id) ?? expense;
  } catch {
    return expense;
  }
}

function replaceExpense(expenses: Expense[], updated: Expense) {
  return expenses.map((expense) =>
    expense.id === updated.id ? normalizeExpense(updated) : expense,
  );
}

export function useExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [accountingBusyId, setAccountingBusyId] = useState<string | null>(null);
  const [accountEmail, setAccountEmailState] = useState<string | null>(() =>
    typeof window === "undefined" ? null : getAccountEmail(),
  );

  const loadExpenses = useCallback(async () => {
    const localExpenses = readExpenses();

    try {
      const remoteExpenses = await fetchExpensesRemote();
      const uploaded = await uploadMissingExpenses(remoteExpenses, localExpenses);
      const combinedRemote = [...remoteExpenses];

      for (const expense of uploaded) {
        if (!combinedRemote.some((remote) => remote.id === expense.id)) {
          combinedRemote.push(expense);
        }
      }

      const merged = mergeRemoteAndLocal(combinedRemote, localExpenses);
      const reconciled = await tryAutoReconcileExpenses(merged);
      setExpenses(reconciled);
      writeExpenses(reconciled);
      setSyncError(null);
    } catch {
      setExpenses(localExpenses);
      setSyncError(null);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    void loadExpenses();
  }, [loadExpenses]);

  const refreshAccount = useCallback(async () => {
    setAccountEmailState(getAccountEmail());
    setLoaded(false);
    await loadExpenses();
  }, [loadExpenses]);

  const persist = useCallback((next: Expense[]) => {
    setExpenses(next);
    writeExpenses(next);
  }, []);

  const addExpense = useCallback(
    (scan: ScannedReceipt, receiptImage?: string) => {
      const workflow = scan as Partial<Expense>;
      const expense: Expense = normalizeExpense({
        ...scan,
        id: workflow.id ?? crypto.randomUUID(),
        createdAt: workflow.createdAt ?? new Date().toISOString(),
        receiptImage: receiptImage ?? workflow.receiptImage,
        accountingStatus: workflow.accountingStatus ?? "pending",
        inboxStatus: workflow.inboxStatus ?? "new",
        reconciliationStatus: workflow.reconciliationStatus ?? "unmatched",
        creditCardReconciled: workflow.creditCardReconciled,
        statementTransactionId: workflow.statementTransactionId,
        reconciledAt: workflow.reconciledAt,
      });

      const next = [expense, ...readExpenses()];
      persist(next);

      void tryAutoReconcileExpense(expense).then((reconciled) => {
        persist(replaceExpense(readExpenses(), reconciled));
      });

      void saveExpenseRemote(expense)
        .then((saved) => tryAutoReconcileExpense(saved))
        .then((reconciled) => {
          persist(replaceExpense(readExpenses(), reconciled));
        })
        .catch((error) => {
        setSyncError(
          error instanceof Error
            ? error.message
            : "Could not save receipt to Supabase.",
        );
      });

      return expense;
    },
    [persist],
  );

  const removeExpense = useCallback(
    (id: string) => {
      persist(readExpenses().filter((expense) => expense.id !== id));

      void deleteExpenseRemote(id).catch((error) => {
        setSyncError(
          error instanceof Error
            ? error.message
            : "Could not delete receipt from Supabase.",
        );
      });
    },
    [persist],
  );

  const submitAccountingDecision = useCallback(
    async (id: string, decision: AccountingDecision) => {
      setAccountingBusyId(id);
      setSyncError(null);

      try {
        const { expense, error } = await submitAccountingDecisionRemote(
          id,
          decision,
        );
        persist(replaceExpense(readExpenses(), expense));
        setSyncError(error ?? null);
      } catch (error) {
        setSyncError(
          error instanceof Error
            ? error.message
            : "Could not update accounting status.",
        );
      } finally {
        setAccountingBusyId(null);
      }
    },
    [persist],
  );

  const updateExpense = useCallback(
    (
      id: string,
      patch: {
        billableStatus?: BillableStatus;
        cardLastFour?: string | null;
        workOrderNumber?: string | null;
        inboxStatus?: ReceiptInboxStatus;
        propertyName?: string | null;
        vendorName?: string | null;
        duplicateOfId?: string | null;
      },
    ) => {
      let updated: Expense | null = null;

      const next = readExpenses().map((expense) => {
        if (expense.id !== id) return expense;

        const nextExpense = { ...expense };

        if (patch.cardLastFour !== undefined) {
          nextExpense.cardLastFour = normalizeCardLastFour(patch.cardLastFour);
        }

        if (patch.workOrderNumber !== undefined) {
          nextExpense.workOrderNumber = normalizeWorkOrderNumber(
            patch.workOrderNumber,
          );
        }

        if (patch.inboxStatus !== undefined) {
          nextExpense.inboxStatus = normalizeInboxStatus(patch.inboxStatus);
        }

        if (patch.propertyName !== undefined) {
          nextExpense.propertyName = normalizeBookkeepingText(
            patch.propertyName,
          );
        }

        if (patch.vendorName !== undefined) {
          nextExpense.vendorName = normalizeBookkeepingText(patch.vendorName);
        }

        if (patch.duplicateOfId !== undefined) {
          nextExpense.duplicateOfId = normalizeBookkeepingText(
            patch.duplicateOfId,
          );
        }

        if (
          patch.billableStatus &&
          patch.billableStatus !== expense.billableStatus
        ) {
          nextExpense.billableStatus = patch.billableStatus;
          nextExpense.billableReason = "Updated manually";
          nextExpense.billableSource = "manual";
          nextExpense.matchedRuleId = undefined;
        }

        updated = normalizeExpense(nextExpense);
        return updated;
      });

      persist(next);

      if (updated) {
        void updateExpenseRemote(updated).catch((error) => {
          setSyncError(
            error instanceof Error
              ? error.message
              : "Could not save receipt updates to Supabase.",
          );
        });
      }
    },
    [persist],
  );

  const clearExpenses = useCallback(() => {
    persist([]);
  }, [persist]);

  const mergeReconciledExpenses = useCallback(
    (updated: Expense[]) => {
      const byId = new Map(updated.map((expense) => [expense.id, expense]));
      persist(readExpenses().map((expense) => byId.get(expense.id) ?? expense));
    },
    [persist],
  );

  const reconcileAllReceipts = useCallback(async () => {
    const result = await reconcileStatementsRemote({ expenses: readExpenses() });
    mergeReconciledExpenses(result.updatedExpenses);
    return result.summary;
  }, [mergeReconciledExpenses]);

  return {
    expenses,
    loaded,
    syncError,
    accountingBusyId,
    accountEmail,
    refreshAccount,
    addExpense,
    removeExpense,
    updateExpense,
    submitAccountingDecision,
    clearExpenses,
    mergeReconciledExpenses,
    reconcileAllReceipts,
  };
}
