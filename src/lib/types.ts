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
  "other",
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export interface ScannedReceipt {
  merchant: string;
  amount: number;
  date: string;
  category: ExpenseCategory;
  categoryReason: string;
  lineItems: string[];
  confidence: number;
}

export interface Expense extends ScannedReceipt {
  id: string;
  createdAt: string;
  receiptImage?: string;
}
