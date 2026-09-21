import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { setUser, clearUser, getUser } from '@/lib/auth';
import { parseLandingStats, type LandingStats } from '@/lib/public-stats';
import { createMemberPhotoUrls, removeMemberPhoto, uploadMemberPhoto } from '@/lib/member-photo';
import type {
  Book, BookInput, BookUpdate,
  Category, CategoryInput,
  Rack, RackInput,
  Member, MemberInput,
  Borrowing, BorrowingInput,
  PublicCatalogBook, PublicBorrowRequestInput, PublicBorrowRequestResult, PublicRequestStatus,
  StaffMember, StaffInput, StaffUpdate,
  DashboardStats, ChartData, TopBook, Activity, Notification, ReportSummary,
} from '@/types';
import { differenceInDays, differenceInCalendarDays, parseISO, addDays, format } from 'date-fns';

// ── Query Keys ────────────────────────────────────────────────────────────

export const getBooksQueryKey   = () => ['books'];
export const getBookQueryKey    = (id: number) => ['books', id];
export const getCategoriesQueryKey = () => ['categories'];
export const getRacksQueryKey   = () => ['racks'];
export const getMembersQueryKey = () => ['members'];
export const getBorrowingsQueryKey = () => ['borrowings'];
export const getStaffQueryKey   = () => ['staff'];
export const getFavoritesQueryKey = () => ['favorites'];
export const getFavoriteIdsQueryKey = () => ['favoriteIds'];
export const getDashboardStatsQueryKey = () => ['dashboard', 'stats'];
export type DashboardChartRange = { start?: string; end?: string; all?: boolean };
export const getDashboardChartQueryKey = (range?: DashboardChartRange) =>
  range
    ? ['dashboard', 'chart', range.start ?? null, range.end ?? null, range.all ? 'all' : 'range']
    : ['dashboard', 'chart'];
export const getRecentActivitiesQueryKey = () => ['activities'];
export const getTopBooksQueryKey = () => ['topBooks'];
export const getNotificationsQueryKey = () => ['notifications'];
export const getMeQueryKey = () => ['me'];
export const getReportSummaryQueryKey = () => ['report', 'summary'];
export const getLandingStatsQueryKey = () => ['landing', 'stats'];
export const getPublicCatalogQueryKey = (search: string, categoryId: number | null, availableOnly: boolean) =>
  ['public-catalog', search, categoryId, availableOnly];

function invalidateLandingStats(qc: ReturnType<typeof useQueryClient>) {
  return qc.invalidateQueries({ queryKey: getLandingStatsQueryKey() });
}

// ── Helpers ───────────────────────────────────────────────────────────────

function mapBook(row: any): Book {
  const stock = row.stock ?? 0;
  const avail = row.available_stock ?? 0;
  return {
    id: row.id,
    bookCode: row.book_code ?? null,
    isbn: row.isbn,
    title: row.title,
    author: row.author,
    publisher: row.publisher,
    year: row.year,
    stock,
    availableStock: avail,
    description: row.description,
    pages: row.pages,
    coverUrl: row.cover_url,
    categoryId: row.category_id,
    rackId: row.rack_id,
    status: avail > 0 ? 'available' : 'borrowed',
    categoryName: row.categories?.name ?? null,
    rackName: row.racks?.name ?? null,
  };
}

