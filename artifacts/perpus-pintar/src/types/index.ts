// ── Domain types used throughout the app ──────────────────────────────────

export interface Book {
  id: number;
  isbn: string;
  title: string;
  author: string;
  publisher?: string | null;
  year?: number | null;
  stock: number;
  availableStock: number;
  description?: string | null;
  pages?: number | null;
  coverUrl?: string | null;
  categoryId?: number | null;
  rackId?: number | null;
  status: 'available' | 'borrowed';
  categoryName?: string | null;
  rackName?: string | null;
}

export interface BookInput {
  isbn: string;
  title: string;
  author: string;
  publisher?: string;
  year?: number;
  stock?: number;
  description?: string;
  pages?: number;
  coverUrl?: string;
  categoryId?: number;
  rackId?: number;
}

export interface BookUpdate {
  isbn?: string;
  title?: string;
  author?: string;
  publisher?: string;
  year?: number;
  stock?: number;
  description?: string;
  pages?: number;
  coverUrl?: string;
  categoryId?: number;
  rackId?: number;
}

export interface Category {
  id: number;
  name: string;
  description?: string | null;
  bookCount: number;
  createdAt?: string;
}

export interface CategoryInput {
  name: string;
  description?: string;
}

export interface Rack {
  id: number;
  name: string;
  location?: string | null;
  description?: string | null;
  bookCount: number;
  createdAt?: string;
}

export interface RackInput {
  name: string;
  location?: string;
  description?: string;
}

export interface Member {
  id: number;
  memberNumber: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  borrowCount?: number;
  fine?: number;
  createdAt?: string;
}

export interface MemberInput {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface Borrowing {
  id: number;
  memberId: number;
  bookId: number;
  memberName: string;
  memberNumber: string;
  bookTitle: string;
  bookIsbn: string;
  borrowDate: string;
  dueDate: string;
  returnDate?: string | null;
  status: 'borrowed' | 'returned' | 'overdue';
  fine?: number;
  notes?: string | null;
  createdAt?: string;
}

export interface BorrowingInput {
  memberId: number;
  bookId: number;
  dueDate: string;
  notes?: string;
}

export interface StaffMember {
  id: string;
  username: string;
  name: string;
  email?: string | null;
  role: 'admin' | 'librarian';
}

export interface StaffInput {
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'librarian';
}

export interface StaffUpdate {
  name?: string;
  email?: string;
  role?: 'admin' | 'librarian';
}

export interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  read: boolean;
}

export interface Activity {
  id: number;
  type: string;
  description: string;
  createdAt: string;
}

export interface DashboardStats {
  totalBooks: number;
  totalMembers: number;
  totalBorrowed: number;
  totalAvailable: number;
  overdueCount: number;
  totalFine: number;
}

export interface ChartData {
  month: string;
  borrowed: number;
  returned: number;
}

export interface TopBook {
  id: number;
  title: string;
  author: string;
  coverUrl?: string | null;
  borrowCount: number;
}

export interface ReportSummary {
  totalBorrowings: number;
  totalReturned: number;
  totalOverdue: number;
  totalFine: number;
  totalMembers: number;
  totalBooks: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
}
