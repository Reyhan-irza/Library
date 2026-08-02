import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Search, BookOpen, Edit, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  useListBooks, useCreateBook, useUpdateBook, useDeleteBook,
  useListCategories, useListRacks, useGetFavoriteIds, useAddFavorite, useRemoveFavorite,
} from "@/hooks/api";
import type { Book, BookInput } from "@/types";
import BookDetailSheet from "@/components/book-detail-sheet";
import AppModal from "@/components/ui/app-modal";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import { SkeletonBookCard } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";

function BookForm({ initial, onSubmit, loading, categories, racks }: {
  initial?: Partial<BookInput>; onSubmit: (d: BookInput) => void; loading: boolean;
  categories: { id: number; name: string }[]; racks: { id: number; name: string }[];
}) {
  const [form, setForm] = useState<BookInput>({
    isbn: initial?.isbn ?? "",
    title: initial?.title ?? "",
    author: initial?.author ?? "",
    publisher: initial?.publisher ?? "",
    year: initial?.year,
    stock: initial?.stock ?? 1,
    description: initial?.description ?? "",
    pages: initial?.pages,
    coverUrl: initial?.coverUrl ?? "",
    categoryId: initial?.categoryId,
    rackId: initial?.rackId,
  });

  function field(key: keyof BookInput) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const v = e.target.value;
      setForm(f => ({ ...f, [key]: key === "year" || key === "stock" || key === "pages" || key === "categoryId" || key === "rackId"
        ? (v === "" ? undefined : Number(v)) : v }));
    };
  }

  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(form); }} className="space-y-3">
      {(["isbn", "title", "author"] as const).map(k => (
        <div key={k}>
          <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider">
            {k === "isbn" ? "ISBN *" : k === "title" ? "Judul *" : "Pengarang *"}
          </label>
          <input value={(form as any)[k] ?? ""} onChange={field(k)} required
            className="mt-1 w-full h-10 px-3 rounded-xl border border-border bg-background/60 text-sm focus:outline-none focus:border-primary transition-colors" />
        </div>
      ))}
      {(["publisher", "coverUrl"] as const).map(k => (
        <div key={k}>
          <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider">
            {k === "publisher" ? "Penerbit" : "URL Sampul"}
          </label>
          <input value={(form as any)[k] ?? ""} onChange={field(k)}
            className="mt-1 w-full h-10 px-3 rounded-xl border border-border bg-background/60 text-sm focus:outline-none focus:border-primary transition-colors" />
        </div>
      ))}
      <div className="grid grid-cols-3 gap-3">
        {(["year", "stock", "pages"] as const).map(k => (
          <div key={k}>
            <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider">
              {k === "year" ? "Tahun" : k === "stock" ? "Stok" : "Halaman"}
            </label>
            <input type="number" value={(form as any)[k] ?? ""} onChange={field(k)}
              className="mt-1 w-full h-10 px-3 rounded-xl border border-border bg-background/60 text-sm focus:outline-none focus:border-primary transition-colors" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider">Kategori</label>
          <select value={form.categoryId ?? ""} onChange={field("categoryId")}
            className="mt-1 w-full h-10 px-3 rounded-xl border border-border bg-background/60 text-sm focus:outline-none focus:border-primary transition-colors">
            <option value="">Pilih</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider">Rak</label>
          <select value={form.rackId ?? ""} onChange={field("rackId")}
            className="mt-1 w-full h-10 px-3 rounded-xl border border-border bg-background/60 text-sm focus:outline-none focus:border-primary transition-colors">
            <option value="">Pilih</option>
            {racks.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider">Deskripsi</label>
        <textarea value={form.description ?? ""} onChange={field("description")} rows={3}
          className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-background/60 text-sm focus:outline-none focus:border-primary transition-colors resize-none" />
      </div>
      <button type="submit" disabled={loading}
        className="w-full h-11 rounded-xl bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-all">
        {loading ? <><Loader2 size={15} className="animate-spin" /> Menyimpan…</> : "Simpan"}
      </button>
    </form>
  );
}

export default function BooksPage() {
  const { data: books = [], isLoading } = useListBooks();
  const { data: categories = [] } = useListCategories();
  const { data: racks = [] } = useListRacks();
  const { data: favoriteIds = [] } = useGetFavoriteIds();
  const createBook = useCreateBook();
  const updateBook = useUpdateBook();
  const deleteBook = useDeleteBook();
  const addFav = useAddFavorite();
  const removeFav = useRemoveFavorite();

  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<number | "">("");
  const [filterStatus, setFilterStatus] = useState<"" | "available" | "borrowed">("");
  const [showAdd, setShowAdd] = useState(false);
  const [editBook, setEditBook] = useState<Book | null>(null);
  const [detailBook, setDetailBook] = useState<Book | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const filtered = books.filter(b => {
    const q = search.toLowerCase();
    const matchSearch = !q || b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q) || b.isbn.toLowerCase().includes(q);
    const matchCat = filterCat === "" || b.categoryId === filterCat;
    const matchStatus = !filterStatus || b.status === filterStatus;
    return matchSearch && matchCat && matchStatus;
  });

  function handleCreate(data: BookInput) {
    createBook.mutate(data, {
      onSuccess: () => { toast.success("Buku berhasil ditambahkan"); setShowAdd(false); },
      onError: (e: any) => toast.error(e?.message ?? "Gagal menambahkan buku"),
    });
  }

  function handleUpdate(data: BookInput) {
    if (!editBook) return;
    updateBook.mutate({ id: editBook.id, data }, {
      onSuccess: () => { toast.success("Buku berhasil diperbarui"); setEditBook(null); },
      onError: (e: any) => toast.error(e?.message ?? "Gagal memperbarui buku"),
    });
  }

  function handleDelete() {
    if (!deleteId) return;
    deleteBook.mutate(deleteId, {
      onSuccess: () => { toast.success("Buku dihapus"); setDeleteId(null); },
      onError: (e: any) => { toast.error(e?.message ?? "Gagal menghapus buku"); setDeleteId(null); },
    });
  }

  function handleToggleFavorite(book: Book) {
    if (favoriteIds.includes(book.id)) {
      removeFav.mutate(book.id, { onSuccess: () => toast.success("Dihapus dari favorit") });
    } else {
      addFav.mutate(book.id, { onSuccess: () => toast.success("Ditambah ke favorit") });
    }
  }

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold gradient-text font-heading">Koleksi Buku</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{books.length} buku terdaftar</p>
        </div>
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-primary text-primary-foreground text-sm font-bold shadow-sm shadow-primary/20 hover:bg-primary/90 transition-all btn-primary-glow">
          <Plus size={16} /> Tambah Buku
        </motion.button>
      </motion.div>

      {/* Filters */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Cari judul, pengarang, ISBN…"
            className="w-full h-10 pl-9 pr-3 rounded-xl border border-border bg-background/60 text-sm focus:outline-none focus:border-primary transition-colors" />
        </div>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value === "" ? "" : Number(e.target.value))}
          className="h-10 px-3 rounded-xl border border-border bg-background/60 text-sm focus:outline-none focus:border-primary transition-colors">
          <option value="">Semua Kategori</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)}
          className="h-10 px-3 rounded-xl border border-border bg-background/60 text-sm focus:outline-none focus:border-primary transition-colors">
          <option value="">Semua Status</option>
          <option value="available">Tersedia</option>
          <option value="borrowed">Dipinjam</option>
        </select>
      </motion.div>

      {/* Book grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {Array.from({ length: 12 }).map((_, i) => <SkeletonBookCard key={i} />)}
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {filtered.map((book, i) => (
            <motion.div key={book.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, type: "spring", stiffness: 280, damping: 26 }}
              className="glass rounded-2xl overflow-hidden shadow-card card-lift transition-all duration-300 group cursor-pointer"
              onClick={() => setDetailBook(book)}>
              <div className="aspect-[3/4] overflow-hidden bg-muted relative">
                {book.coverUrl
                  ? <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  : <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                      <BookOpen size={24} className="text-primary/30" />
                    </div>
                }
                <div className={cn(
                  "absolute top-2 left-2 text-[9px] font-bold px-1.5 py-0.5 rounded-md",
                  book.status === "available" ? "bg-emerald-500/90 text-white" : "bg-rose-500/90 text-white"
                )}>
                  {book.status === "available" ? "Tersedia" : "Dipinjam"}
                </div>
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={e => { e.stopPropagation(); setEditBook(book); }}
                    className="w-7 h-7 rounded-lg bg-card/90 backdrop-blur-sm flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all shadow-sm">
                    <Edit size={12} />
                  </button>
                  <button onClick={e => { e.stopPropagation(); setDeleteId(book.id); }}
                    className="w-7 h-7 rounded-lg bg-card/90 backdrop-blur-sm flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-sm">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
              <div className="p-2.5">
                <p className="text-xs font-semibold text-foreground line-clamp-2 leading-tight">{book.title}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{book.author}</p>
                {book.categoryName && (
                  <span className="inline-block mt-1.5 text-[9px] font-medium px-1.5 py-0.5 bg-primary/10 text-primary rounded-md">
                    {book.categoryName}
                  </span>
                )}
              </div>
            </motion.div>
          ))}
          {!filtered.length && (
            <div className="col-span-full">
              <EmptyState variant={search || filterCat || filterStatus ? "search" : "books"} />
            </div>
          )}
        </motion.div>
      )}

      <AppModal open={showAdd} onClose={() => setShowAdd(false)} title="Tambah Buku" scrollable>
        <BookForm onSubmit={handleCreate} loading={createBook.isPending} categories={categories} racks={racks} />
      </AppModal>

      <AppModal open={!!editBook} onClose={() => setEditBook(null)} title="Edit Buku" scrollable>
        {editBook && (
          <BookForm
            initial={{
              isbn: editBook.isbn, title: editBook.title, author: editBook.author,
              publisher: editBook.publisher ?? "", year: editBook.year ?? undefined,
              stock: editBook.stock, description: editBook.description ?? "",
              pages: editBook.pages ?? undefined, coverUrl: editBook.coverUrl ?? "",
              categoryId: editBook.categoryId ?? undefined, rackId: editBook.rackId ?? undefined,
            }}
            onSubmit={handleUpdate}
            loading={updateBook.isPending}
            categories={categories}
            racks={racks}
          />
        )}
      </AppModal>

      <BookDetailSheet
        book={detailBook}
        open={!!detailBook}
        onClose={() => setDetailBook(null)}
        isFavorite={detailBook ? favoriteIds.includes(detailBook.id) : false}
        onToggleFavorite={handleToggleFavorite}
      />

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Hapus Buku"
        message="Buku ini akan dihapus permanen dari sistem. Tindakan ini tidak dapat dibatalkan."
        confirmLabel="Hapus Buku"
        loading={deleteBook.isPending}
      />
    </div>
  );
}
