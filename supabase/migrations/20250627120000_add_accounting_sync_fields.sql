alter table public.expenses
  add column if not exists accounting_status text not null default 'pending'
    check (accounting_status in ('pending', 'rejected', 'synced', 'failed')),
  add column if not exists accounting_synced_at timestamptz,
  add column if not exists accounting_reference text,
  add column if not exists accounting_error text;
