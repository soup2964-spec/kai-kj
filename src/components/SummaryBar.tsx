import type { Expense } from "@/lib/types";
import { formatCurrency } from "@/lib/categories";

export function SummaryBar({ expenses }: { expenses: Expense[] }) {
  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  const avg = expenses.length > 0 ? total / expenses.length : 0;

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="qb-stat">
        <p className="qb-stat-label">Total Expenses</p>
        <p className="qb-stat-value text-2xl lg:text-[28px]">
          {formatCurrency(total)}
        </p>
        <p className="qb-stat-sub">
          {expenses.length} receipt{expenses.length === 1 ? "" : "s"}
        </p>
      </div>

      <div className="qb-stat">
        <p className="qb-stat-label">Avg Receipt</p>
        <p className="qb-stat-value text-xl lg:text-[28px]">
          {formatCurrency(avg)}
        </p>
        <p className="qb-stat-sub">Per scan</p>
      </div>
    </div>
  );
}
