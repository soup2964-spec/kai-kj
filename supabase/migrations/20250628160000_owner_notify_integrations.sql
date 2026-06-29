alter table public.owner_integrations
  add column if not exists slack_webhook_url text,
  add column if not exists slack_team_name text,
  add column if not exists slack_channel_name text,
  add column if not exists slack_connected_at timestamptz,
  add column if not exists notify_emails text,
  add column if not exists notify_emails_updated_at timestamptz;
