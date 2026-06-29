alter table public.owner_integrations
  add column if not exists google_sheets_layout_config jsonb;