function mapBorrowing(row: any, memberPhotoUrls: Record<string, string> = {}): Borrowing {
  const today = new Date();
  const due = row.due_date ? parseISO(row.due_date) : null;
  let status: Borrowing['status'] = row.status;
  if (status === 'borrowed' && due && differenceInDays(today, due) > 0) status = 'overdue';
  const memberPhotoPath = row.members?.photo_path ?? null;
  return {
    id: row.id,
    memberId: row.member_id,
    bookId: row.book_id,
    memberName: row.members?.name ?? row.requester_name ?? '-',
    memberNumber: row.members?.member_number ?? '-',
    memberPhotoUrl: memberPhotoPath ? memberPhotoUrls[memberPhotoPath] ?? null : null,
    requesterName: row.requester_name,
    requesterClass: row.requester_class,
    requesterStudentId: row.requester_student_id,
    bookTitle: row.books?.title ?? '-',
    bookIsbn: row.books?.isbn ?? '-',
    borrowDate: row.borrow_date,
    dueDate: row.due_date,
    returnDate: row.return_date,
    status,
    quantity: row.quantity ?? 1,
    requestCode: row.request_code,
    borrowingMethod: row.borrowing_method ?? 'ADMIN_ASSISTED',
    borrowingType: row.borrowing_type ?? 'PERSONAL',
    approvedAt: row.approved_at,
    rejectionReason: row.rejection_reason,
    fine: row.fine ?? 0,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

function mapPublicCatalogBook(row: any): PublicCatalogBook {
  return {
    id: row.id,
    bookCode: row.book_code,
    isbn: row.isbn,
    title: row.title,
    author: row.author,
    publisher: row.publisher,
    publicationYear: row.publication_year,
    description: row.description,
    pages: row.pages,
    coverUrl: row.cover_url,
    categoryId: row.category_id,
    categoryName: row.category_name,
    rackId: row.rack_id,
    rackName: row.rack_name,
    totalCopies: row.total_copies ?? 0,
    availableCopies: row.available_copies ?? 0,
    availabilityStatus: row.availability_status,
  };
}

function mapPublicRequestStatus(row: any): PublicRequestStatus {
  return {
    requestCode: row.request_code,
    requesterName: row.requester_name,
    requesterClass: row.requester_class,
    borrowingType: row.borrowing_type,
    bookTitle: row.book_title,
    quantity: row.quantity,
    status: row.status,
    requestedAt: row.requested_at,
    approvedAt: row.approved_at,
    dueDate: row.due_date,
    rejectionReason: row.rejection_reason,
  };
}

// ── Public catalog and self-service borrowing ──────────────────────────────

export function usePublicCatalog(search: string, categoryId: number | null, availableOnly: boolean) {
  return useQuery<PublicCatalogBook[]>({
    queryKey: getPublicCatalogQueryKey(search, categoryId, availableOnly),
    queryFn: async () => {
      const { data, error } = await supabase.rpc('public_catalog_books', {
        p_search: search.trim() || null,
        p_category_id: categoryId,
        p_available_only: availableOnly,
      });
      if (error) throw error;
      return (data ?? []).map(mapPublicCatalogBook);
    },
  });
}

export function useSubmitPublicBorrowRequest() {
  return useMutation({
    mutationFn: async (input: PublicBorrowRequestInput): Promise<PublicBorrowRequestResult> => {
      const { data, error } = await supabase.rpc('submit_public_borrow_request', {
        p_book_id: input.bookId,
        p_quantity: input.quantity,
        p_borrowing_type: input.borrowingType,
        p_requester_name: input.requesterName,
        p_requester_class: input.requesterClass,
        p_requester_student_id: input.requesterStudentId,
        p_requester_contact: input.requesterContact || null,
        p_notes: input.notes || null,
      });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      if (!row?.request_code) throw new Error('Request berhasil dibuat tetapi kode tidak diterima');
      return { id: row.id, requestCode: row.request_code, status: row.status };
    },
  });
}

export function useLookupPublicRequestStatus() {
  return useMutation({
    mutationFn: async ({ requestCode, studentId }: { requestCode: string; studentId: string }) => {
      const { data, error } = await supabase.rpc('public_request_status', {
        p_request_code: requestCode.trim(),
        p_requester_student_id: studentId.trim(),
      });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      if (!row) throw new Error('Request tidak ditemukan. Periksa kode dan NIS/NISN Anda.');
      return mapPublicRequestStatus(row);
    },
  });
}

// ── Books ─────────────────────────────────────────────────────────────────

export function useListBooks() {
  return useQuery({
    queryKey: getBooksQueryKey(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('books')
        .select('*, categories(name), racks(name)')
        .order('title');
      if (error) throw error;
      return (data ?? []).map(mapBook) as Book[];
    },
  });
}

export function useCreateBook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: BookInput) => {
      const { data, error } = await supabase
        .from('books')
        .insert({
          isbn: input.isbn,
          title: input.title,
          author: input.author,
          publisher: input.publisher ?? null,
          year: input.year ?? null,
          stock: input.stock ?? 1,
          available_stock: input.stock ?? 1,
          description: input.description ?? null,
          pages: input.pages ?? null,
          cover_url: input.coverUrl ?? null,
          category_id: input.categoryId ?? null,
          rack_id: input.rackId ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getBooksQueryKey() });
      invalidateLandingStats(qc);
    },
  });
}

