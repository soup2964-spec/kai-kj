alter table public.expenses
  add column if not exists card_last_four text,
  add column if not exists work_order_number text;
