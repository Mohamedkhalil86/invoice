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
grant usage on schema public to anon;
grant select, insert, update, delete on table public.invoices to anon;

-- Demo policy: allow access with the anon key. Replace this with authenticated
-- policies before using the app for confidential or production invoice data.
create policy "demo invoices are readable" on public.invoices
  for select to anon using (true);
create policy "demo invoices can be added" on public.invoices
  for insert to anon with check (true);
create policy "demo invoices can be updated" on public.invoices
  for update to anon using (true) with check (true);
create policy "demo invoices can be deleted" on public.invoices
  for delete to anon using (true);
