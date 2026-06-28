"use client";

import { useMemo, useState } from "react";
import { AccountEmailCard } from "@/components/AccountEmailCard";
import {
  DEFAULT_EXPENSE_PERIOD_FILTER,
  ExpensePeriodFilterBar,
} from "@/components/ExpensePeriodFilterBar";
import { ExpenseList } from "@/components/ExpenseList";
import { SummaryBar } from "@/components/SummaryBar";
import {
  filterExpensesByPeriod,
  type ExpenseDateSort,
  type ExpensePeriodFilter,
} from "@/lib/expense-grouping";
import { useExpenseContext } from "@/lib/expense-context";

export function ExpensesPage() {
  const { expenses, removeExpense, updateExpense, refreshAccount } =
    useExpenseContext();
  const [dateSort, setDateSort] = useState<ExpenseDateSort>("newest");
  const [period, setPeriod] = useState<ExpensePeriodFilter>(
    DEFAULT_EXPENSE_PERIOD_FILTER,
  );

  const filteredExpenses = useMemo(
    () => filterExpensesByPeriod(expenses, period),
    [expenses, period],
  );

  return (
    <>
      <AccountEmailCard
        onAccountSaved={() => {
          void refreshAccount();
        }}
      />
      <ExpensePeriodFilterBar
        expenses={expenses}
        period={period}
        dateSort={dateSort}
        onPeriodChange={setPeriod}
        onDateSortChange={setDateSort}
      />
      <SummaryBar expenses={filteredExpenses} />
      <ExpenseList
        expenses={filteredExpenses}
        dateSort={dateSort}
        onDateSortChange={setDateSort}
        onRemove={removeExpense}
        onUpdate={updateExpense}
      />
    </>
  );
}