export function useUpdateBook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data: input }: { id: number; data: BookUpdate }) => {
      const update: Record<string, unknown> = {};
      if (input.isbn !== undefined) update.isbn = input.isbn;
      if (input.title !== undefined) update.title = input.title;
      if (input.author !== undefined) update.author = input.author;
      if (input.publisher !== undefined) update.publisher = input.publisher;
      if (input.year !== undefined) update.year = input.year;
      if (input.description !== undefined) update.description = input.description;
      if (input.pages !== undefined) update.pages = input.pages;
      if (input.coverUrl !== undefined) update.cover_url = input.coverUrl;
      if (input.categoryId !== undefined) update.category_id = input.categoryId;
      if (input.rackId !== undefined) update.rack_id = input.rackId;

      if (input.stock !== undefined) {
        const { error } = await supabase.rpc('admin_update_book_inventory', {
          p_book_id: id,
          p_stock: input.stock,
        });
        if (error) throw error;
      }

      if (Object.keys(update).length === 0) {
        const { data, error } = await supabase.from('books').select().eq('id', id).single();
        if (error) throw error;
        return data;
      }

      const { data, error } = await supabase.from('books').update(update).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getBooksQueryKey() });
      invalidateLandingStats(qc);
    },
  });
}

export function useDeleteBook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from('books').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getBooksQueryKey() });
      invalidateLandingStats(qc);
    },
  });
}

// ── Categories ────────────────────────────────────────────────────────────

export function useListCategories() {
  return useQuery({
    queryKey: getCategoriesQueryKey(),
    queryFn: async () => {
      const { data: cats, error } = await supabase.from('categories').select('*').order('name');
      if (error) throw error;
      const { data: books } = await supabase.from('books').select('category_id');
      const counts: Record<number, number> = {};
      (books ?? []).forEach((b: any) => { if (b.category_id) counts[b.category_id] = (counts[b.category_id] ?? 0) + 1; });
      return (cats ?? []).map((c: any): Category => ({
        id: c.id,
        name: c.name,
        description: c.description,
        bookCount: counts[c.id] ?? 0,
        createdAt: c.created_at,
      }));
    },
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CategoryInput) => {
      const { data, error } = await supabase.from('categories').insert({ name: input.name, description: input.description ?? null }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: getCategoriesQueryKey() }),
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: CategoryInput }) => {
      const { error } = await supabase.from('categories').update({ name: data.name, description: data.description ?? null }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: getCategoriesQueryKey() }),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: getCategoriesQueryKey() }),
  });
}

// ── Racks ─────────────────────────────────────────────────────────────────

export function useListRacks() {
  return useQuery({
    queryKey: getRacksQueryKey(),
    queryFn: async () => {
      const { data: racks, error } = await supabase.from('racks').select('*').order('name');
      if (error) throw error;
      const { data: books } = await supabase.from('books').select('rack_id');
      const counts: Record<number, number> = {};
      (books ?? []).forEach((b: any) => { if (b.rack_id) counts[b.rack_id] = (counts[b.rack_id] ?? 0) + 1; });
      return (racks ?? []).map((r: any): Rack => ({
        id: r.id,
        name: r.name,
        location: r.location,
        description: r.description,
        bookCount: counts[r.id] ?? 0,
        createdAt: r.created_at,
      }));
    },
  });
}

