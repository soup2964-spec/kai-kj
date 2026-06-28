"use client";

import { useCallback, useEffect, useState } from "react";
import { normalizeAccountingFields } from "./accounting-fields";
import { normalizeBillableFields } from "./billable-engine";
import { normalizeCardBrand, normalizeCardLastFour } from "./card-last-four";
import { normalizeWorkOrderNumber } from "./work-order";
import {
  deleteExpenseRemote,
  fetchExpensesRemote,
  saveExpenseRemote,
  submitAccountingDecisionRemote,
  updateExpenseRemote,
  type AccountingDecision,
} from "./expense-sync";
import { normalizeLineItems } from "./receipt-line-items";
import type { BillableStatus, Expense, ScannedReceipt } from "./types";

const STORAGE_KEY = "kai-kj-expenses";

function normalizeExpense(expense: Expense): Expense {
  return {
    ...expense,
    lineItems: normalizeLineItems(expense.lineItems),
    cardLastFour: normalizeCardLastFour(expense.cardLastFour),
    cardBrand: normalizeCardBrand(expense.cardBrand),
    workOrderNumber: normalizeWorkOrderNumber(expense.workOrderNumber),
    ...normalizeBillableFields(expense),
    ...normalizeAccountingFields(expense),
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

function mergeLocalOnlyFields(
  remoteExpenses: Expense[],
  localExpenses: Expense[],
): Expense[] {
  const localById = new Map(localExpenses.map((expense) => [expense.id, expense]));

  return remoteExpenses.map((expense) => {
    const local = localById.get(expense.id);
    return normalizeExpense({
      ...expense,
      receiptImage: local?.receiptImage ?? expense.receiptImage,
    });
  });
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

  useEffect(() => {
    let cancelled = false;

    async function loadExpenses() {
      const localExpenses = readExpenses();

      try {
        const remoteExpenses = await fetchExpensesRemote();
        const merged = mergeLocalOnlyFields(remoteExpenses, localExpenses);
        if (!cancelled) {
          setExpenses(merged);
          writeExpenses(merged);
          setSyncError(null);
        }
      } catch {
        if (!cancelled) {
          setExpenses(localExpenses);
          setSyncError(null);
        }
      } finally {
        if (!cancelled) {
          setLoaded(true);
        }
      }
    }

    void loadExpenses();

    return () => {
      cancelled = true;
    };
  }, []);

  const persist = useCallback((next: Expense[]) => {
    setExpenses(next);
    writeExpenses(next);
  }, []);

  const addExpense = useCallback(
    (scan: ScannedReceipt, receiptImage?: string) => {
      const expense: Expense = normalizeExpense({
        ...scan,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        receiptImage,
        accountingStatus: "pending",
      });

      const next = [expense, ...readExpenses()];
      persist(next);

      void saveExpenseRemote(expense).catch((error) => {
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

  return {
    expenses,
    loaded,
    syncError,
    accountingBusyId,
    addExpense,
    removeExpense,
    updateExpense,
    submitAccountingDecision,
    clearExpenses,
  };
}
