alter table public.expenses
  add column if not exists credit_card_reconciled boolean not null default false,
  add column if not exists statement_transaction_id uuid
    references public.statement_transactions (id) on delete set null;

create index if not exists expenses_statement_transaction_idx
  on public.expenses (statement_transaction_id)
  where statement_transaction_id is not null;
