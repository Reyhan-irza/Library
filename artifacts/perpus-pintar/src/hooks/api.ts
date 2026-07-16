import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { setUser, clearUser, getUser } from '@/lib/auth';
import type {
  Book, BookInput, BookUpdate,
  Category, CategoryInput,
  Rack, RackInput,
  Member, MemberInput,
  Borrowing, BorrowingInput,
  StaffMember, StaffInput, StaffUpdate,
  DashboardStats, ChartData, TopBook, Activity, Notification, ReportSummary,
} from '@/types';
import { differenceInDays, parseISO, addDays, format } from 'date-fns';

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
export const getDashboardChartQueryKey = () => ['dashboard', 'chart'];
export const getRecentActivitiesQueryKey = () => ['activities'];
export const getTopBooksQueryKey = () => ['topBooks'];
export const getNotificationsQueryKey = () => ['notifications'];
export const getMeQueryKey = () => ['me'];
export const getReportSummaryQueryKey = () => ['report', 'summary'];

// ── Helpers ───────────────────────────────────────────────────────────────

function mapBook(row: any): Book {
  const stock = row.stock ?? 0;
  const avail = row.available_stock ?? 0;
  return {
    id: row.id,
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

function mapBorrowing(row: any): Borrowing {
  const today = new Date();
  const due = parseISO(row.due_date);
  let status: 'borrowed' | 'returned' | 'overdue' = row.status;
  if (status === 'borrowed' && differenceInDays(today, due) > 0) status = 'overdue';
  return {
    id: row.id,
    memberId: row.member_id,
    bookId: row.book_id,
    memberName: row.members?.name ?? '-',
    memberNumber: row.members?.member_number ?? '-',
    bookTitle: row.books?.title ?? '-',
    bookIsbn: row.books?.isbn ?? '-',
    borrowDate: row.borrow_date,
    dueDate: row.due_date,
    returnDate: row.return_date,
    status,
    fine: row.fine ?? 0,
    notes: row.notes,
    createdAt: row.created_at,
  };
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
    onSuccess: () => qc.invalidateQueries({ queryKey: getBooksQueryKey() }),
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
      if (input.stock !== undefined) update.stock = input.stock;
      if (input.description !== undefined) update.description = input.description;
      if (input.pages !== undefined) update.pages = input.pages;
      if (input.coverUrl !== undefined) update.cover_url = input.coverUrl;
      if (input.categoryId !== undefined) update.category_id = input.categoryId;
      if (input.rackId !== undefined) update.rack_id = input.rackId;

      const { data, error } = await supabase.from('books').update(update).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: getBooksQueryKey() }),
  });
}

export function useDeleteBook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from('books').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: getBooksQueryKey() }),
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
        email: m.email,
        phone: m.phone,
        address: m.address,
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
      const { data, error } = await supabase.from('members').insert({ name: input.name, email: input.email ?? null, phone: input.phone ?? null, address: input.address ?? null }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: getMembersQueryKey() }),
  });
}

export function useUpdateMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: MemberInput }) => {
      const { error } = await supabase.from('members').update({ name: data.name, email: data.email ?? null, phone: data.phone ?? null, address: data.address ?? null }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: getMembersQueryKey() }),
  });
}

export function useDeleteMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from('members').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: getMembersQueryKey() }),
  });
}

// ── Borrowings ────────────────────────────────────────────────────────────

export function useListBorrowings() {
  return useQuery({
    queryKey: getBorrowingsQueryKey(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('borrowings')
        .select('*, members(name, member_number), books(title, isbn)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map(mapBorrowing) as Borrowing[];
    },
  });
}

export function useCreateBorrowing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: BorrowingInput) => {
      const { data, error } = await supabase.rpc('borrow_book', {
        p_member_id: input.memberId,
        p_book_id: input.bookId,
        p_due_date: input.dueDate,
        p_notes: input.notes ?? null,
        p_created_by: getUser()?.id ?? null,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getBorrowingsQueryKey() });
      qc.invalidateQueries({ queryKey: getBooksQueryKey() });
      qc.invalidateQueries({ queryKey: getDashboardStatsQueryKey() });
    },
  });
}

export function useReturnBook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (borrowingId: number) => {
      const { data, error } = await supabase.rpc('return_book', {
        p_borrowing_id: borrowingId,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getBorrowingsQueryKey() });
      qc.invalidateQueries({ queryKey: getBooksQueryKey() });
      qc.invalidateQueries({ queryKey: getDashboardStatsQueryKey() });
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
      const { data, error } = await supabase.auth.signUp({
        email: input.email,
        password: input.password,
        options: {
          data: { name: input.name, role: input.role },
        },
      });
      if (error) throw error;
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
        supabase.from('borrowings').select('status, fine'),
        supabase.from('members').select('*', { count: 'exact', head: true }),
      ]);
      const { data: avail } = await supabase.from('books').select('available_stock').gt('available_stock', 0);
      const borrowed = (borrows ?? []).filter((b: any) => b.status === 'borrowed').length;
      const overdue = (borrows ?? []).filter((b: any) => b.status === 'overdue').length;
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

export function useGetDashboardChart() {
  return useQuery({
    queryKey: getDashboardChartQueryKey(),
    queryFn: async () => {
      const months: ChartData[] = [];
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const start = format(d, 'yyyy-MM-01');
        const end = format(new Date(d.getFullYear(), d.getMonth() + 1, 0), 'yyyy-MM-dd');
        const { data } = await supabase
          .from('borrowings')
          .select('borrow_date, return_date')
          .gte('borrow_date', start)
          .lte('borrow_date', end);
        const borrowed = (data ?? []).length;
        const returned = (data ?? []).filter((b: any) => b.return_date).length;
        months.push({ month: format(d, 'MMM'), borrowed, returned });
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
      const { data, error } = await supabase
        .from('borrowings')
        .select('book_id, books(id, title, author, cover_url)')
        .neq('book_id', null);
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
      const today = new Date();
      const { data, error } = await supabase
        .from('borrowings')
        .select('id, due_date, return_date, status, members(name), books(title)')
        .is('return_date', null)
        .neq('status', 'returned');
      if (error) throw error;
      const notifications: Notification[] = [];
      (data ?? []).forEach((b: any, idx: number) => {
        const due = parseISO(b.due_date);
        const diff = differenceInDays(due, today);
        if (diff < 0) {
          notifications.push({
            id: idx,
            type: 'overdue',
            title: 'Buku Terlambat',
            message: `${b.members?.name} – ${b.books?.title} (${Math.abs(diff)} hari)`,
            read: false,
          });
        } else if (diff <= 3) {
          notifications.push({
            id: idx + 1000,
            type: 'due_soon',
            title: 'Jatuh Tempo Segera',
            message: `${b.members?.name} – ${b.books?.title} (${diff} hari lagi)`,
            read: false,
          });
        }
      });
      return notifications;
    },
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

// ── Reports ───────────────────────────────────────────────────────────────

export function useGetReportSummary(params?: { start?: string; end?: string }) {
  return useQuery({
    queryKey: getReportSummaryQueryKey(),
    queryFn: async () => {
      let q = supabase.from('borrowings').select('status, fine, return_date');
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
        totalOverdue: rows.filter((b: any) => !b.return_date && b.status === 'overdue').length,
        totalFine: rows.reduce((s: number, b: any) => s + (b.fine ?? 0), 0),
        totalMembers: totalMembers ?? 0,
        totalBooks: totalBooks ?? 0,
      } as ReportSummary;
    },
  });
}
