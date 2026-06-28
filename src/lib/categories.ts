import type { ExpenseCategory } from "./types";
import { parsePurchaseDate } from "./expense-grouping";

export const CATEGORY_META: Record<
  ExpenseCategory,
  { label: string; color: string; bg: string; dot: string }
> = {
  groceries: { label: "Groceries", color: "#007023", bg: "#e8f5e6", dot: "#2ca01c" },
  dining: { label: "Dining", color: "#b54708", bg: "#fef3e2", dot: "#f79009" },
  transportation: { label: "Transportation", color: "#225aea", bg: "#f2f6ff", dot: "#225aea" },
  shopping: { label: "Shopping", color: "#6941c6", bg: "#f3eefb", dot: "#7f56d9" },
  entertainment: { label: "Entertainment", color: "#c11574", bg: "#fce8f3", dot: "#ee46bc" },
  health: { label: "Health", color: "#027a48", bg: "#ecfdf3", dot: "#12b76a" },
  utilities: { label: "Utilities", color: "#854d0e", bg: "#fef9c3", dot: "#ca8a04" },
  travel: { label: "Travel", color: "#026aa2", bg: "#e0f2fe", dot: "#0ba5ec" },
  business: { label: "Business", color: "#3538cd", bg: "#eef4ff", dot: "#444ce7" },
  months: { label: "Monthly", color: "#0e7490", bg: "#ecfeff", dot: "#06b6d4" },
  credit_cards: { label: "Credit Cards", color: "#93370d", bg: "#fffaeb", dot: "#f59e0b" },
  other: { label: "Other", color: "#393a3d", bg: "#eceef1", dot: "#6b6c72" },
};

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export function formatDate(date: string): string {
  const parsed = parsePurchaseDate(date);
  if (!parsed) return date;
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
