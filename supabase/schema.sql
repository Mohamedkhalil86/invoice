create table if not exists public.invoices (
  id text primary key,
  number text not null unique,
  client text not null,
  items jsonb not null default '[]'::jsonb,
  date timestamptz not null,
  total numeric(14, 2) not null default 0,
  creator text not null default 'Mahmoud Hany',
  created_at timestamptz not null default now()
);

alter table public.invoices enable row level security;
revoke all on table public.invoices from anon, public;
grant select, insert, update, delete on table public.invoices to authenticated;

drop policy if exists "demo invoices are readable" on public.invoices;
drop policy if exists "demo invoices can be added" on public.invoices;
drop policy if exists "demo invoices can be updated" on public.invoices;
drop policy if exists "demo invoices can be deleted" on public.invoices;
drop policy if exists "authenticated users can read invoices" on public.invoices;
drop policy if exists "authenticated users can add invoices" on public.invoices;
drop policy if exists "authenticated users can update invoices" on public.invoices;
drop policy if exists "authenticated users can delete invoices" on public.invoices;

create policy "authenticated users can read invoices" on public.invoices
  for select to authenticated using ((select auth.uid()) is not null);
create policy "authenticated users can add invoices" on public.invoices
  for insert to authenticated with check ((select auth.uid()) is not null);
create policy "authenticated users can update invoices" on public.invoices
  for update to authenticated using ((select auth.uid()) is not null)
  with check ((select auth.uid()) is not null);
create policy "authenticated users can delete invoices" on public.invoices
  for delete to authenticated using ((select auth.uid()) is not null);
