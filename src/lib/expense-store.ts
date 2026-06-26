"use client";

import { useCallback, useEffect, useState } from "react";
import type { Expense, ScannedReceipt } from "./types";

const STORAGE_KEY = "kai-kj-expenses";

function readExpenses(): Expense[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Expense[]) : [];
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

  const clearExpenses = useCallback(() => {
    persist([]);
  }, [persist]);

  return { expenses, loaded, addExpense, removeExpense, clearExpenses };
}
