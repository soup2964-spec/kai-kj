import type { Expense } from "@/lib/types";
import { CATEGORY_META, formatCurrency } from "@/lib/categories";

export function SummaryBar({ expenses }: { expenses: Expense[] }) {
  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  const avg = expenses.length > 0 ? total / expenses.length : 0;

  const topCategory = expenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + e.amount;
    return acc;
  }, {});

  const [topCat, topAmount] =
    Object.entries(topCategory).sort(([, a], [, b]) => b - a)[0] ?? [];

  const topMeta = topCat
    ? CATEGORY_META[topCat as keyof typeof CATEGORY_META]
    : null;

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
      <div className="qb-stat col-span-2 lg:col-span-1">
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

      <div className="qb-stat">
        <p className="qb-stat-label">Top Category</p>
        {topMeta ? (
          <>
            <p className="qb-stat-value text-lg lg:text-[22px]">{topMeta.label}</p>
            <p className="qb-stat-sub">{formatCurrency(topAmount)}</p>
          </>
        ) : (
          <>
            <p className="qb-stat-value text-lg lg:text-[22px]">—</p>
            <p className="qb-stat-sub">Scan to see</p>
          </>
        )}
      </div>
    </div>
  );
}
