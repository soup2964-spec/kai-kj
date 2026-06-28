"use client";

import { useCallback, useEffect, useState } from "react";
import { normalizeBillableFields } from "./billable-engine";
import { normalizeCardLastFour } from "./card-last-four";
import { normalizeLineItems } from "./receipt-line-items";
import type { BillableStatus, Expense, ScannedReceipt } from "./types";

const STORAGE_KEY = "kai-kj-expenses";

function readExpenses(): Expense[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Expense[];
    return parsed.map((expense) => ({
      ...expense,
      lineItems: normalizeLineItems(expense.lineItems),
      cardLastFour: normalizeCardLastFour(expense.cardLastFour),
      ...normalizeBillableFields(expense),
    }));
  } catch {
    return [];
  }
}

function writeExpenses(expenses: Expense[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
}

export function useExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setExpenses(readExpenses());
    setLoaded(true);
  }, []);

  const persist = useCallback((next: Expense[]) => {
    setExpenses(next);
    writeExpenses(next);
  }, []);

  const addExpense = useCallback(
    (scan: ScannedReceipt, receiptImage?: string) => {
      const expense: Expense = {
        ...scan,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        receiptImage,
      };
      persist([expense, ...readExpenses()]);
      return expense;
    },
    [persist],
  );

  const removeExpense = useCallback(
    (id: string) => {
      persist(readExpenses().filter((e) => e.id !== id));
    },
    [persist],
  );

  const updateExpense = useCallback(
    (
      id: string,
      patch: {
        billableStatus?: BillableStatus;
        cardLastFour?: string | null;
      },
    ) => {
      const next = readExpenses().map((expense) => {
        if (expense.id !== id) return expense;

        const updated = { ...expense };

        if (patch.cardLastFour !== undefined) {
          updated.cardLastFour = normalizeCardLastFour(patch.cardLastFour);
        }

        if (
          patch.billableStatus &&
          patch.billableStatus !== expense.billableStatus
        ) {
          updated.billableStatus = patch.billableStatus;
          updated.billableReason = "Updated manually";
          updated.billableSource = "manual";
          updated.matchedRuleId = undefined;
        }

        return updated;
      });

      persist(next);
    },
    [persist],
  );

  const clearExpenses = useCallback(() => {
    persist([]);
  }, [persist]);

  return {
    expenses,
    loaded,
    addExpense,
    removeExpense,
    updateExpense,
    clearExpenses,
  };
}
