import { CATEGORY_META } from "@/lib/categories";
import type { Expense } from "@/lib/types";

export interface AccountingExportPayload {
  externalId: string;
  merchant: string;
  amount: number;
  currency: "USD";
  date: string;
  category: string;
  categoryLabel: string;
  billableStatus: Expense["billableStatus"];
  lineItems: Expense["lineItems"];
  memo: string;
}

export interface AccountingExportResult {
  referenceId: string;
  provider: string;
}

export function buildAccountingExportPayload(
  expense: Expense,
): AccountingExportPayload {
  const categoryLabel =
    CATEGORY_META[expense.category]?.label ?? expense.category;

  return {
    externalId: expense.id,
    merchant: expense.merchant,
    amount: expense.amount,
    currency: "USD",
    date: expense.date,
    category: expense.category,
    categoryLabel,
    billableStatus: expense.billableStatus,
    lineItems: expense.lineItems,
    memo: `${expense.merchant} · ${categoryLabel}`,
  };
}

export async function exportExpenseToAccounting(
  expense: Expense,
): Promise<AccountingExportResult> {
  const payload = buildAccountingExportPayload(expense);
  const webhookUrl = process.env.ACCOUNTING_WEBHOOK_URL?.trim();

  if (webhookUrl) {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.ACCOUNTING_WEBHOOK_SECRET
          ? {
              Authorization: `Bearer ${process.env.ACCOUNTING_WEBHOOK_SECRET}`,
            }
          : {}),
      },
      body: JSON.stringify({
        source: "kai-kj",
        expense: payload,
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(
        detail.trim() || "Accounting software rejected the export.",
      );
    }

    let referenceId = `KKP-${expense.id.slice(0, 8).toUpperCase()}`;

    try {
      const data = (await response.json()) as {
        referenceId?: string;
        id?: string;
      };
      referenceId = data.referenceId ?? data.id ?? referenceId;
    } catch {
      // Non-JSON success responses are fine.
    }

    return {
      referenceId,
      provider: process.env.ACCOUNTING_PROVIDER?.trim() || "accounting-webhook",
    };
  }

  return {
    referenceId: `KKP-${expense.id.slice(0, 8).toUpperCase()}`,
    provider: process.env.ACCOUNTING_PROVIDER?.trim() || "quickbooks",
  };
}
