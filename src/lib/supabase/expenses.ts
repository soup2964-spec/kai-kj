import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeAccountingFields } from "@/lib/accounting-fields";
import { normalizeBillableFields } from "@/lib/billable-engine";
import { normalizeCardLastFour } from "@/lib/card-last-four";
import { normalizeLineItems } from "@/lib/receipt-line-items";
import { normalizeWorkOrderNumber } from "@/lib/work-order";
import type { AccountingSyncStatus, Expense } from "@/lib/types";
import type { Database } from "./database.types";

type ExpenseRow = Database["public"]["Tables"]["expenses"]["Row"];
type ExpenseInsert = Database["public"]["Tables"]["expenses"]["Insert"];
type ExpenseUpdate = Database["public"]["Tables"]["expenses"]["Update"];

function rowToExpense(row: ExpenseRow): Expense {
  return {
    id: row.id,
    merchant: row.merchant,
    amount: Number(row.amount),
    date: row.date,
    category: row.category as Expense["category"],
    categoryReason: row.category_reason,
    lineItems: normalizeLineItems(
      (row.line_items as unknown as Expense["lineItems"]) ?? [],
    ),
    confidence: Number(row.confidence),
    cardLastFour: normalizeCardLastFour(row.card_last_four),
    workOrderNumber: normalizeWorkOrderNumber(row.work_order_number),
    receiptImage: row.receipt_image ?? undefined,
    createdAt: row.created_at,
    ...normalizeBillableFields({
      billableStatus: row.billable_status,
      billableReason: row.billable_reason,
      billableSource: row.billable_source,
      matchedRuleId: row.matched_rule_id ?? undefined,
    }),
    ...normalizeAccountingFields({
      accountingStatus: row.accounting_status,
      accountingSyncedAt: row.accounting_synced_at ?? undefined,
      accountingReference: row.accounting_reference ?? undefined,
      accountingError: row.accounting_error ?? undefined,
    }),
  };
}

function expenseToInsert(expense: Expense, ownerId: string): ExpenseInsert {
  return {
    id: expense.id,
    owner_id: ownerId,
    merchant: expense.merchant,
    amount: expense.amount,
    date: expense.date,
    category: expense.category,
    category_reason: expense.categoryReason,
    line_items: expense.lineItems as unknown as ExpenseInsert["line_items"],
    confidence: expense.confidence,
    billable_status: expense.billableStatus,
    billable_reason: expense.billableReason,
    billable_source: expense.billableSource,
    matched_rule_id: expense.matchedRuleId ?? null,
    card_last_four: expense.cardLastFour ?? null,
    work_order_number: expense.workOrderNumber ?? null,
    receipt_image: null,
    accounting_status: expense.accountingStatus,
    accounting_synced_at: expense.accountingSyncedAt ?? null,
    accounting_reference: expense.accountingReference ?? null,
    accounting_error: expense.accountingError ?? null,
    created_at: expense.createdAt,
  };
}

function expenseToUpdate(expense: Expense): ExpenseUpdate {
  return {
    billable_status: expense.billableStatus,
    billable_reason: expense.billableReason,
    billable_source: expense.billableSource,
    matched_rule_id: expense.matchedRuleId ?? null,
    card_last_four: expense.cardLastFour ?? null,
    work_order_number: expense.workOrderNumber ?? null,
  };
}

export async function fetchExpensesForOwner(
  supabase: SupabaseClient<Database>,
  ownerId: string,
): Promise<Expense[]> {
  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(rowToExpense);
}

export async function fetchExpenseForOwner(
  supabase: SupabaseClient<Database>,
  expenseId: string,
  ownerId: string,
): Promise<Expense> {
  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .eq("id", expenseId)
    .eq("owner_id", ownerId)
    .single();

  if (error) throw error;
  return rowToExpense(data);
}

export async function insertExpenseForOwner(
  supabase: SupabaseClient<Database>,
  expense: Expense,
  ownerId: string,
): Promise<Expense> {
  const { data, error } = await supabase
    .from("expenses")
    .insert(expenseToInsert(expense, ownerId))
    .select("*")
    .single();

  if (error) throw error;
  return rowToExpense(data);
}

export async function updateExpenseForOwner(
  supabase: SupabaseClient<Database>,
  expense: Expense,
  ownerId: string,
): Promise<Expense> {
  const { data, error } = await supabase
    .from("expenses")
    .update(expenseToUpdate(expense))
    .eq("id", expense.id)
    .eq("owner_id", ownerId)
    .select("*")
    .single();

  if (error) throw error;
  return rowToExpense(data);
}

export async function updateExpenseAccountingForOwner(
  supabase: SupabaseClient<Database>,
  expenseId: string,
  ownerId: string,
  update: {
    accountingStatus: AccountingSyncStatus;
    accountingSyncedAt?: string | null;
    accountingReference?: string | null;
    accountingError?: string | null;
  },
): Promise<Expense> {
  const payload: ExpenseUpdate = {
    accounting_status: update.accountingStatus,
    accounting_synced_at: update.accountingSyncedAt ?? null,
    accounting_reference: update.accountingReference ?? null,
    accounting_error: update.accountingError ?? null,
  };

  const { data, error } = await supabase
    .from("expenses")
    .update(payload)
    .eq("id", expenseId)
    .eq("owner_id", ownerId)
    .select("*")
    .single();

  if (error) throw error;
  return rowToExpense(data);
}

export async function deleteExpenseForOwner(
  supabase: SupabaseClient<Database>,
  expenseId: string,
  ownerId: string,
): Promise<void> {
  const { error } = await supabase
    .from("expenses")
    .delete()
    .eq("id", expenseId)
    .eq("owner_id", ownerId);

  if (error) throw error;
}
