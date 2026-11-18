-- Run this in Supabase SQL Editor for the existing public.invoices table.
-- The publishable key maps unauthenticated requests to the anon database role.
grant usage on schema public to anon;
grant select, insert, update, delete on table public.invoices to anon;
