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
          accounting_status: "pending" | "rejected" | "synced" | "failed";
          accounting_synced_at: string | null;
          accounting_reference: string | null;
          accounting_error: string | null;
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
          accounting_status?: "pending" | "rejected" | "synced" | "failed";
          accounting_synced_at?: string | null;
          accounting_reference?: string | null;
          accounting_error?: string | null;
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
          accounting_status?: "pending" | "rejected" | "synced" | "failed";
          accounting_synced_at?: string | null;
          accounting_reference?: string | null;
          accounting_error?: string | null;
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
