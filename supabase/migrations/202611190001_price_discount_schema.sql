-- Apply once in the Supabase SQL Editor (or through Supabase CLI).
-- Keeps the existing invoices table intact while adding the discount columns
-- used by the application, and creates the products table expected by /prices.
alter table public.invoices
  add column if not exists subtotal numeric(14,2) not null default 0,
  add column if not exists invoice_discount_percent numeric(7,2) not null default 0,
  add column if not exists invoice_discount_amount numeric(14,2) not null default 0;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  price numeric(14,2) not null default 0,
  updated_at timestamptz not null default now()
);
create index if not exists products_category_name_idx on public.products(category,name);
create unique index if not exists products_name_unique_idx on public.products(name);

alter table public.products enable row level security;
grant select, insert, update, delete on public.products to authenticated;
drop policy if exists "authenticated users manage products" on public.products;
create policy "authenticated users manage products" on public.products for all to authenticated
  using ((select auth.uid()) is not null)
  with check ((select auth.uid()) is not null);

notify pgrst, 'reload schema';
