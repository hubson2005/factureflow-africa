-- Stub minimal pour simuler auth.role() de Supabase en local
create schema if not exists auth;
create or replace function auth.role() returns text as $$
  select 'authenticated'::text;
$$ language sql stable;
