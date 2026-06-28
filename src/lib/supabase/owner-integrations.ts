import type { SupabaseClient } from "@supabase/supabase-js";
import type { OwnerGoogleSheetsIntegration } from "@/lib/integrations-types";
import type { Database } from "./database.types";

type IntegrationRow = Database["public"]["Tables"]["owner_integrations"]["Row"];

function rowToIntegration(row: IntegrationRow): OwnerGoogleSheetsIntegration {
  return {
    ownerId: row.owner_id,
    googleSheetsCcLedgerId: row.google_sheets_cc_ledger_id,
    googleSheetsConnectedAt: row.google_sheets_connected_at,
    googleSheetsLayoutConfig: row.google_sheets_layout_config,
    slackWebhookUrl: row.slack_webhook_url,
    slackTeamName: row.slack_team_name,
    slackChannelName: row.slack_channel_name,
    slackConnectedAt: row.slack_connected_at,
    notifyEmails: row.notify_emails,
    notifyEmailsUpdatedAt: row.notify_emails_updated_at,
    smtpHost: row.smtp_host,
    smtpPort: row.smtp_port,
    smtpUser: row.smtp_user,
    smtpPassword: row.smtp_password,
    smtpFrom: row.smtp_from,
    smtpConnectedAt: row.smtp_connected_at,
    updatedAt: row.updated_at,
  };
}

export async function fetchOwnerIntegrations(
  supabase: SupabaseClient<Database>,
  ownerId: string,
): Promise<OwnerGoogleSheetsIntegration | null> {
  const { data, error } = await supabase
    .from("owner_integrations")
    .select("*")
    .eq("owner_id", ownerId)
    .maybeSingle();

  if (error) throw error;
  return data ? rowToIntegration(data) : null;
}

export async function upsertOwnerGoogleSheetsLedger(
  supabase: SupabaseClient<Database>,
  ownerId: string,
  spreadsheetId: string,
): Promise<OwnerGoogleSheetsIntegration> {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("owner_integrations")
    .upsert(
      {
        owner_id: ownerId,
        google_sheets_cc_ledger_id: spreadsheetId,
        google_sheets_connected_at: now,
        updated_at: now,
      },
      { onConflict: "owner_id" },
    )
    .select("*")
    .single();

  if (error) throw error;
  return rowToIntegration(data);
}

export async function upsertOwnerGoogleSheetsLayout(
  supabase: SupabaseClient<Database>,
  ownerId: string,
  layoutConfig: Record<string, unknown>,
): Promise<OwnerGoogleSheetsIntegration> {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("owner_integrations")
    .upsert(
      {
        owner_id: ownerId,
        google_sheets_layout_config: layoutConfig,
        updated_at: now,
      },
      { onConflict: "owner_id" },
    )
    .select("*")
    .single();

  if (error) throw error;
  return rowToIntegration(data);
}

export async function upsertOwnerSlackIntegration(
  supabase: SupabaseClient<Database>,
  ownerId: string,
  input: {
    webhookUrl: string;
    teamName: string | null;
    channelName: string | null;
  },
): Promise<OwnerGoogleSheetsIntegration> {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("owner_integrations")
    .upsert(
      {
        owner_id: ownerId,
        slack_webhook_url: input.webhookUrl,
        slack_team_name: input.teamName,
        slack_channel_name: input.channelName,
        slack_connected_at: now,
        updated_at: now,
      },
      { onConflict: "owner_id" },
    )
    .select("*")
    .single();

  if (error) throw error;
  return rowToIntegration(data);
}

export async function clearOwnerSlackIntegration(
  supabase: SupabaseClient<Database>,
  ownerId: string,
): Promise<void> {
  const { error } = await supabase
    .from("owner_integrations")
    .upsert(
      {
        owner_id: ownerId,
        slack_webhook_url: null,
        slack_team_name: null,
        slack_channel_name: null,
        slack_connected_at: null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "owner_id" },
    );

  if (error) throw error;
}

export async function upsertOwnerNotifyEmails(
  supabase: SupabaseClient<Database>,
  ownerId: string,
  notifyEmails: string,
): Promise<OwnerGoogleSheetsIntegration> {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("owner_integrations")
    .upsert(
      {
        owner_id: ownerId,
        notify_emails: notifyEmails,
        notify_emails_updated_at: now,
        updated_at: now,
      },
      { onConflict: "owner_id" },
    )
    .select("*")
    .single();

  if (error) throw error;
  return rowToIntegration(data);
}

export async function upsertOwnerSmtpIntegration(
  supabase: SupabaseClient<Database>,
  ownerId: string,
  input: {
    host: string;
    port: number;
    user: string;
    password: string;
    from: string;
    notifyEmails?: string;
  },
): Promise<OwnerGoogleSheetsIntegration> {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("owner_integrations")
    .upsert(
      {
        owner_id: ownerId,
        smtp_host: input.host,
        smtp_port: input.port,
        smtp_user: input.user,
        smtp_password: input.password,
        smtp_from: input.from,
        smtp_connected_at: now,
        notify_emails: input.notifyEmails,
        notify_emails_updated_at: input.notifyEmails ? now : undefined,
        updated_at: now,
      },
      { onConflict: "owner_id" },
    )
    .select("*")
    .single();

  if (error) throw error;
  return rowToIntegration(data);
}

export async function clearOwnerSmtpIntegration(
  supabase: SupabaseClient<Database>,
  ownerId: string,
): Promise<void> {
  const { error } = await supabase
    .from("owner_integrations")
    .upsert(
      {
        owner_id: ownerId,
        smtp_host: null,
        smtp_port: null,
        smtp_user: null,
        smtp_password: null,
        smtp_from: null,
        smtp_connected_at: null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "owner_id" },
    );

  if (error) throw error;
}

export async function clearOwnerGoogleSheetsLedger(
  supabase: SupabaseClient<Database>,
  ownerId: string,
): Promise<void> {
  const { error } = await supabase
    .from("owner_integrations")
    .upsert(
      {
        owner_id: ownerId,
        google_sheets_cc_ledger_id: null,
        google_sheets_connected_at: null,
        google_sheets_layout_config: null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "owner_id" },
    );

  if (error) throw error;
}