export function useCreateRack() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: RackInput) => {
      const { data, error } = await supabase.from('racks').insert({ name: input.name, location: input.location ?? null, description: input.description ?? null }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: getRacksQueryKey() }),
  });
}

export function useUpdateRack() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: RackInput }) => {
      const { error } = await supabase.from('racks').update({ name: data.name, location: data.location ?? null, description: data.description ?? null }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: getRacksQueryKey() }),
  });
}

export function useDeleteRack() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from('racks').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: getRacksQueryKey() }),
  });
}

// ── Members ───────────────────────────────────────────────────────────────

export function useListMembers() {
  return useQuery({
    queryKey: getMembersQueryKey(),
    queryFn: async () => {
      const { data: members, error } = await supabase.from('members').select('*').order('name');
      if (error) throw error;
      const { data: borrows } = await supabase.from('borrowings').select('member_id, fine, status');
      const photoUrls = await createMemberPhotoUrls((members ?? []).map((member: any) => member.photo_path));
      const borrowMap: Record<number, { count: number; fine: number }> = {};
      (borrows ?? []).forEach((b: any) => {
        if (!borrowMap[b.member_id]) borrowMap[b.member_id] = { count: 0, fine: 0 };
        if (b.status !== 'returned') borrowMap[b.member_id].count++;
        borrowMap[b.member_id].fine += b.fine ?? 0;
      });
      return (members ?? []).map((m: any): Member => ({
        id: m.id,
        memberNumber: m.member_number,
        name: m.name,
        studentId: m.student_id,
        className: m.class_name,
        email: m.email,
        phone: m.phone,
        address: m.address,
        photoUrl: m.photo_path ? photoUrls[m.photo_path] ?? null : null,
        borrowCount: borrowMap[m.id]?.count ?? 0,
        fine: borrowMap[m.id]?.fine ?? 0,
        createdAt: m.created_at,
      }));
    },
  });
}

export function useCreateMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: MemberInput) => {
      let photoPath: string | undefined;
      try {
        if (input.photoFile) photoPath = await uploadMemberPhoto(input.photoFile);
        const { data, error } = await supabase.from('members').insert({
          name: input.name,
          student_id: input.studentId?.trim() || null,
          class_name: input.className?.trim() || null,
          email: input.email ?? null,
          phone: input.phone ?? null,
          address: input.address ?? null,
          photo_path: photoPath ?? null,
        }).select().single();
        if (error) throw error;
        return data;
      } catch (error) {
        if (photoPath) await removeMemberPhoto(photoPath);
        throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getMembersQueryKey() });
      invalidateLandingStats(qc);
    },
  });
}

export function useUpdateMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data: input }: { id: number; data: MemberInput }) => {
      let photoPath: string | undefined;
      try {
        if (input.photoFile) photoPath = await uploadMemberPhoto(input.photoFile);
        const update: Record<string, unknown> = {
          name: input.name,
          student_id: input.studentId?.trim() || null,
          class_name: input.className?.trim() || null,
          email: input.email ?? null,
          phone: input.phone ?? null,
          address: input.address ?? null,
        };
        if (photoPath) update.photo_path = photoPath;
        const { error } = await supabase.from('members').update(update).eq('id', id);
        if (error) throw error;
      } catch (error) {
        if (photoPath) await removeMemberPhoto(photoPath);
        throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getMembersQueryKey() });
      invalidateLandingStats(qc);
    },
  });
}

export function useDeleteMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from('members').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getMembersQueryKey() });
      invalidateLandingStats(qc);
    },
  });
}

// ── Borrowings ────────────────────────────────────────────────────────────

