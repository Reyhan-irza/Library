import { motion } from "framer-motion";

export type EmptyVariant =
  | "books"
  | "members"
  | "borrowings"
  | "categories"
  | "racks"
  | "staff"
  | "favorites"
  | "search";

/* ── Inline SVG Illustrations ─────────────────────────────────────────────── */
function IllustrationBooks() {
  return (
    <svg viewBox="0 0 120 100" fill="none" className="w-28 h-24">
      <rect x="20" y="20" width="80" height="60" rx="6" fill="currentColor" opacity="0.08" />
      <path d="M28 26 Q60 18 92 26 L92 74 Q60 66 28 74 Z" fill="currentColor" opacity="0.12" />
      <line x1="38" y1="38" x2="56" y2="36" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.3" />
      <line x1="38" y1="46" x2="56" y2="44" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.3" />
      <line x1="38" y1="54" x2="52" y2="52" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.25" />
      <line x1="64" y1="36" x2="82" y2="38" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.3" />
      <line x1="64" y1="44" x2="82" y2="46" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.3" />
      <line x1="64" y1="52" x2="76" y2="54" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.25" />
      <circle cx="100" cy="18" r="2.5" fill="currentColor" opacity="0.25" />
      <circle cx="16" cy="72" r="2" fill="currentColor" opacity="0.2" />
      <circle cx="104" cy="76" r="1.5" fill="currentColor" opacity="0.15" />
    </svg>
  );
}

function IllustrationPeople() {
  return (
    <svg viewBox="0 0 120 100" fill="none" className="w-28 h-24">
      <circle cx="72" cy="35" r="13" fill="currentColor" opacity="0.1" />
      <path d="M50 80 Q72 62 94 80" stroke="currentColor" strokeWidth="12" strokeLinecap="round" opacity="0.1" />
      <circle cx="46" cy="38" r="15" fill="currentColor" opacity="0.16" />
      <path d="M20 84 Q46 65 72 84" stroke="currentColor" strokeWidth="14" strokeLinecap="round" opacity="0.16" />
    </svg>
  );
}

function IllustrationBorrowings() {
  return (
    <svg viewBox="0 0 120 100" fill="none" className="w-28 h-24">
      <rect x="22" y="14" width="68" height="74" rx="8" fill="currentColor" opacity="0.08" />
      <rect x="34" y="9" width="44" height="10" rx="5" fill="currentColor" opacity="0.15" />
      <line x1="35" y1="38" x2="75" y2="38" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.25" />
      <line x1="35" y1="50" x2="75" y2="50" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.2" />
      <line x1="35" y1="62" x2="62" y2="62" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.15" />
      <path d="M87 52 L99 64 M99 64 L87 76 M99 64 H70" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.3" />
    </svg>
  );
}

function IllustrationCategories() {
  return (
    <svg viewBox="0 0 120 100" fill="none" className="w-28 h-24">
      <path d="M18 46 L18 80 Q18 84 22 84 L98 84 Q102 84 102 80 L102 46 Z" fill="currentColor" opacity="0.12" />
      <path d="M18 46 L18 40 Q18 36 22 36 L52 36 L58 46 L98 46 Q102 46 102 50 L102 46 Z" fill="currentColor" opacity="0.18" />
      <line x1="60" y1="58" x2="60" y2="72" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.35" />
      <line x1="53" y1="65" x2="67" y2="65" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.35" />
    </svg>
  );
}

function IllustrationRacks() {
  return (
    <svg viewBox="0 0 120 100" fill="none" className="w-28 h-24">
      <rect x="16" y="14" width="88" height="74" rx="5" fill="currentColor" opacity="0.07" />
      <line x1="16" y1="42" x2="104" y2="42" stroke="currentColor" strokeWidth="3" opacity="0.15" />
      <line x1="16" y1="70" x2="104" y2="70" stroke="currentColor" strokeWidth="3" opacity="0.15" />
      <rect x="24" y="18" width="9" height="21" rx="2" fill="currentColor" opacity="0.2" />
      <rect x="35" y="22" width="7" height="17" rx="2" fill="currentColor" opacity="0.15" />
      <rect x="44" y="18" width="11" height="21" rx="2" fill="currentColor" opacity="0.18" />
      <rect x="58" y="20" width="8" height="19" rx="2" fill="currentColor" opacity="0.12" />
      <rect x="24" y="46" width="8" height="21" rx="2" fill="currentColor" opacity="0.15" />
      <rect x="34" y="50" width="11" height="17" rx="2" fill="currentColor" opacity="0.18" />
      <rect x="47" y="46" width="9" height="21" rx="2" fill="currentColor" opacity="0.12" />
    </svg>
  );
}

