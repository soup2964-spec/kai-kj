"use client";

import { useState } from "react";
import { ExpenseExportButton } from "@/components/ExpenseExportButton";
import { ExpenseList } from "@/components/ExpenseList";
import { SummaryBar } from "@/components/SummaryBar";
import type { ExpenseDateSort } from "@/lib/expense-grouping";
import { useExpenseContext } from "@/lib/expense-context";

export function ExpensesPage() {
  const { expenses, removeExpense, updateExpense } = useExpenseContext();
  const [dateSort, setDateSort] = useState<ExpenseDateSort>("newest");

  return (
    <>
      <section className="qb-card">
        <div className="qb-card-body">
          <ExpenseExportButton expenses={expenses} dateSort={dateSort} />
        </div>
      </section>
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
