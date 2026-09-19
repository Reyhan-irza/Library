-- Public landing totals only. Apply this migration in the existing Supabase
-- project as its database owner; it does not grant access to individual rows.
begin;

create or replace function public.get_public_library_stats()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select pg_catalog.jsonb_build_object(
    'totalBooks', (select count(*) from public.books),
    'totalMembers', (select count(*) from public.members),
    'totalBorrowings', (select count(*) from public.borrowings),
    'availableBooks', (select count(*) from public.books where available_stock > 0)
  );
$$;

-- PostgreSQL grants new functions to PUBLIC by default; narrow this explicitly.
revoke all on function public.get_public_library_stats() from public;
grant execute on function public.get_public_library_stats() to anon, authenticated;

comment on function public.get_public_library_stats() is
  'Public aggregate counts only. Books are distinct titles, available books are titles with stock > 0. No member or borrowing records are exposed.';

notify pgrst, 'reload schema';
commit;