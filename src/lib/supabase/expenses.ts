import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeBillableFields } from "@/lib/billable-engine";
import { normalizeLineItems } from "@/lib/receipt-line-items";
import type { Expense } from "@/lib/types";
import type { Database } from "./database.types";

type ExpenseRow = Database["public"]["Tables"]["expenses"]["Row"];
type ExpenseInsert = Database["public"]["Tables"]["expenses"]["Insert"];

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
    createdAt: row.created_at,
    ...normalizeBillableFields({
      billableStatus: row.billable_status,
      billableReason: row.billable_reason,
      billableSource: row.billable_source,
      matchedRuleId: row.matched_rule_id ?? undefined,
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
    receipt_image: null,
    created_at: expense.createdAt,
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
