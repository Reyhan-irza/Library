-- Fix the existing Phase 2 admin borrowing RPC.
-- The function's OUT column named `id` conflicted with unqualified books.id
-- references inside PL/pgSQL.

begin;

create or replace function public.admin_create_borrowing(
  p_member_id integer,
  p_book_id integer,
  p_quantity integer,
  p_borrowing_type text,
  p_due_date date,
  p_notes text default null
)
returns table (id integer, request_code text)
language plpgsql
security definer
set search_path = public
as $$
declare
  available integer;
  created_id integer;
  created_code text;
begin
  if auth.uid() is null or not public.is_library_staff() then
    raise exception 'Akses ditolak';
  end if;
  if p_quantity is null or p_quantity < 1 then
    raise exception 'Jumlah peminjaman harus minimal 1';
  end if;
  if p_borrowing_type not in ('PERSONAL', 'CLASS_REPRESENTATIVE') then
    raise exception 'Jenis peminjaman tidak valid';
  end if;
  if p_due_date is null or p_due_date < current_date then
    raise exception 'Tanggal jatuh tempo tidak valid';
  end if;
  if not exists (
    select 1
    from public.members as m
    where m.id = p_member_id
  ) then
    raise exception 'Anggota tidak ditemukan';
  end if;

  select b.available_stock
  into available
  from public.books as b
  where b.id = p_book_id
  for update;

  if available is null then
    raise exception 'Buku tidak ditemukan';
  end if;
  if available < p_quantity then
    raise exception 'Jumlah melebihi stok yang tersedia';
  end if;

  update public.books as b
  set available_stock = b.available_stock - p_quantity
  where b.id = p_book_id;

  insert into public.borrowings (
    member_id, book_id, due_date, status, quantity, borrowing_method,
    borrowing_type, notes, created_by
  )
  values (
    p_member_id, p_book_id, p_due_date, 'borrowed', p_quantity,
    'ADMIN_ASSISTED', p_borrowing_type, nullif(btrim(p_notes), ''), auth.uid()
  )
  returning public.borrowings.id, public.borrowings.request_code
  into created_id, created_code;

  insert into public.activity_logs (user_id, type, description)
  values (auth.uid(), 'borrow', 'Peminjaman admin ' || created_code || ' dibuat');

  return query select created_id, created_code;
end;
$$;

revoke all on function public.admin_create_borrowing(integer, integer, integer, text, date, text) from public;
grant execute on function public.admin_create_borrowing(integer, integer, integer, text, date, text) to authenticated;

notify pgrst, 'reload schema';
commit;