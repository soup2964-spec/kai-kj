"use client";

import { ExpenseList } from "@/components/ExpenseList";
import { SummaryBar } from "@/components/SummaryBar";
import { useExpenseContext } from "@/lib/expense-context";

export function ExpensesPage() {
  const { expenses, removeExpense } = useExpenseContext();

  return (
    <>
      <SummaryBar expenses={expenses} />
      <ExpenseList expenses={expenses} onRemove={removeExpense} />
    </>
  );
}
