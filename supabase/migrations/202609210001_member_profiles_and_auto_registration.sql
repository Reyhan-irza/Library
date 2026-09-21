-- VIREON: student member profiles, private photos, and automatic registration.

begin;

alter table public.members
  add column if not exists student_id text,
  add column if not exists class_name text,
  add column if not exists photo_path text;

create index if not exists members_student_id_lookup_idx
  on public.members (lower(regexp_replace(btrim(student_id), '\s+', '', 'g')))
  where student_id is not null and btrim(student_id) <> '';

create unique index if not exists members_student_id_unique_idx
  on public.members (lower(regexp_replace(btrim(student_id), '\s+', '', 'g')))
  where student_id is not null and btrim(student_id) <> '';

insert into storage.buckets (id, name, public)
values ('member-photos', 'member-photos', false)
on conflict (id) do update set public = false;

drop policy if exists "Authenticated users can view member photos" on storage.objects;
create policy "Authenticated users can view member photos"
  on storage.objects for select to authenticated
  using (bucket_id = 'member-photos');

drop policy if exists "Authenticated users can upload member photos" on storage.objects;
create policy "Authenticated users can upload member photos"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'member-photos');

drop policy if exists "Authenticated users can update member photos" on storage.objects;
create policy "Authenticated users can update member photos"
  on storage.objects for update to authenticated
  using (bucket_id = 'member-photos')
  with check (bucket_id = 'member-photos');

drop policy if exists "Authenticated users can delete member photos" on storage.objects;
create policy "Authenticated users can delete member photos"
  on storage.objects for delete to authenticated
  using (bucket_id = 'member-photos');

create or replace function public.admin_approve_borrow_request(
  p_borrowing_id integer,
  p_due_date date,
  p_member_photo_path text default null
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  request_row public.borrowings%rowtype;
  available integer;
  matched_member_id integer;
  normalized_student_id text;
  clean_photo_path text;
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

  /*
   * Public requests carry the student's NIS/NISN but not a member_id.
   * Lock by the normalized identity so two simultaneous approvals cannot
   * create duplicate member rows.
   */
  matched_member_id := request_row.member_id;
  clean_photo_path := nullif(btrim(p_member_photo_path), '');

  if matched_member_id is null then
    normalized_student_id := lower(regexp_replace(
      btrim(coalesce(request_row.requester_student_id, '')),
      '\s+',
      '',
      'g'
    ));

    if normalized_student_id = '' then
      raise exception 'NIS/NISN siswa tidak tersedia';
    end if;

    perform pg_advisory_xact_lock(hashtextextended(normalized_student_id, 0));

    select m.id into matched_member_id
    from public.members as m
    where lower(regexp_replace(btrim(coalesce(m.student_id, '')), '\s+', '', 'g'))
      = normalized_student_id
    limit 1
    for update;

    if matched_member_id is null then
      if clean_photo_path is null then
        raise exception 'Foto siswa wajib diunggah untuk anggota baru';
      end if;

      insert into public.members (
        name, student_id, class_name, phone, photo_path
      )
      values (
        btrim(request_row.requester_name),
        btrim(request_row.requester_student_id),
        nullif(btrim(request_row.requester_class), ''),
        nullif(btrim(request_row.requester_contact), ''),
        clean_photo_path
      )
      returning id into matched_member_id;
    else
      update public.members
      set photo_path = coalesce(clean_photo_path, photo_path),
          class_name = coalesce(class_name, nullif(btrim(request_row.requester_class), '')),
          phone = coalesce(phone, nullif(btrim(request_row.requester_contact), ''))
      where id = matched_member_id;
    end if;
  elsif clean_photo_path is not null then
    update public.members
    set photo_path = clean_photo_path
    where id = matched_member_id;
  end if;

  update public.books
  set available_stock = available_stock - request_row.quantity
  where id = request_row.book_id;

  update public.borrowings
  set member_id = matched_member_id,
      status = 'borrowed',
      due_date = p_due_date,
      approved_by = auth.uid(),
      approved_at = now()
  where id = p_borrowing_id;

  insert into public.activity_logs (user_id, type, description)
  values (auth.uid(), 'borrow_approved', 'Request ' || request_row.request_code || ' disetujui');

  return p_borrowing_id;
end;
$$;

commit;