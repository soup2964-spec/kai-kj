export type StatementSourceType = "pdf" | "csv";

export interface StatementTransaction {
  id: string;
  uploadId: string;
  ownerId: string;
  cardLastFour?: string | null;
  txnDate: string;
  merchant: string;
  amount: number;
  description?: string | null;
  matchedExpenseId?: string | null;
  createdAt: string;
}

export interface StatementUpload {
  id: string;
  ownerId: string;
  filename: string;
  cardLastFour?: string | null;
  statementPeriod?: string | null;
  sourceType: StatementSourceType;
  transactionCount: number;
  createdAt: string;
}

export interface ParsedStatement {
  cardLastFour?: string | null;
  statementPeriod?: string | null;
  transactions: Omit<
    StatementTransaction,
    "id" | "uploadId" | "ownerId" | "createdAt" | "matchedExpenseId"
  >[];
  warnings: string[];
}
