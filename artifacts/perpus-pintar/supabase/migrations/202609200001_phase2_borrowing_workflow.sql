-- VIREON Phase 2: public catalog, self-service requests, and audited borrowing.
-- This migration extends the existing books/members/borrowings tables.

begin;

alter table public.books
  add column if not exists book_code text;

update public.books
set book_code = 'BOOK-' || lpad(id::text, 6, '0')
where book_code is null;

create unique index if not exists books_book_code_key
  on public.books (book_code)
  where book_code is not null;

create or replace function public.assign_book_code()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if new.book_code is null or btrim(new.book_code) = '' then
     new.book_code := 'BOOK-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 10));
  end if;
  return new;
end;
$$;

drop trigger if exists set_book_code on public.books;
create trigger set_book_code
before insert on public.books
for each row execute function public.assign_book_code();

alter table public.borrowings
  alter column member_id drop not null,
  alter column due_date drop not null;

alter table public.borrowings
  add column if not exists request_code text,
  add column if not exists quantity integer not null default 1,
  add column if not exists borrowing_method text not null default 'ADMIN_ASSISTED',
  add column if not exists borrowing_type text not null default 'PERSONAL',
  add column if not exists requester_name text,
  add column if not exists requester_class text,
  add column if not exists requester_student_id text,
  add column if not exists requester_contact text,
  add column if not exists approved_by uuid references auth.users(id) on delete set null,
  add column if not exists approved_at timestamptz,
  add column if not exists rejected_by uuid references auth.users(id) on delete set null,
  add column if not exists rejected_at timestamptz,
  add column if not exists rejection_reason text,
  add column if not exists returned_by uuid references auth.users(id) on delete set null,
  add column if not exists returned_at timestamptz,
  add column if not exists return_condition text,
  add column if not exists return_notes text;

update public.borrowings
set quantity = 1
where quantity is null or quantity < 1;

update public.borrowings
set borrowing_method = 'ADMIN_ASSISTED'
where borrowing_method is null or borrowing_method = '';

update public.borrowings
set borrowing_type = 'PERSONAL'
where borrowing_type is null or borrowing_type = '';

alter table public.borrowings
  drop constraint if exists borrowings_status_check,
  drop constraint if exists borrowings_quantity_check,
  drop constraint if exists borrowings_borrowing_method_check,
  drop constraint if exists borrowings_borrowing_type_check,
  add constraint borrowings_status_check
    check (status in ('pending', 'approved', 'rejected', 'borrowed', 'returned', 'overdue', 'cancelled')),
  add constraint borrowings_quantity_check
    check (quantity > 0),
  add constraint borrowings_borrowing_method_check
    check (borrowing_method in ('SELF_SERVICE', 'ADMIN_ASSISTED')),
  add constraint borrowings_borrowing_type_check
    check (borrowing_type in ('PERSONAL', 'CLASS_REPRESENTATIVE')),
  add constraint borrowings_return_condition_check
    check (return_condition is null or return_condition in ('GOOD', 'MINOR_DAMAGE', 'MAJOR_DAMAGE', 'LOST'));

create sequence if not exists public.borrowing_request_code_seq;

create or replace function public.next_request_code()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  candidate text;
begin
  loop
    candidate := 'VRN-' || to_char(current_date, 'YYYY') || '-' ||
      upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));
    exit when not exists (
      select 1 from public.borrowings where request_code = candidate
    );
  end loop;
  return candidate;
end;
$$;

update public.borrowings
set request_code = public.next_request_code()
where request_code is null;

create unique index if not exists borrowings_request_code_key
  on public.borrowings (request_code)
  where request_code is not null;

create index if not exists borrowings_status_created_at_idx
  on public.borrowings (status, created_at desc);

create index if not exists borrowings_requester_student_id_idx
  on public.borrowings (requester_student_id);

create index if not exists borrowings_book_id_idx
  on public.borrowings (book_id);

create or replace function public.assign_request_code()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if new.request_code is null or btrim(new.request_code) = '' then
    new.request_code := public.next_request_code();
  end if;
  return new;
end;
$$;

drop trigger if exists set_borrowing_request_code on public.borrowings;
create trigger set_borrowing_request_code
before insert on public.borrowings
for each row execute function public.assign_request_code();

