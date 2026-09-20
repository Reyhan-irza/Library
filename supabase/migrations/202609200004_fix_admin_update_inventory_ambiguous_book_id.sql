-- Fix the inventory RPC where the OUT column `book_id` conflicted with
-- borrowings.book_id inside the active-loan aggregate.
-- Run after 202609200002_phase3_admin_controls.sql.

begin;

create or replace function public.admin_update_book_inventory(
  p_book_id integer,
  p_stock integer
)
returns table (book_id integer, total_stock integer, available_stock integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  book_row public.books%rowtype;
  active_quantity integer;
begin
  if auth.uid() is null or not public.is_library_staff() then
    raise exception 'Akses ditolak';
  end if;
  if p_stock is null or p_stock < 0 then
    raise exception 'Stok tidak boleh negatif';
  end if;

  select *
  into book_row
  from public.books as b
  where b.id = p_book_id
  for update;

  if book_row.id is null then
    raise exception 'Buku tidak ditemukan';
  end if;

  select coalesce(sum(borrowing.quantity), 0)::integer
  into active_quantity
  from public.borrowings as borrowing
  where borrowing.book_id = p_book_id
    and borrowing.status in ('borrowed', 'overdue');

  if p_stock < active_quantity then
    raise exception 'Stok baru tidak boleh lebih kecil dari jumlah buku yang sedang dipinjam';
  end if;

  update public.books as b
  set stock = p_stock,
      available_stock = p_stock - active_quantity
  where b.id = p_book_id;

  insert into public.activity_logs (user_id, type, description)
  values (
    auth.uid(),
    'inventory_updated',
    'Stok buku ' || coalesce(book_row.title, '#' || p_book_id) ||
      ' diperbarui menjadi ' || p_stock
  );

  return query
  select p_book_id, p_stock, p_stock - active_quantity;
end;
$$;

revoke all on function public.admin_update_book_inventory(integer, integer) from public;
grant execute on function public.admin_update_book_inventory(integer, integer) to authenticated;

notify pgrst, 'reload schema';
commit;