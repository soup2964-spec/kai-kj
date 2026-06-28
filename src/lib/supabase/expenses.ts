import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeBillableFields } from "@/lib/billable-engine";
import { normalizeCardLastFour } from "@/lib/card-last-four";
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
    cardLastFour: normalizeCardLastFour(row.card_last_four),
    receiptImage: row.receipt_image ?? undefined,
    createdAt: row.created_at,
    ...normalizeBillableFields({
      billableStatus: row.billable_status,
      billableReason: row.billable_reason,
      billableSource: row.billable_source,
      matchedRuleId: row.matched_rule_id ?? undefined,
    }),
  };
}

function expenseToInsert(expense: Expense, clerkUserId: string): ExpenseInsert {
  return {
    id: expense.id,
    clerk_user_id: clerkUserId,
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
    receipt_image: expense.receiptImage ?? null,
    created_at: expense.createdAt,
  };
}

export async function fetchExpensesForUser(
  supabase: SupabaseClient<Database>,
  clerkUserId: string,
): Promise<Expense[]> {
  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .eq("clerk_user_id", clerkUserId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(rowToExpense);
}

export async function insertExpenseForUser(
  supabase: SupabaseClient<Database>,
  expense: Expense,
  clerkUserId: string,
): Promise<Expense> {
  const { data, error } = await supabase
    .from("expenses")
    .insert(expenseToInsert(expense, clerkUserId))
    .select("*")
    .single();

  if (error) throw error;
  return rowToExpense(data);
}

export async function deleteExpenseForUser(
  supabase: SupabaseClient<Database>,
  expenseId: string,
  clerkUserId: string,
): Promise<void> {
  const { error } = await supabase
    .from("expenses")
    .delete()
    .eq("id", expenseId)
    .eq("clerk_user_id", clerkUserId);

  if (error) throw error;
}