-- Public catalog reads only the fields intentionally exposed to students.
create or replace function public.public_catalog_books(
  p_search text default null,
  p_category_id integer default null,
  p_available_only boolean default false
)
returns table (
  id integer,
  book_code text,
  isbn text,
  title text,
  author text,
  publisher text,
  publication_year integer,
  description text,
  pages integer,
  cover_url text,
  category_id integer,
  category_name text,
  rack_id integer,
  rack_name text,
  total_copies integer,
  available_copies integer,
  availability_status text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    b.id,
    b.book_code,
    b.isbn,
    b.title,
    b.author,
    b.publisher,
    b.year,
    b.description,
    b.pages,
    b.cover_url,
    b.category_id,
    c.name,
    b.rack_id,
    r.name,
    b.stock,
    b.available_stock,
    case when b.available_stock > 0 then 'AVAILABLE' else 'OUT_OF_STOCK' end
  from public.books b
  left join public.categories c on c.id = b.category_id
  left join public.racks r on r.id = b.rack_id
  where
    (
      p_search is null
      or b.title ilike '%' || btrim(p_search) || '%'
      or b.author ilike '%' || btrim(p_search) || '%'
      or b.isbn ilike '%' || btrim(p_search) || '%'
      or coalesce(b.book_code, '') ilike '%' || btrim(p_search) || '%'
    )
    and (p_category_id is null or b.category_id = p_category_id)
    and (not p_available_only or b.available_stock > 0)
  order by b.title asc;
$$;

create or replace function public.submit_public_borrow_request(
  p_book_id integer,
  p_quantity integer,
  p_borrowing_type text,
  p_requester_name text,
  p_requester_class text,
  p_requester_student_id text,
  p_requester_contact text default null,
  p_notes text default null
)
returns table (id integer, request_code text, status text)
language plpgsql
security definer
set search_path = public
as $$
declare
  available integer;
  created_id integer;
  created_code text;
begin
  if p_quantity is null or p_quantity < 1 then
    raise exception 'Jumlah peminjaman harus minimal 1';
  end if;
  if p_borrowing_type not in ('PERSONAL', 'CLASS_REPRESENTATIVE') then
    raise exception 'Jenis peminjaman tidak valid';
  end if;
  if nullif(btrim(p_requester_name), '') is null
    or nullif(btrim(p_requester_class), '') is null
    or nullif(btrim(p_requester_student_id), '') is null then
    raise exception 'Nama, kelas, dan NIS/NISN wajib diisi';
  end if;

  select b.available_stock into available
  from public.books b
  where b.id = p_book_id
  for update;

  if available is null then
    raise exception 'Buku tidak ditemukan';
  end if;
  if available < p_quantity then
    raise exception 'Jumlah melebihi stok yang tersedia saat ini';
  end if;

  insert into public.borrowings (
    member_id, book_id, due_date, status, quantity, borrowing_method,
    borrowing_type, requester_name, requester_class, requester_student_id,
    requester_contact, notes, created_by
  )
  values (
    null, p_book_id, null, 'pending', p_quantity, 'SELF_SERVICE',
    p_borrowing_type, btrim(p_requester_name), btrim(p_requester_class),
    btrim(p_requester_student_id), nullif(btrim(p_requester_contact), ''),
    nullif(btrim(p_notes), ''), null
  )
  returning public.borrowings.id, public.borrowings.request_code
  into created_id, created_code;

  return query select created_id, created_code, 'pending'::text;
end;
$$;

create or replace function public.public_request_status(
  p_request_code text,
  p_requester_student_id text
)
returns table (
  request_code text,
  requester_name text,
  requester_class text,
  borrowing_type text,
  book_title text,
  quantity integer,
  status text,
  requested_at timestamptz,
  approved_at timestamptz,
  due_date date,
  rejection_reason text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    b.request_code,
    b.requester_name,
    b.requester_class,
    b.borrowing_type,
    books.title,
    b.quantity,
    b.status,
    b.created_at,
    b.approved_at,
    b.due_date,
    b.rejection_reason
  from public.borrowings b
  join public.books on books.id = b.book_id
  where upper(b.request_code) = upper(btrim(p_request_code))
    and b.requester_student_id = btrim(p_requester_student_id)
    and b.borrowing_method = 'SELF_SERVICE'
  limit 1;
$$;

create or replace function public.is_library_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role in ('admin', 'librarian')
  );
$$;

create or replace function public.admin_approve_borrow_request(
  p_borrowing_id integer,
  p_due_date date
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  request_row public.borrowings%rowtype;
  available integer;
begin
  if auth.uid() is null or not public.is_library_staff() then
    raise exception 'Akses ditolak';
  end if;
  if p_due_date is null or p_due_date < current_date then
    raise exception 'Tanggal jatuh tempo tidak valid';
  end if;

  select * into request_row
  from public.borrowings
  where id = p_borrowing_id
  for update;

  if request_row.id is null then
    raise exception 'Request tidak ditemukan';
  end if;
  if request_row.status <> 'pending' then
    raise exception 'Request ini sudah diproses';
  end if;

  select available_stock into available
  from public.books
  where id = request_row.book_id
  for update;

  if available is null or available < request_row.quantity then
    raise exception 'Stok tidak lagi mencukupi';
  end if;

  update public.books
  set available_stock = available_stock - request_row.quantity
  where id = request_row.book_id;

  update public.borrowings
  set status = 'borrowed',
      due_date = p_due_date,
      approved_by = auth.uid(),
      approved_at = now()
  where id = p_borrowing_id;

  insert into public.activity_logs (user_id, type, description)
  values (auth.uid(), 'borrow_approved', 'Request ' || request_row.request_code || ' disetujui');

  return p_borrowing_id;
end;
$$;

create or replace function public.admin_reject_borrow_request(
  p_borrowing_id integer,
  p_rejection_reason text
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or not public.is_library_staff() then
    raise exception 'Akses ditolak';
  end if;
  if nullif(btrim(p_rejection_reason), '') is null then
    raise exception 'Alasan penolakan wajib diisi';
  end if;

  update public.borrowings
  set status = 'rejected',
      rejected_by = auth.uid(),
      rejected_at = now(),
      rejection_reason = btrim(p_rejection_reason)
  where id = p_borrowing_id
    and status = 'pending';

  if not found then
    raise exception 'Request tidak ditemukan atau sudah diproses';
  end if;

  insert into public.activity_logs (user_id, type, description)
  values (auth.uid(), 'borrow_rejected', 'Request #' || p_borrowing_id || ' ditolak');

  return p_borrowing_id;
end;
$$;

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
  if not exists (select 1 from public.members where public.members.id = p_member_id) then
    raise exception 'Anggota tidak ditemukan';
  end if;

  select b.available_stock into available
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

revoke all on function public.public_catalog_books(text, integer, boolean) from public;
grant execute on function public.public_catalog_books(text, integer, boolean) to anon, authenticated;

revoke all on function public.submit_public_borrow_request(integer, integer, text, text, text, text, text, text) from public;
grant execute on function public.submit_public_borrow_request(integer, integer, text, text, text, text, text, text) to anon, authenticated;

revoke all on function public.public_request_status(text, text) from public;
grant execute on function public.public_request_status(text, text) to anon, authenticated;

revoke all on function public.admin_approve_borrow_request(integer, date) from public;
grant execute on function public.admin_approve_borrow_request(integer, date) to authenticated;

revoke all on function public.admin_reject_borrow_request(integer, text) from public;
grant execute on function public.admin_reject_borrow_request(integer, text) to authenticated;

revoke all on function public.admin_create_borrowing(integer, integer, integer, text, date, text) from public;
grant execute on function public.admin_create_borrowing(integer, integer, integer, text, date, text) to authenticated;

revoke all on function public.admin_return_borrowing(integer, text, text) from public;
grant execute on function public.admin_return_borrowing(integer, text, text) to authenticated;

-- The legacy RPCs remain in the schema for backwards compatibility, but they
-- must not provide a second unaudited path around the Phase 2 role checks.
revoke execute on function public.borrow_book(integer, integer, date, text, uuid) from authenticated;
revoke execute on function public.return_book(integer) from authenticated;

notify pgrst, 'reload schema';
commit;