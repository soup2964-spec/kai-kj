create table if not exists public.statement_uploads (
  id uuid primary key default gen_random_uuid(),
  owner_id text not null,
  filename text not null,
  card_last_four text,
  statement_period text,
  source_type text not null check (source_type in ('pdf', 'csv')),
  transaction_count integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.statement_transactions (
  id uuid primary key default gen_random_uuid(),
  upload_id uuid not null references public.statement_uploads (id) on delete cascade,
  owner_id text not null,
  card_last_four text,
  txn_date date not null,
  merchant text not null,
  amount numeric(12, 2) not null,
  description text,
  matched_expense_id uuid,
  created_at timestamptz not null default now()
);

create index if not exists statement_transactions_owner_card_date_idx
  on public.statement_transactions (owner_id, card_last_four, txn_date);

create index if not exists statement_uploads_owner_created_idx
  on public.statement_uploads (owner_id, created_at desc);

alter table public.statement_uploads enable row level security;
alter table public.statement_transactions enable row level security;
