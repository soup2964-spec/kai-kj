import type { ExpenseCategory } from "@/lib/types";
import { CATEGORY_META } from "@/lib/categories";

export function CategoryBadge({
  category,
  size = "sm",
}: {
  category: ExpenseCategory;
  size?: "sm" | "md";
}) {
  const meta = CATEGORY_META[category];

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold ${
        size === "md" ? "rounded-md px-2.5 py-1 text-xs" : "rounded px-2 py-0.5 text-[11px]"
      }`}
      style={{ color: meta.color, backgroundColor: meta.bg }}
    >
      <span
        className="inline-block h-1.5 w-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: meta.dot }}
      />
      {meta.label}
    </span>
  );
}
