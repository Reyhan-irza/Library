-- VIREON Phase 3: staff-only overdue maintenance and safe inventory editing.
-- Run after 202609200001_phase2_borrowing_workflow.sql.

begin;

create or replace function public.admin_mark_overdue_borrowings()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  changed_count integer;
begin
  if auth.uid() is null or not public.is_library_staff() then
    raise exception 'Akses ditolak';
  end if;

  update public.borrowings
  set status = 'overdue',
      fine = greatest(0, current_date - due_date) * 1000
  where status = 'borrowed'
    and due_date is not null
    and due_date < current_date;

  get diagnostics changed_count = row_count;

  if changed_count > 0 then
    insert into public.activity_logs (user_id, type, description)
    values (
      auth.uid(),
      'overdue_marked',
      changed_count || ' peminjaman ditandai terlambat'
    );
  end if;

  return changed_count;
end;
$$;

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

  select * into book_row
  from public.books
  where id = p_book_id
  for update;

  if book_row.id is null then
    raise exception 'Buku tidak ditemukan';
  end if;

  select coalesce(sum(quantity), 0)::integer
  into active_quantity
  from public.borrowings
  where book_id = p_book_id
    and status in ('borrowed', 'overdue');

  if p_stock < active_quantity then
    raise exception 'Stok baru tidak boleh lebih kecil dari jumlah buku yang sedang dipinjam';
  end if;

  update public.books
  set stock = p_stock,
      available_stock = p_stock - active_quantity
  where id = p_book_id;

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

-- Keep fines auditable when a staff member records a late return.
create or replace function public.admin_return_borrowing(
  p_borrowing_id integer,
  p_return_condition text default 'GOOD',
  p_return_notes text default null
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  borrowing_row public.borrowings%rowtype;
begin
  if auth.uid() is null or not public.is_library_staff() then
    raise exception 'Akses ditolak';
  end if;
  if p_return_condition not in ('GOOD', 'MINOR_DAMAGE', 'MAJOR_DAMAGE', 'LOST') then
    raise exception 'Kondisi buku tidak valid';
  end if;

  select * into borrowing_row
  from public.borrowings
  where id = p_borrowing_id
  for update;

  if borrowing_row.id is null or borrowing_row.status not in ('borrowed', 'overdue') then
    raise exception 'Transaksi tidak aktif atau tidak ditemukan';
  end if;

  update public.borrowings
  set return_date = current_date,
      fine = coalesce(greatest(0, current_date - borrowing_row.due_date), 0) * 1000,
      returned_at = now(),
      returned_by = auth.uid(),
      return_condition = p_return_condition,
      return_notes = nullif(btrim(p_return_notes), ''),
      status = 'returned'
  where id = p_borrowing_id;

  if p_return_condition <> 'LOST' then
    update public.books
    set available_stock = least(stock, available_stock + borrowing_row.quantity)
    where id = borrowing_row.book_id;
  end if;

  insert into public.activity_logs (user_id, type, description)
  values (auth.uid(), 'return', 'Pengembalian ' || coalesce(borrowing_row.request_code, '#' || p_borrowing_id));

  return p_borrowing_id;
end;
$$;

revoke all on function public.admin_mark_overdue_borrowings() from public;
grant execute on function public.admin_mark_overdue_borrowings() to authenticated;

revoke all on function public.admin_update_book_inventory(integer, integer) from public;
grant execute on function public.admin_update_book_inventory(integer, integer) to authenticated;

revoke all on function public.admin_return_borrowing(integer, text, text) from public;
grant execute on function public.admin_return_borrowing(integer, text, text) to authenticated;

notify pgrst, 'reload schema';
commit;