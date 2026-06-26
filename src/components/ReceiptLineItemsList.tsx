import type { ReceiptLineItem } from "@/lib/types";
import { formatCurrency } from "@/lib/categories";

export function ReceiptLineItemsList({
  items,
  limit,
}: {
  items: ReceiptLineItem[];
  limit?: number;
}) {
  const visible = limit ? items.slice(0, limit) : items;
  if (visible.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-lg border border-qb-border bg-white">
      <div className="border-b border-qb-border-light bg-qb-bg/50 px-3 py-2">
        <p className="text-[11px] font-bold uppercase tracking-wider text-qb-text-muted">
          Receipt Items
        </p>
      </div>
      <ul className="divide-y divide-qb-border-light px-3 py-1">
        {visible.map((item, index) => (
          <li
            key={`${item.name}-${index}`}
            className="flex items-start justify-between gap-3 py-2 text-sm"
          >
            <span className="min-w-0 flex-1 leading-snug text-qb-text">
              {item.name}
            </span>
            <span className="shrink-0 font-semibold tabular-nums text-qb-text">
              {item.amount != null ? formatCurrency(item.amount) : "—"}
            </span>
          </li>
        ))}
      </ul>
      {limit && items.length > limit && (
        <p className="border-t border-qb-border-light px-3 py-2 text-xs text-qb-text-muted">
          +{items.length - limit} more item{items.length - limit === 1 ? "" : "s"}
        </p>
      )}
    </div>
  );
}