function IllustrationFavorites() {
  return (
    <svg viewBox="0 0 120 100" fill="none" className="w-28 h-24">
      <path
        d="M60 80 C60 80 20 56 20 36 C20 24 30 18 40 18 C48 18 55 22 60 28 C65 22 72 18 80 18 C90 18 100 24 100 36 C100 56 60 80 60 80 Z"
        stroke="currentColor" strokeWidth="3" strokeLinejoin="round"
        fill="currentColor" opacity="0.1"
      />
      <circle cx="28" cy="30" r="2" fill="currentColor" opacity="0.2" />
      <circle cx="94" cy="28" r="2.5" fill="currentColor" opacity="0.2" />
      <circle cx="106" cy="52" r="1.5" fill="currentColor" opacity="0.15" />
    </svg>
  );
}

function IllustrationSearch() {
  return (
    <svg viewBox="0 0 120 100" fill="none" className="w-28 h-24">
      <circle cx="50" cy="44" r="26" stroke="currentColor" strokeWidth="4" opacity="0.2" />
      <line x1="68" y1="62" x2="96" y2="88" stroke="currentColor" strokeWidth="5" strokeLinecap="round" opacity="0.2" />
      <line x1="40" y1="34" x2="60" y2="54" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.3" />
      <line x1="60" y1="34" x2="40" y2="54" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.3" />
    </svg>
  );
}

const ILLUSTRATIONS: Record<EmptyVariant, () => JSX.Element> = {
  books: IllustrationBooks,
  members: IllustrationPeople,
  staff: IllustrationPeople,
  borrowings: IllustrationBorrowings,
  categories: IllustrationCategories,
  racks: IllustrationRacks,
  favorites: IllustrationFavorites,
  search: IllustrationSearch,
};

const DEFAULTS: Record<EmptyVariant, { title: string; description: string }> = {
  books:      { title: "Belum ada buku",        description: "Mulai tambahkan koleksi buku ke perpustakaan." },
  members:    { title: "Belum ada anggota",      description: "Daftarkan anggota baru untuk mulai meminjam buku." },
  staff:      { title: "Belum ada staff",        description: "Tambahkan staff untuk membantu pengelolaan perpustakaan." },
  borrowings: { title: "Belum ada peminjaman",   description: "Semua buku ada di rak — belum ada yang dipinjam." },
  categories: { title: "Belum ada kategori",     description: "Tambahkan kategori untuk mengelompokkan koleksi buku." },
  racks:      { title: "Belum ada rak",          description: "Tambahkan rak untuk menata fisik koleksi buku." },
  favorites:  { title: "Belum ada favorit",      description: "Tandai buku yang kamu sukai untuk akses cepat." },
  search:     { title: "Tidak ada hasil",        description: "Coba kata kunci lain atau hapus filter aktif." },
};

interface EmptyStateProps {
  variant: EmptyVariant;
  title?: string;
  description?: string;
  className?: string;
}

export function EmptyState({ variant, title, description, className }: EmptyStateProps) {
  const Illustration = ILLUSTRATIONS[variant];
  const defaults = DEFAULTS[variant];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
      className={`flex flex-col items-center justify-center py-20 select-none ${className ?? ""}`}
    >
      <motion.div
        className="text-muted-foreground/40 mb-5"
        animate={{ y: [0, -7, 0] }}
        transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut" }}
      >
        <Illustration />
      </motion.div>
      <p className="text-sm font-semibold text-foreground/70 font-heading">
        {title ?? defaults.title}
      </p>
      <p className="text-xs text-muted-foreground mt-1.5 text-center max-w-[220px] leading-relaxed">
        {description ?? defaults.description}
      </p>
    </motion.div>
  );
}