export function useListBorrowings() {
  return useQuery({
    queryKey: getBorrowingsQueryKey(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('borrowings')
        .select('*, members(name, member_number, photo_path), books(title, isbn)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      const photoUrls = await createMemberPhotoUrls(
        (data ?? []).map((row: any) => row.members?.photo_path),
      );
      return (data ?? []).map((row: any) => mapBorrowing(row, photoUrls)) as Borrowing[];
    },
  });
}

export function useCreateBorrowing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: BorrowingInput) => {
      const { data, error } = await supabase.rpc('admin_create_borrowing', {
        p_member_id: input.memberId,
        p_book_id: input.bookId,
        p_quantity: input.quantity ?? 1,
        p_borrowing_type: input.borrowingType ?? 'PERSONAL',
        p_due_date: input.dueDate,
        p_notes: input.notes ?? null,
      });
      if (error) throw error;
      return Array.isArray(data) ? data[0] : data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getBorrowingsQueryKey() });
      qc.invalidateQueries({ queryKey: getBooksQueryKey() });
      qc.invalidateQueries({ queryKey: getDashboardStatsQueryKey() });
      invalidateLandingStats(qc);
    },
  });
}

export function useApproveBorrowRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ borrowingId, dueDate, photoFile }: { borrowingId: number; dueDate: string; photoFile?: File }) => {
      let photoPath: string | undefined;
      try {
        if (photoFile) photoPath = await uploadMemberPhoto(photoFile);
        const { data, error } = await supabase.rpc('admin_approve_borrow_request', {
          p_borrowing_id: borrowingId,
          p_due_date: dueDate,
          p_member_photo_path: photoPath ?? null,
        });
        if (error) throw error;
        return data;
      } catch (error) {
        if (photoPath) await removeMemberPhoto(photoPath);
        throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getBorrowingsQueryKey() });
      qc.invalidateQueries({ queryKey: getMembersQueryKey() });
      qc.invalidateQueries({ queryKey: getBooksQueryKey() });
      qc.invalidateQueries({ queryKey: getDashboardStatsQueryKey() });
      qc.invalidateQueries({ queryKey: getRecentActivitiesQueryKey() });
      invalidateLandingStats(qc);
    },
  });
}

export function useRejectBorrowRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ borrowingId, reason }: { borrowingId: number; reason: string }) => {
      const { data, error } = await supabase.rpc('admin_reject_borrow_request', {
        p_borrowing_id: borrowingId,
        p_rejection_reason: reason,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getBorrowingsQueryKey() });
      qc.invalidateQueries({ queryKey: getRecentActivitiesQueryKey() });
    },
  });
}

export function useReturnBook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: number | { borrowingId: number; condition?: string; notes?: string }) => {
      const borrowingId = typeof input === 'number' ? input : input.borrowingId;
      const { data, error } = await supabase.rpc('admin_return_borrowing', {
        p_borrowing_id: borrowingId,
        p_return_condition: typeof input === 'number' ? 'GOOD' : input.condition ?? 'GOOD',
        p_return_notes: typeof input === 'number' ? null : input.notes ?? null,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getBorrowingsQueryKey() });
      qc.invalidateQueries({ queryKey: getBooksQueryKey() });
      qc.invalidateQueries({ queryKey: getDashboardStatsQueryKey() });
      qc.invalidateQueries({ queryKey: getRecentActivitiesQueryKey() });
      invalidateLandingStats(qc);
    },
  });
}

export function useMarkOverdueBorrowings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('admin_mark_overdue_borrowings');
      if (error) throw error;
      return data as number;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getBorrowingsQueryKey() });
      qc.invalidateQueries({ queryKey: getDashboardStatsQueryKey() });
      qc.invalidateQueries({ queryKey: getReportSummaryQueryKey() });
      qc.invalidateQueries({ queryKey: getRecentActivitiesQueryKey() });
    },
  });
}

// ── Staff ─────────────────────────────────────────────────────────────────

export function useListStaff() {
  return useQuery({
    queryKey: getStaffQueryKey(),
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*').order('name');
      if (error) throw error;
      return (data ?? []).map((p: any): StaffMember => ({
        id: p.id,
        username: p.username ?? p.id,
        name: p.name,
        email: null,
        role: p.role ?? 'librarian',
      }));
    },
  });
}

