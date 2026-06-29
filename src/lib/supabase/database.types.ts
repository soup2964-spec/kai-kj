export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      expenses: {
        Row: {
          id: string;
          owner_id: string;
          merchant: string;
          amount: number;
          date: string;
          category: string;
          category_reason: string;
          line_items: Json;
          confidence: number;
          billable_status: "billable" | "non_billable" | "review";
          billable_reason: string;
          billable_source: "rule" | "default" | "manual";
          matched_rule_id: string | null;
          card_last_four: string | null;
          work_order_number: string | null;
          receipt_image: string | null;
          inbox_status: "new" | "needs_review" | "approved" | "exported" | "reconciled";
          reconciliation_status:
            | "unmatched"
            | "matched"
            | "missing_receipt"
            | "missing_transaction";
          property_name: string | null;
          vendor_name: string | null;
          duplicate_of_id: string | null;
          accounting_status: "pending" | "rejected" | "synced" | "failed";
          accounting_synced_at: string | null;
          accounting_reference: string | null;
          accounting_error: string | null;
          credit_card_reconciled: boolean;
          statement_transaction_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          merchant: string;
          amount: number;
          date: string;
          category: string;
          category_reason?: string;
          line_items?: Json;
          confidence?: number;
          billable_status: "billable" | "non_billable" | "review";
          billable_reason?: string;
          billable_source?: "rule" | "default" | "manual";
          matched_rule_id?: string | null;
          card_last_four?: string | null;
          work_order_number?: string | null;
          receipt_image?: string | null;
          inbox_status?: "new" | "needs_review" | "approved" | "exported" | "reconciled";
          reconciliation_status?:
            | "unmatched"
            | "matched"
            | "missing_receipt"
            | "missing_transaction";
          property_name?: string | null;
          vendor_name?: string | null;
          duplicate_of_id?: string | null;
          accounting_status?: "pending" | "rejected" | "synced" | "failed";
          accounting_synced_at?: string | null;
          accounting_reference?: string | null;
          accounting_error?: string | null;
          credit_card_reconciled?: boolean;
          statement_transaction_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          merchant?: string;
          amount?: number;
          date?: string;
          category?: string;
          category_reason?: string;
          line_items?: Json;
          confidence?: number;
          billable_status?: "billable" | "non_billable" | "review";
          billable_reason?: string;
          billable_source?: "rule" | "default" | "manual";
          matched_rule_id?: string | null;
          card_last_four?: string | null;
          work_order_number?: string | null;
          receipt_image?: string | null;
          inbox_status?: "new" | "needs_review" | "approved" | "exported" | "reconciled";
          reconciliation_status?:
            | "unmatched"
            | "matched"
            | "missing_receipt"
            | "missing_transaction";
          property_name?: string | null;
          vendor_name?: string | null;
          duplicate_of_id?: string | null;
          accounting_status?: "pending" | "rejected" | "synced" | "failed";
          accounting_synced_at?: string | null;
          accounting_reference?: string | null;
          accounting_error?: string | null;
          credit_card_reconciled?: boolean;
          statement_transaction_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      statement_uploads: {
        Row: {
          id: string;
          owner_id: string;
          filename: string;
          card_last_four: string | null;
          statement_period: string | null;
          source_type: "pdf" | "csv";
          transaction_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          filename: string;
          card_last_four?: string | null;
          statement_period?: string | null;
          source_type: "pdf" | "csv";
          transaction_count?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          filename?: string;
          card_last_four?: string | null;
          statement_period?: string | null;
          source_type?: "pdf" | "csv";
          transaction_count?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      statement_transactions: {
        Row: {
          id: string;
          upload_id: string;
          owner_id: string;
          card_last_four: string | null;
          txn_date: string;
          merchant: string;
          amount: number;
          description: string | null;
          matched_expense_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          upload_id: string;
          owner_id: string;
          card_last_four?: string | null;
          txn_date: string;
          merchant: string;
          amount: number;
          description?: string | null;
          matched_expense_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          upload_id?: string;
          owner_id?: string;
          card_last_four?: string | null;
          txn_date?: string;
          merchant?: string;
          amount?: number;
          description?: string | null;
          matched_expense_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      owner_integrations: {
        Row: {
          owner_id: string;
          google_sheets_cc_ledger_id: string | null;
          google_sheets_connected_at: string | null;
          google_sheets_layout_config: unknown | null;
          slack_webhook_url: string | null;
          slack_team_name: string | null;
          slack_channel_name: string | null;
          slack_connected_at: string | null;
          notify_emails: string | null;
          notify_emails_updated_at: string | null;
          smtp_host: string | null;
          smtp_port: number | null;
          smtp_user: string | null;
          smtp_password: string | null;
          smtp_from: string | null;
          smtp_connected_at: string | null;
          updated_at: string;
        };
        Insert: {
          owner_id: string;
          google_sheets_cc_ledger_id?: string | null;
          google_sheets_connected_at?: string | null;
          google_sheets_layout_config?: unknown | null;
          slack_webhook_url?: string | null;
          slack_team_name?: string | null;
          slack_channel_name?: string | null;
          slack_connected_at?: string | null;
          notify_emails?: string | null;
          notify_emails_updated_at?: string | null;
          smtp_host?: string | null;
          smtp_port?: number | null;
          smtp_user?: string | null;
          smtp_password?: string | null;
          smtp_from?: string | null;
          smtp_connected_at?: string | null;
          updated_at?: string;
        };
        Update: {
          owner_id?: string;
          google_sheets_cc_ledger_id?: string | null;
          google_sheets_connected_at?: string | null;
          google_sheets_layout_config?: unknown | null;
          slack_webhook_url?: string | null;
          slack_team_name?: string | null;
          slack_channel_name?: string | null;
          slack_connected_at?: string | null;
          notify_emails?: string | null;
          notify_emails_updated_at?: string | null;
          smtp_host?: string | null;
          smtp_port?: number | null;
          smtp_user?: string | null;
          smtp_password?: string | null;
          smtp_from?: string | null;
          smtp_connected_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      support_complaints: {
        Row: {
          id: string;
          owner_id: string;
          subject: string;
          message: string;
          status: "open" | "resolved";
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          subject: string;
          message: string;
          status?: "open" | "resolved";
          created_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          subject?: string;
          message?: string;
          status?: "open" | "resolved";
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
