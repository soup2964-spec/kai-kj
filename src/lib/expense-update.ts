import type {
  BillableStatus,
  Expense,
  ExpenseCategory,
  ReceiptInboxStatus,
  ScannedReceipt,
} from "@/lib/types";

export type ExpenseTransactionPatch = {
  merchant?: string;
  amount?: number;
  date?: string;
  category?: ExpenseCategory;
  categoryReason?: string;
  billableStatus?: BillableStatus;
  cardLastFour?: string | null;
  workOrderNumber?: string | null;
  inboxStatus?: ReceiptInboxStatus;
  propertyName?: string | null;
  vendorName?: string | null;
  duplicateOfId?: string | null;
};

export type ReceiptTransactionFields = Pick<
  ScannedReceipt,
  | "merchant"
  | "amount"
  | "date"
  | "category"
  | "billableStatus"
  | "workOrderNumber"
  | "cardLastFour"
> & {
  vendorName?: string | null;
  propertyName?: string | null;
};

export function expenseToTransactionFields(
  expense: Expense | ScannedReceipt,
): ReceiptTransactionFields {
  return {
    merchant: expense.merchant,
    amount: expense.amount,
    date: expense.date,
    category: expense.category,
    billableStatus: expense.billableStatus,
    workOrderNumber: expense.workOrderNumber ?? null,
    cardLastFour: expense.cardLastFour ?? null,
    vendorName:
      "vendorName" in expense ? (expense.vendorName ?? null) : null,
    propertyName:
      "propertyName" in expense ? (expense.propertyName ?? null) : null,
  };
}

export function parseAmountInput(value: string): number | null {
  const normalized = value.replace(/[^0-9.]/g, "");
  if (!normalized) return null;
  const amount = Number(normalized);
  if (!Number.isFinite(amount) || amount < 0) return null;
  return Math.round(amount * 100) / 100;
}

export function transactionFieldsToPatch(
  fields: ReceiptTransactionFields,
): ExpenseTransactionPatch {
  return {
    merchant: fields.merchant,
    amount: fields.amount,
    date: fields.date,
    category: fields.category,
    billableStatus: fields.billableStatus,
    workOrderNumber: fields.workOrderNumber ?? null,
    cardLastFour: fields.cardLastFour ?? null,
    vendorName: fields.vendorName ?? null,
    propertyName: fields.propertyName ?? null,
  };
}

export function applyTransactionFieldsToScannedReceipt(
  receipt: ScannedReceipt,
  fields: ReceiptTransactionFields,
): ScannedReceipt {
  return {
    ...receipt,
    merchant: fields.merchant.trim() || receipt.merchant,
    amount: fields.amount,
    date: fields.date,
    category: fields.category,
    categoryReason:
      fields.category !== receipt.category
        ? "Updated manually"
        : receipt.categoryReason,
    billableStatus: fields.billableStatus,
    billableReason:
      fields.billableStatus !== receipt.billableStatus
        ? "Updated manually"
        : receipt.billableReason,
    billableSource:
      fields.billableStatus !== receipt.billableStatus
        ? "manual"
        : receipt.billableSource,
    workOrderNumber: fields.workOrderNumber ?? null,
    cardLastFour: fields.cardLastFour ?? null,
    vendorName: fields.vendorName ?? null,
    propertyName: fields.propertyName ?? null,
  };
}

export function toDateInputValue(date: string): string {
  const match = date.trim().match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : "";
}
