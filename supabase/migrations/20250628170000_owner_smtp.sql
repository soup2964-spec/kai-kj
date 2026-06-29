alter table public.owner_integrations
  add column if not exists smtp_host text,
  add column if not exists smtp_port integer,
  add column if not exists smtp_user text,
  add column if not exists smtp_password text,
  add column if not exists smtp_from text,
  add column if not exists smtp_connected_at timestamptz;
