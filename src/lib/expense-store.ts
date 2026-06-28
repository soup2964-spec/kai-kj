"use client";

import { useCallback, useEffect, useState } from "react";
import { normalizeBillableFields } from "./billable-engine";
import {
  deleteExpenseRemote,
  fetchExpensesRemote,
  saveExpenseRemote,
} from "./expense-sync";
import { normalizeLineItems } from "./receipt-line-items";
import type { Expense, ScannedReceipt } from "./types";

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
      ...normalizeBillableFields(expense),
    }));
  } catch {
    return [];
  }
}

function writeExpenses(expenses: Expense[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
}

function mergeLocalReceiptImages(
  remoteExpenses: Expense[],
  localExpenses: Expense[],
): Expense[] {
  const imagesById = new Map(
    localExpenses
      .filter((expense) => expense.receiptImage)
      .map((expense) => [expense.id, expense.receiptImage] as const),
  );

  return remoteExpenses.map((expense) => ({
    ...expense,
    receiptImage: imagesById.get(expense.id) ?? expense.receiptImage,
  }));
}

export function useExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadExpenses() {
      const localExpenses = readExpenses();

      try {
        const remoteExpenses = await fetchExpensesRemote();
        const merged = mergeLocalReceiptImages(remoteExpenses, localExpenses);
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
      const expense: Expense = {
        ...scan,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        receiptImage,
      };

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

  const clearExpenses = useCallback(() => {
    persist([]);
  }, [persist]);

  return {
    expenses,
    loaded,
    syncError,
    addExpense,
    removeExpense,
    clearExpenses,
  };
}
