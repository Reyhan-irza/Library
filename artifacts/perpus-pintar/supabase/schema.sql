-- ============================================================
-- Perpustakaan SMKN 2 Lubuk Basung — Supabase Schema
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- ── Extensions ────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ── Profiles ──────────────────────────────────────────────────────────────
create table if not exists profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text not null,
  username    text unique,
  role        text not null default 'librarian' check (role in ('admin', 'librarian')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "Users can view all profiles"
  on profiles for select using (auth.role() = 'authenticated');

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

-- ── Categories ────────────────────────────────────────────────────────────
create table if not exists categories (
  id          serial primary key,
  name        text not null unique,
  description text,
  created_at  timestamptz not null default now()
);

alter table categories enable row level security;

create policy "Authenticated users can read categories"
  on categories for select using (auth.role() = 'authenticated');

create policy "Authenticated users can manage categories"
  on categories for all using (auth.role() = 'authenticated');

-- ── Racks ─────────────────────────────────────────────────────────────────
create table if not exists racks (
  id          serial primary key,
  name        text not null unique,
  location    text,
  description text,
  created_at  timestamptz not null default now()
);

alter table racks enable row level security;

create policy "Authenticated users can read racks"
  on racks for select using (auth.role() = 'authenticated');

create policy "Authenticated users can manage racks"
  on racks for all using (auth.role() = 'authenticated');

-- ── Books ─────────────────────────────────────────────────────────────────
create table if not exists books (
  id               serial primary key,
  isbn             text not null unique,
  title            text not null,
  author           text not null,
  publisher        text,
  year             integer,
  stock            integer not null default 1 check (stock >= 0),
  available_stock  integer not null default 1 check (available_stock >= 0),
  description      text,
  pages            integer,
  cover_url        text,
  category_id      integer references categories(id) on delete set null,
  rack_id          integer references racks(id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

alter table books enable row level security;

create policy "Authenticated users can read books"
  on books for select using (auth.role() = 'authenticated');

create policy "Authenticated users can manage books"
  on books for all using (auth.role() = 'authenticated');

-- ── Members ───────────────────────────────────────────────────────────────
create table if not exists members (
  id             serial primary key,
  member_number  text not null unique,
  name           text not null,
  email          text unique,
  phone          text,
  address        text,
  created_at     timestamptz not null default now()
);

alter table members enable row level security;

create policy "Authenticated users can read members"
  on members for select using (auth.role() = 'authenticated');

create policy "Authenticated users can manage members"
  on members for all using (auth.role() = 'authenticated');

-- Auto-generate member number
create or replace function generate_member_number()
returns trigger language plpgsql as $$
begin
  if new.member_number is null or new.member_number = '' then
    new.member_number := 'MBR-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('member_number_seq')::text, 4, '0');
  end if;
  return new;
end;
$$;

create sequence if not exists member_number_seq start 1;

create trigger set_member_number
  before insert on members
  for each row execute function generate_member_number();

-- ── Borrowings ────────────────────────────────────────────────────────────
create table if not exists borrowings (
  id          serial primary key,
  member_id   integer not null references members(id) on delete restrict,
  book_id     integer not null references books(id) on delete restrict,
  borrow_date date not null default current_date,
  due_date    date not null,
  return_date date,
  status      text not null default 'borrowed' check (status in ('borrowed', 'returned', 'overdue')),
  fine        integer not null default 0,
  notes       text,
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now()
);

alter table borrowings enable row level security;

create policy "Authenticated users can read borrowings"
  on borrowings for select using (auth.role() = 'authenticated');

create policy "Authenticated users can manage borrowings"
  on borrowings for all using (auth.role() = 'authenticated');

-- ── Favorites ─────────────────────────────────────────────────────────────
create table if not exists favorites (
  id          serial primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  book_id     integer not null references books(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique(user_id, book_id)
);

alter table favorites enable row level security;

create policy "Users manage own favorites"
  on favorites for all using (auth.uid() = user_id);

-- ── Activity Logs ─────────────────────────────────────────────────────────
create table if not exists activity_logs (
  id          serial primary key,
  user_id     uuid references auth.users(id) on delete set null,
  type        text not null,
  description text not null,
  created_at  timestamptz not null default now()
);

alter table activity_logs enable row level security;

create policy "Authenticated users can read activity logs"
  on activity_logs for select using (auth.role() = 'authenticated');

create policy "Authenticated users can insert activity logs"
  on activity_logs for insert with check (auth.role() = 'authenticated');

-- ── Updated At Triggers ───────────────────────────────────────────────────
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger books_updated_at before update on books
  for each row execute function set_updated_at();

create trigger profiles_updated_at before update on profiles
  for each row execute function set_updated_at();

-- ── Handle New User (auto-create profile) ─────────────────────────────────
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, name, username, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    split_part(new.email, '@', 1),
    coalesce(new.raw_user_meta_data->>'role', 'librarian')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ── RPC: borrow_book ──────────────────────────────────────────────────────
create or replace function borrow_book(
  p_member_id  integer,
  p_book_id    integer,
  p_due_date   date,
  p_notes      text    default null,
  p_created_by uuid    default null
)
returns integer language plpgsql security definer as $$
declare
  v_avail integer;
  v_id    integer;
begin
  -- Check availability (lock the row)
  select available_stock into v_avail
    from books where id = p_book_id for update;

  if v_avail is null then
    raise exception 'Buku tidak ditemukan';
  end if;

  if v_avail <= 0 then
    raise exception 'Stok buku tidak tersedia';
  end if;

  -- Decrement available stock
  update books set available_stock = available_stock - 1 where id = p_book_id;

  -- Insert borrowing
  insert into borrowings (member_id, book_id, due_date, notes, created_by)
  values (p_member_id, p_book_id, p_due_date, p_notes, p_created_by)
  returning id into v_id;

  -- Log activity
  insert into activity_logs (user_id, type, description)
  values (p_created_by, 'borrow', 'Peminjaman buku ID ' || p_book_id || ' oleh anggota ID ' || p_member_id);

  return v_id;
end;
$$;

-- ── RPC: return_book ──────────────────────────────────────────────────────
create or replace function return_book(
  p_borrowing_id integer
)
returns void language plpgsql security definer as $$
declare
  v_book_id    integer;
  v_due_date   date;
  v_fine       integer := 0;
  v_days_late  integer;
begin
  -- Lock the borrowing row
  select book_id, due_date into v_book_id, v_due_date
    from borrowings where id = p_borrowing_id for update;

  if v_book_id is null then
    raise exception 'Data peminjaman tidak ditemukan';
  end if;

  -- Calculate fine (Rp 1.000/day late)
  v_days_late := greatest(0, current_date - v_due_date);
  v_fine := v_days_late * 1000;

  -- Update borrowing
  update borrowings
    set return_date = current_date,
        status      = 'returned',
        fine        = v_fine
  where id = p_borrowing_id;

  -- Increment available stock
  update books set available_stock = available_stock + 1 where id = v_book_id;

  -- Log activity
  insert into activity_logs (type, description)
  values ('return', 'Pengembalian buku ID ' || v_book_id || ' (peminjaman #' || p_borrowing_id || ')');
end;
$$;

-- ── Grant RPC to authenticated users ─────────────────────────────────────
grant execute on function borrow_book(integer, integer, date, text, uuid) to authenticated;
grant execute on function return_book(integer) to authenticated;
