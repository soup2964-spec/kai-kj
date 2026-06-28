import type { Expense } from "@/lib/types";

/** AppFolio-style work order: e.g. 76-2234 */
const WORK_ORDER_PATTERN = /^(\d{2})-(\d{3,5})$/;

const WORK_ORDER_EXTRACT_PATTERNS = [
  /\b(?:wo|w\/o|work\s*order)\s*#?\s*(\d{2}-\d{3,5})\b/i,
  /\b(\d{2}-\d{3,5})\b/,
];

function isLikelyDateFalsePositive(prefix: string, suffix: string): boolean {
  const month = Number(prefix);
  const year = Number(suffix);
  return month >= 1 && month <= 12 && year >= 2020 && year <= 2035;
}

/** Normalize user or AI input to AppFolio-style xx-xxxx, or null if invalid. */
export function normalizeWorkOrderNumber(value: unknown): string | null {
  if (value == null || value === "") return null;

  let cleaned = String(value).trim().toUpperCase();
  cleaned = cleaned.replace(/^(?:WO|W\/O)\s*#?\s*/i, "");

  const strict = cleaned.match(WORK_ORDER_PATTERN);
  if (strict) {
    const [, prefix, suffix] = strict;
    if (isLikelyDateFalsePositive(prefix, suffix)) return null;
    return `${prefix}-${suffix}`;
  }

  for (const pattern of WORK_ORDER_EXTRACT_PATTERNS) {
    const match = cleaned.match(pattern);
    if (match?.[1]) {
      const normalized = normalizeWorkOrderNumber(match[1]);
      if (normalized) return normalized;
    }
  }

  return null;
}

export function extractWorkOrderFromText(text: string): string | null {
  if (!text.trim()) return null;

  for (const line of text.split(/\r?\n/)) {
    for (const pattern of WORK_ORDER_EXTRACT_PATTERNS) {
      const match = line.match(pattern);
      if (match?.[1]) {
        const normalized = normalizeWorkOrderNumber(match[1]);
        if (normalized) return normalized;
      }
    }
  }

  return null;
}

export function resolveWorkOrderNumber(
  explicit: unknown,
  ...textSources: Array<string | null | undefined>
): string | null {
  const fromExplicit = normalizeWorkOrderNumber(explicit);
  if (fromExplicit) return fromExplicit;

  for (const source of textSources) {
    if (!source) continue;
    const found = extractWorkOrderFromText(source);
    if (found) return found;
  }

  return null;
}

export function formatWorkOrderLabel(
  workOrderNumber: string | null | undefined,
): string {
  if (!workOrderNumber) return "No work order";
  return `WO ${workOrderNumber}`;
}

export function expenseNeedsWorkOrder(
  expense: Pick<Expense, "billableStatus">,
): boolean {
  return expense.billableStatus === "billable";
}

export function isWorkOrderMissing(
  expense: Pick<Expense, "billableStatus" | "workOrderNumber">,
): boolean {
  return expenseNeedsWorkOrder(expense) && !expense.workOrderNumber;
}

export function countMissingWorkOrders(expenses: Expense[]): number {
  return expenses.filter(isWorkOrderMissing).length;
}
