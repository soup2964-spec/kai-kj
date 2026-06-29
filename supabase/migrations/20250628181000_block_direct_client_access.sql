-- Block direct browser/client access; server uses service role via API routes.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'statement_uploads' and policyname = 'Block direct client access'
  ) then
    create policy "Block direct client access" on public.statement_uploads as restrictive for all using (false) with check (false);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'statement_transactions' and policyname = 'Block direct client access'
  ) then
    create policy "Block direct client access" on public.statement_transactions as restrictive for all using (false) with check (false);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'owner_integrations' and policyname = 'Block direct client access'
  ) then
    create policy "Block direct client access" on public.owner_integrations as restrictive for all using (false) with check (false);
  end if;
end $$;
