import type { ReceiptLineItem } from "@/lib/types";

export function normalizeLineItems(items: unknown): ReceiptLineItem[] {
  if (!Array.isArray(items)) return [];

  return items
    .map((item) => {
      if (typeof item === "string") {
        return { name: item, amount: null };
      }
      if (item && typeof item === "object" && "name" in item) {
        const record = item as { name?: unknown; amount?: unknown };
        return {
          name: String(record.name ?? ""),
          amount:
            typeof record.amount === "number" && !Number.isNaN(record.amount)
              ? record.amount
              : null,
        };
      }
      return { name: String(item), amount: null };
    })
    .filter((item) => item.name.trim().length > 0);
}
