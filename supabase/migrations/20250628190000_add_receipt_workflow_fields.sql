alter table public.expenses
  add column if not exists inbox_status text not null default 'new'
    check (inbox_status in ('new', 'needs_review', 'approved', 'exported', 'reconciled')),
  add column if not exists reconciliation_status text not null default 'unmatched'
    check (reconciliation_status in ('unmatched', 'matched', 'missing_receipt', 'missing_transaction')),
  add column if not exists property_name text,
  add column if not exists vendor_name text,
  add column if not exists duplicate_of_id text;