export function useCreateStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: StaffInput) => {
      // Phase A fix: supabase.auth.signUp() replaces the active session.
      // Save the current admin session and restore it after creating the new account.
      const { data: { session: currentSession } } = await supabase.auth.getSession();

      const { data, error } = await supabase.auth.signUp({
        email: input.email,
        password: input.password,
        options: {
          data: { name: input.name, role: input.role },
        },
      });
      if (error) throw error;

      // Restore the admin session that signUp replaced
      if (currentSession) {
        await supabase.auth.setSession({
          access_token: currentSession.access_token,
          refresh_token: currentSession.refresh_token,
        });
      }
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: getStaffQueryKey() }),
  });
}

export function useUpdateStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: StaffUpdate }) => {
      const update: Record<string, unknown> = {};
      if (data.name !== undefined) update.name = data.name;
      if (data.role !== undefined) update.role = data.role;
      const { error } = await supabase.from('profiles').update(update).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: getStaffQueryKey() }),
  });
}

export function useDeleteStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('profiles').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: getStaffQueryKey() }),
  });
}

// ── Favorites ─────────────────────────────────────────────────────────────

export function useGetFavorites() {
  return useQuery({
    queryKey: getFavoritesQueryKey(),
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [] as Book[];
      const { data, error } = await supabase
        .from('favorites')
        .select('book_id, books(*, categories(name), racks(name))')
        .eq('user_id', user.id);
      if (error) throw error;
      return (data ?? []).map((f: any) => mapBook(f.books)) as Book[];
    },
  });
}

export function useGetFavoriteIds() {
  return useQuery({
    queryKey: getFavoriteIdsQueryKey(),
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [] as number[];
      const { data, error } = await supabase.from('favorites').select('book_id').eq('user_id', user.id);
      if (error) throw error;
      return (data ?? []).map((f: any) => f.book_id as number);
    },
  });
}

export function useAddFavorite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (bookId: number) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Belum login');
      const { error } = await supabase.from('favorites').insert({ user_id: user.id, book_id: bookId });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getFavoritesQueryKey() });
      qc.invalidateQueries({ queryKey: getFavoriteIdsQueryKey() });
    },
  });
}

export function useRemoveFavorite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (bookId: number) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Belum login');
      const { error } = await supabase.from('favorites').delete().eq('user_id', user.id).eq('book_id', bookId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getFavoritesQueryKey() });
      qc.invalidateQueries({ queryKey: getFavoriteIdsQueryKey() });
    },
  });
}

// ── Dashboard ─────────────────────────────────────────────────────────────

export function useGetDashboardStats() {
  return useQuery({
    queryKey: getDashboardStatsQueryKey(),
    queryFn: async () => {
      const [{ count: totalBooks }, { data: borrows }, { count: totalMembers }] = await Promise.all([
        supabase.from('books').select('*', { count: 'exact', head: true }),
        supabase.from('borrowings').select('status, fine, due_date'),
        supabase.from('members').select('*', { count: 'exact', head: true }),
      ]);
      const { data: avail } = await supabase.from('books').select('available_stock').gt('available_stock', 0);
      const isOverdue = (borrowing: any) =>
        borrowing.status === 'overdue'
        || (borrowing.status === 'borrowed' && borrowing.due_date && borrowing.due_date < format(new Date(), 'yyyy-MM-dd'));
      const borrowed = (borrows ?? []).filter((b: any) => b.status === 'borrowed' && !isOverdue(b)).length;
      const overdue = (borrows ?? []).filter(isOverdue).length;
      const totalFine = (borrows ?? []).reduce((s: number, b: any) => s + (b.fine ?? 0), 0);
      return {
        totalBooks: totalBooks ?? 0,
        totalMembers: totalMembers ?? 0,
        totalBorrowed: borrowed,
        totalAvailable: avail?.length ?? 0,
        overdueCount: overdue,
        totalFine,
      } as DashboardStats;
    },
  });
}

