create table if not exists public.owner_integrations (
  owner_id text primary key,
  google_sheets_cc_ledger_id text,
  google_sheets_connected_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.owner_integrations enable row level security;
