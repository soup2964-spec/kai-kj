import type { SupabaseClient } from "@supabase/supabase-js";
import type { SupportComplaint, SupportComplaintStatus } from "@/lib/types";
import type { Database } from "./database.types";

type ComplaintRow = Database["public"]["Tables"]["support_complaints"]["Row"];
type ComplaintInsert = Database["public"]["Tables"]["support_complaints"]["Insert"];

function rowToComplaint(row: ComplaintRow): SupportComplaint {
  return {
    id: row.id,
    subject: row.subject,
    message: row.message,
    status: row.status,
    createdAt: row.created_at,
  };
}

function normalizeStatus(value: unknown): SupportComplaintStatus {
  return value === "resolved" ? "resolved" : "open";
}

export function parseSupportComplaintInput(value: unknown): {
  subject: string;
  message: string;
} {
  if (!value || typeof value !== "object") {
    throw new Error("Complaint payload is required.");
  }

  const input = value as Record<string, unknown>;
  const subject = typeof input.subject === "string" ? input.subject.trim() : "";
  const message = typeof input.message === "string" ? input.message.trim() : "";

  if (subject.length < 3) {
    throw new Error("Subject must be at least 3 characters.");
  }

  if (message.length < 10) {
    throw new Error("Message must be at least 10 characters.");
  }

  if (subject.length > 200) {
    throw new Error("Subject must be 200 characters or fewer.");
  }

  if (message.length > 5000) {
    throw new Error("Message must be 5000 characters or fewer.");
  }

  return { subject, message };
}

export async function fetchSupportComplaintsForOwner(
  supabase: SupabaseClient<Database>,
  ownerId: string,
): Promise<SupportComplaint[]> {
  const { data, error } = await supabase
    .from("support_complaints")
    .select("*")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map(rowToComplaint);
}

export async function insertSupportComplaintForOwner(
  supabase: SupabaseClient<Database>,
  ownerId: string,
  input: { subject: string; message: string },
): Promise<SupportComplaint> {
  const payload: ComplaintInsert = {
    owner_id: ownerId,
    subject: input.subject,
    message: input.message,
    status: "open",
  };

  const { data, error } = await supabase
    .from("support_complaints")
    .insert(payload)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Could not save complaint.");
  }

  return rowToComplaint(data);
}

export function createLocalSupportComplaint(input: {
  subject: string;
  message: string;
}): SupportComplaint {
  return {
    id: crypto.randomUUID(),
    subject: input.subject,
    message: input.message,
    status: normalizeStatus("open"),
    createdAt: new Date().toISOString(),
  };
}
