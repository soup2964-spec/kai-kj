"use client";

import { useState } from "react";
import { ExpenseDateSortBar } from "@/components/ExpenseDateSortBar";
import { ExpenseList } from "@/components/ExpenseList";
import { SummaryBar } from "@/components/SummaryBar";
import type { ExpenseDateSort } from "@/lib/expense-grouping";
import { useExpenseContext } from "@/lib/expense-context";

export function ExpensesPage() {
  const { expenses, removeExpense, updateExpense } = useExpenseContext();
  const [dateSort, setDateSort] = useState<ExpenseDateSort>("newest");

  return (
    <>
      <ExpenseDateSortBar value={dateSort} onChange={setDateSort} />
      <SummaryBar expenses={expenses} />
      <ExpenseList
        expenses={expenses}
        dateSort={dateSort}
        onDateSortChange={setDateSort}
        onRemove={removeExpense}
        onUpdate={updateExpense}
      />
    </>
  );
}
