create table if not exists public.support_complaints (
  id uuid primary key default gen_random_uuid(),
  owner_id text not null,
  subject text not null,
  message text not null,
  status text not null default 'open' check (status in ('open', 'resolved')),
  created_at timestamptz not null default now()
);

create index if not exists support_complaints_owner_created_idx
  on public.support_complaints (owner_id, created_at desc);

alter table public.support_complaints enable row level security;
