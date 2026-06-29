export type CcLedgerSheetStatus = "ORANGE" | "GREEN" | "";

export interface CcLedgerRowInput {
  date: string;
  merchant: string;
  amount: number;
  category: string;
  billableStatus: string;
  billableReason?: string;
  workOrderNumber?: string | null;
  cardLastFour?: string | null;
  sheetStatus?: CcLedgerSheetStatus;
  reconciled?: boolean;
  expenseId: string;
}
