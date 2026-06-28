export const EXPENSE_CATEGORIES = [
  "groceries",
  "dining",
  "transportation",
  "shopping",
  "entertainment",
  "health",
  "utilities",
  "travel",
  "business",
  "months",
  "credit_cards",
  "other",
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export type BillableStatus = "billable" | "non_billable" | "review";

export type BillableSource = "rule" | "default" | "manual";

export interface ReceiptLineItem {
  name: string;
  amount: number | null;
}

/** Raw fields extracted by AI — no billable decision yet */
export interface ExtractedReceipt {
  merchant: string;
  amount: number;
  date: string;
  category: ExpenseCategory;
  categoryReason: string;
  lineItems: ReceiptLineItem[];
  confidence: number;
  /** Last 4 digits of the payment card, when visible on the receipt */
  cardLastFour?: string | null;
}

/** Full scan result after billable rules are applied */
export interface ScannedReceipt extends ExtractedReceipt {
  billableStatus: BillableStatus;
  billableReason: string;
  billableSource: BillableSource;
  matchedRuleId?: string;
}

export interface Expense extends ScannedReceipt {
  id: string;
  createdAt: string;
  receiptImage?: string;
}