export function useGetDashboardChart(range?: DashboardChartRange) {
  return useQuery({
    queryKey: getDashboardChartQueryKey(range),
    queryFn: async () => {
      const now = new Date();
      const isAll = Boolean(range?.all);
      let query = supabase.from('borrowings').select('borrow_date, return_date');

      if (!isAll && range?.start) query = query.gte('borrow_date', range.start);
      if (!isAll && range?.end) query = query.lte('borrow_date', range.end);

      if (!isAll && !range?.start && !range?.end) {
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        query = query.gte('borrow_date', format(sixMonthsAgo, 'yyyy-MM-01'));
      }

      const { data, error } = await query;
      if (error) throw error;

      const rows = data ?? [];
      let firstMonth: Date;
      let lastMonth: Date;

      if (isAll) {
        const borrowDates = rows
          .map((row: any) => new Date(row.borrow_date))
          .filter((date) => !Number.isNaN(date.getTime()));
        const earliest = borrowDates.reduce<Date | null>(
          (current, date) => (!current || date < current ? date : current),
          null,
        );
        firstMonth = earliest
          ? new Date(earliest.getFullYear(), earliest.getMonth(), 1)
          : new Date(now.getFullYear(), now.getMonth(), 1);
        lastMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      } else if (range?.start || range?.end) {
        const start = range.start ? parseISO(range.start) : parseISO(range.end!);
        const end = range.end ? parseISO(range.end) : start;
        firstMonth = new Date(start.getFullYear(), start.getMonth(), 1);
        lastMonth = new Date(end.getFullYear(), end.getMonth(), 1);
      } else {
        firstMonth = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        lastMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      }

      const months: ChartData[] = [];
      const cursor = new Date(firstMonth);

      while (cursor <= lastMonth) {
        const mStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
        const mEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0, 23, 59, 59);
        const monthRows = rows.filter((b: any) => {
          const date = new Date(b.borrow_date);
          return date >= mStart && date <= mEnd;
        });
        months.push({
          month: format(cursor, isAll ? 'MMM yy' : 'MMM'),
          borrowed: monthRows.length,
          returned: monthRows.filter((b: any) => b.return_date).length,
        });
        cursor.setMonth(cursor.getMonth() + 1);
      }
      return months;
    },
  });
}

export function useGetRecentActivities() {
  return useQuery({
    queryKey: getRecentActivitiesQueryKey(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return (data ?? []).map((a: any): Activity => ({
        id: a.id,
        type: a.type,
        description: a.description,
        createdAt: a.created_at,
      }));
    },
  });
}

