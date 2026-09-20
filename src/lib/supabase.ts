import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[Supabase] VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY belum dikonfigurasi. ' +
    'Salin .env.example ke .env dan isi dengan kredensial Supabase Anda.'
  );
}

export const supabase = createClient(
  supabaseUrl ?? 'https://placeholder.supabase.co',
  supabaseAnonKey ?? 'placeholder-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);

export type Database = {
  public: {
    Tables: {
      profiles: { Row: ProfileRow; Insert: ProfileInsert; Update: ProfileUpdate };
      books: { Row: BookRow; Insert: BookInsert; Update: BookUpdate };
      categories: { Row: CategoryRow; Insert: CategoryInsert; Update: CategoryUpdate };
      racks: { Row: RackRow; Insert: RackInsert; Update: RackUpdate };
      members: { Row: MemberRow; Insert: MemberInsert; Update: MemberUpdate };
      borrowings: { Row: BorrowingRow; Insert: BorrowingInsert; Update: BorrowingUpdate };
      favorites: { Row: FavoriteRow; Insert: FavoriteInsert; Update: FavoriteUpdate };
      activity_logs: { Row: ActivityLogRow; Insert: ActivityLogInsert; Update: never };
    };
  };
};

export interface ProfileRow {
  id: string;
  name: string;
  username: string | null;
  role: string;
  created_at: string;
  updated_at: string;
}
export type ProfileInsert = Partial<ProfileRow> & { id: string };
export type ProfileUpdate = Partial<ProfileRow>;

export interface BookRow {
  id: number;
  isbn: string;
  title: string;
  author: string;
  publisher: string | null;
  year: number | null;
  stock: number;
  available_stock: number;
  description: string | null;
  pages: number | null;
  cover_url: string | null;
  category_id: number | null;
  rack_id: number | null;
  created_at: string;
  updated_at: string;
}
export type BookInsert = Omit<BookRow, 'id' | 'created_at' | 'updated_at'>;
export type BookUpdate = Partial<BookInsert>;

export interface CategoryRow {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
}
export type CategoryInsert = Omit<CategoryRow, 'id' | 'created_at'>;
export type CategoryUpdate = Partial<CategoryInsert>;

export interface RackRow {
  id: number;
  name: string;
  location: string | null;
  description: string | null;
  created_at: string;
}
export type RackInsert = Omit<RackRow, 'id' | 'created_at'>;
export type RackUpdate = Partial<RackInsert>;

export interface MemberRow {
  id: number;
  member_number: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  created_at: string;
}
export type MemberInsert = Omit<MemberRow, 'id' | 'created_at' | 'member_number'> & { member_number?: string };
export type MemberUpdate = Partial<MemberInsert>;

export interface BorrowingRow {
  id: number;
  member_id: number;
  book_id: number;
  borrow_date: string;
  due_date: string;
  return_date: string | null;
  status: string;
  fine: number;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}
export type BorrowingInsert = Omit<BorrowingRow, 'id' | 'created_at'>;
export type BorrowingUpdate = Partial<BorrowingInsert>;

export interface FavoriteRow {
  id: number;
  user_id: string;
  book_id: number;
  created_at: string;
}
export type FavoriteInsert = Omit<FavoriteRow, 'id' | 'created_at'>;
export type FavoriteUpdate = never;

export interface ActivityLogRow {
  id: number;
  user_id: string | null;
  type: string;
  description: string;
  created_at: string;
}
export type ActivityLogInsert = Omit<ActivityLogRow, 'id' | 'created_at'>;
