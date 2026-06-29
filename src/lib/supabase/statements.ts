import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ParsedStatement,
  StatementSourceType,
  StatementTransaction,
  StatementUpload,
} from "@/lib/statement-types";
import type { Database } from "./database.types";

type UploadRow = Database["public"]["Tables"]["statement_uploads"]["Row"];
type TxnRow = Database["public"]["Tables"]["statement_transactions"]["Row"];

function uploadRowToModel(row: UploadRow): StatementUpload {
  return {
    id: row.id,
    ownerId: row.owner_id,
    filename: row.filename,
    cardLastFour: row.card_last_four,
    statementPeriod: row.statement_period,
    sourceType: row.source_type as StatementSourceType,
    transactionCount: row.transaction_count,
    createdAt: row.created_at,
  };
}

function txnRowToModel(row: TxnRow): StatementTransaction {
  return {
    id: row.id,
    uploadId: row.upload_id,
    ownerId: row.owner_id,
    cardLastFour: row.card_last_four,
    txnDate: row.txn_date,
    merchant: row.merchant,
    amount: Number(row.amount),
    description: row.description,
    matchedExpenseId: row.matched_expense_id,
    createdAt: row.created_at,
  };
}

export async function fetchStatementUploadsForOwner(
  supabase: SupabaseClient<Database>,
  ownerId: string,
): Promise<StatementUpload[]> {
  const { data, error } = await supabase
    .from("statement_uploads")
    .select("*")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(uploadRowToModel);
}

export async function fetchStatementTransactionsForOwner(
  supabase: SupabaseClient<Database>,
  ownerId: string,
  uploadId?: string,
): Promise<StatementTransaction[]> {
  let query = supabase
    .from("statement_transactions")
    .select("*")
    .eq("owner_id", ownerId)
    .order("txn_date", { ascending: false });

  if (uploadId) {
    query = query.eq("upload_id", uploadId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(txnRowToModel);
}

export async function insertStatementUpload(
  supabase: SupabaseClient<Database>,
  ownerId: string,
  filename: string,
  sourceType: StatementSourceType,
  parsed: ParsedStatement,
): Promise<{ upload: StatementUpload; transactions: StatementTransaction[] }> {
  const uploadId = crypto.randomUUID();

  const { error: uploadError } = await supabase.from("statement_uploads").insert({
    id: uploadId,
    owner_id: ownerId,
    filename,
    card_last_four: parsed.cardLastFour ?? null,
    statement_period: parsed.statementPeriod ?? null,
    source_type: sourceType,
    transaction_count: parsed.transactions.length,
  });

  if (uploadError) throw uploadError;

  const txnRows = parsed.transactions.map((txn) => ({
    id: crypto.randomUUID(),
    upload_id: uploadId,
    owner_id: ownerId,
    card_last_four: txn.cardLastFour ?? parsed.cardLastFour ?? null,
    txn_date: txn.txnDate,
    merchant: txn.merchant,
    amount: txn.amount,
    description: txn.description ?? null,
  }));

  if (txnRows.length > 0) {
    const { error: txnError } = await supabase
      .from("statement_transactions")
      .insert(txnRows);

    if (txnError) throw txnError;
  }

  const { data: uploadData, error: fetchUploadError } = await supabase
    .from("statement_uploads")
    .select("*")
    .eq("id", uploadId)
    .single();

  if (fetchUploadError || !uploadData) throw fetchUploadError;

  const transactions = await fetchStatementTransactionsForOwner(
    supabase,
    ownerId,
    uploadId,
  );

  return {
    upload: uploadRowToModel(uploadData),
    transactions,
  };
}

export async function markStatementTransactionMatched(
  supabase: SupabaseClient<Database>,
  statementTransactionId: string,
  ownerId: string,
  expenseId: string,
): Promise<StatementTransaction> {
  const { data, error } = await supabase
    .from("statement_transactions")
    .update({ matched_expense_id: expenseId })
    .eq("id", statementTransactionId)
    .eq("owner_id", ownerId)
    .select("*")
    .single();

  if (error) throw error;
  return txnRowToModel(data);
}