export function useGetTopBooks() {
  return useQuery({
    queryKey: getTopBooksQueryKey(),
    queryFn: async () => {
      // Phase C fix: cap at 500 rows so we don't pull the entire borrowings
      // table just to aggregate top-5 books client-side.
      const { data, error } = await supabase
        .from('borrowings')
        .select('book_id, books(id, title, author, cover_url)')
        .not('book_id', 'is', null)
        .limit(500);
      if (error) throw error;
      const counts: Record<number, { book: any; count: number }> = {};
      (data ?? []).forEach((b: any) => {
        const id = b.book_id;
        if (!counts[id]) counts[id] = { book: b.books, count: 0 };
        counts[id].count++;
      });
      return Object.values(counts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
        .map(({ book, count }): TopBook => ({
          id: book?.id,
          title: book?.title ?? '-',
          author: book?.author ?? '-',
          coverUrl: book?.cover_url,
          borrowCount: count,
        }));
    },
  });
}

export function useGetNotifications() {
  return useQuery({
    queryKey: getNotificationsQueryKey(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('borrowings')
        .select('id, due_date, return_date, status, members(name), books(title)')
        .is('return_date', null)
        .neq('status', 'returned');
      if (error) throw error;
      const notifications: Notification[] = [];
      (data ?? []).forEach((b: any, idx: number) => {
        const due = parseISO(b.due_date);
        const diff = differenceInCalendarDays(due, new Date());
        const memberName = b.members?.name ?? 'Anggota';
        const bookTitle = b.books?.title ?? 'Buku';
        if (diff < 0) {
          notifications.push({
            id: idx,
            type: 'overdue',
            title: 'Buku Terlambat',
            message: `${memberName} – ${bookTitle} (${Math.abs(diff)} hari)`,
            read: false,
          });
        } else if (diff <= 3) {
          notifications.push({
            id: idx + 1000,
            type: 'due_soon',
            title: 'Jatuh Tempo Segera',
            message: `${memberName} – ${bookTitle} (${diff === 0 ? 'hari ini' : `${diff} hari lagi`})`,
            read: false,
          });
        }
      });
      return notifications;
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });
}

// ── Profile / Auth ────────────────────────────────────────────────────────

export function useGetMe() {
  return useQuery({
    queryKey: getMeQueryKey(),
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      return {
        id: user.id,
        username: data?.username ?? user.email ?? '',
        name: data?.name ?? user.email ?? '',
        email: user.email ?? '',
        role: data?.role ?? 'librarian',
      };
    },
  });
}

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ data }: { data: { email: string; password: string } }) => {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });
      if (error) throw new Error(error.message);

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      setUser({
        id: authData.user.id,
        username: profile?.username ?? authData.user.email ?? '',
        name: profile?.name ?? authData.user.email ?? '',
        email: authData.user.email ?? '',
        role: profile?.role ?? 'librarian',
      });

      return authData;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: getMeQueryKey() }),
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await supabase.auth.signOut();
      clearUser();
    },
    onSuccess: () => qc.clear(),
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: async ({ newPassword }: { newPassword: string }) => {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
    },
  });
}

// ── Landing page stats (public aggregates, never private table reads) ──────

export type { LandingStats } from '@/lib/public-stats';

export function useLandingStats() {
  return useQuery<LandingStats>({
    queryKey: getLandingStatsQueryKey(),
    queryFn: async (): Promise<LandingStats> => {
      const { data, error } = await supabase.rpc('get_public_library_stats');
      if (error) throw error;
      return parseLandingStats(data);
    },
    retry: false,
    // The dashboard can change these values moments before the visitor returns
    // to the landing page. Always re-check on mount/focus instead of serving a
    // five-minute snapshot from the shared React Query cache.
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    // Also covers changes made from another dashboard tab/session where the
    // local QueryClient cannot receive the mutation invalidation directly.
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  });
}

// ── Reports ───────────────────────────────────────────────────────────────

export function useGetReportSummary(params?: { start?: string; end?: string }) {
  return useQuery({
    queryKey: getReportSummaryQueryKey(),
    queryFn: async () => {
      let q = supabase.from('borrowings').select('status, fine, return_date, due_date');
      if (params?.start) q = q.gte('borrow_date', params.start);
      if (params?.end) q = q.lte('borrow_date', params.end);
      const { data, error } = await q;
      if (error) throw error;
      const rows = data ?? [];
      const { count: totalMembers } = await supabase.from('members').select('*', { count: 'exact', head: true });
      const { count: totalBooks } = await supabase.from('books').select('*', { count: 'exact', head: true });
      return {
        totalBorrowings: rows.length,
        totalReturned: rows.filter((b: any) => b.return_date).length,
        totalOverdue: rows.filter((b: any) => !b.return_date && (
          b.status === 'overdue'
          || (b.status === 'borrowed' && b.due_date && b.due_date < format(new Date(), 'yyyy-MM-dd'))
        )).length,
        totalFine: rows.reduce((s: number, b: any) => s + (b.fine ?? 0), 0),
        totalMembers: totalMembers ?? 0,
        totalBooks: totalBooks ?? 0,
      } as ReportSummary;
    },
  });
}
