import { useMemo, useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, BookOpen, CheckCircle2, Filter, Loader2, Search, X } from "lucide-react";
import { toast } from "sonner";
import {
  usePublicCatalog,
  useSubmitPublicBorrowRequest,
} from "@/hooks/api";
import type { PublicCatalogBook, PublicBorrowRequestInput } from "@/types";
import AppModal from "@/components/ui/app-modal";

const typeOptions = [
  { value: "PERSONAL", label: "Peminjaman Pribadi" },
  { value: "CLASS_REPRESENTATIVE", label: "Perwakilan Kelas" },
] as const;

type CatalogCategory = { id: number; name: string };

function availabilityLabel(book: PublicCatalogBook) {
  return book.availabilityStatus === "AVAILABLE"
    ? `${book.availableCopies} tersedia`
    : "Stok sedang habis";
}

export default function CatalogPage() {
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [availableOnly, setAvailableOnly] = useState(false);
  const [selectedBook, setSelectedBook] = useState<PublicCatalogBook | null>(null);
  const [requestResult, setRequestResult] = useState<string | null>(null);
  const { data: books = [], isLoading, isError } = usePublicCatalog(search, categoryId, availableOnly);
  const submitRequest = useSubmitPublicBorrowRequest();

  const categories = useMemo<CatalogCategory[]>(
    () => {
      const byId = new Map<number, CatalogCategory>();
      books.forEach((book) => {
        if (book.categoryId && book.categoryName) {
          byId.set(book.categoryId, { id: book.categoryId, name: book.categoryName });
        }
      });
      return Array.from(byId.values()).sort((a, b) => a.name.localeCompare(b.name));
    },
    [books],
  );

  function handleSubmit(input: PublicBorrowRequestInput) {
    submitRequest.mutate(input, {
      onSuccess: (result) => {
        setRequestResult(result.requestCode);
        setSelectedBook(null);
      },
      onError: (error: any) => toast.error(error?.message ?? "Request tidak dapat dikirim"),
    });
  }

  return (
    <main className="min-h-screen bg-[#fbfaf6] text-slate-900">
      <header className="border-b border-slate-200/70 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-emerald-700">
            <ArrowLeft className="h-4 w-4" /> VIREON Library
          </Link>
          <Link href="/request-status" className="text-sm font-semibold text-emerald-700 hover:text-emerald-800">
            Cek Status Peminjaman
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="mb-8 max-w-2xl">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-700">Public catalog / 01</p>
          <h1 className="text-3xl font-extrabold tracking-[-0.03em] text-slate-950 sm:text-4xl">
            Temukan buku untuk ruang belajarmu.
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-500 sm:text-base">
            Jelajahi koleksi yang tersedia dan ajukan peminjaman tanpa membuat akun.
            Admin akan meninjau request sebelum buku dipinjam.
          </p>
        </div>

        <div className="mb-7 grid gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_12px_40px_-24px_rgba(15,23,42,0.28)] sm:grid-cols-[1fr_auto_auto]">
          <label className="relative block">
            <span className="sr-only">Cari buku</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari judul, pengarang, ISBN, atau kode buku"
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-10 pr-3 text-sm outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-500/10"
            />
          </label>
          <label className="relative block">
            <span className="sr-only">Filter kategori</span>
            <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <select
              value={categoryId ?? ""}
              onChange={(event) => setCategoryId(event.target.value ? Number(event.target.value) : null)}
              className="h-11 w-full min-w-[170px] rounded-xl border border-slate-200 bg-slate-50/70 pl-10 pr-8 text-sm outline-none transition focus:border-emerald-400 focus:bg-white"
            >
              <option value="">Semua kategori</option>
              {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
          </label>
          <button
            type="button"
            onClick={() => setAvailableOnly((value) => !value)}
            aria-pressed={availableOnly}
            className={`h-11 rounded-xl border px-4 text-sm font-semibold transition ${
              availableOnly
                ? "border-emerald-600 bg-emerald-700 text-white"
                : "border-slate-200 bg-slate-50/70 text-slate-600 hover:border-emerald-300"
            }`}
          >
            {availableOnly ? "Tersedia saja" : "Semua status"}
          </button>
        </div>

        {requestResult && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-7 flex flex-col gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
              <div>
                <p className="text-sm font-bold text-emerald-900">Request berhasil dikirim.</p>
                <p className="mt-0.5 text-sm text-emerald-800">Simpan kode ini untuk memeriksa status peminjaman:</p>
                <p className="mt-2 font-mono text-lg font-extrabold tracking-wider text-emerald-900">{requestResult}</p>
              </div>
            </div>
            <Link href="/request-status" className="inline-flex shrink-0 items-center justify-center rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-800">
              Cek status
            </Link>
          </motion.div>
        )}

        {isError && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">
            Katalog belum dapat dimuat. Pastikan migration Phase 2 sudah diterapkan di Supabase.
          </div>
        )}

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-72 animate-pulse rounded-2xl bg-slate-200/70" />)}
          </div>
        ) : !books.length && !isError ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <BookOpen className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-3 text-sm font-semibold text-slate-700">Buku tidak ditemukan</p>
            <p className="mt-1 text-sm text-slate-500">Coba ubah kata kunci atau filter yang digunakan.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {books.map((book) => (
              <motion.article
                key={book.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_12px_32px_-24px_rgba(15,23,42,0.38)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-22px_rgba(15,23,42,0.35)]"
              >
                  <div className="relative flex h-44 items-center justify-center overflow-hidden bg-[linear-gradient(135deg,#e3f2e9,#f6f0e3)] p-5">
                  {book.coverUrl ? (
                      <>
                        <BookOpen className="h-12 w-12 text-emerald-700/35" />
                        <img
                          src={book.coverUrl}
                          alt={`Sampul ${book.title}`}
                          onError={(event) => { event.currentTarget.style.display = "none"; }}
                          className="absolute inset-0 mx-auto h-full max-w-[120px] rounded-lg object-cover shadow-lg"
                        />
                      </>
                  ) : (
                    <BookOpen className="h-12 w-12 text-emerald-700/35" />
                  )}
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate text-base font-bold text-slate-900">{book.title}</h2>
                      <p className="mt-1 truncate text-sm text-slate-500">{book.author}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold ${
                      book.availabilityStatus === "AVAILABLE" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                    }`}>
                      {availabilityLabel(book)}
                    </span>
                  </div>
                  <p className="mt-3 line-clamp-2 min-h-10 text-xs leading-relaxed text-slate-500">
                    {book.description || "Detail koleksi tersedia setelah buku dibuka."}
                  </p>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <span className="text-[11px] text-slate-400">{book.categoryName || "Tanpa kategori"}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedBook(book)}
                      className="rounded-xl bg-emerald-700 px-3 py-2 text-xs font-bold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                      disabled={book.availabilityStatus !== "AVAILABLE"}
                    >
                      Ajukan Peminjaman
                    </button>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        )}
      </div>

      <AppModal
        open={!!selectedBook}
        onClose={() => { if (!submitRequest.isPending) setSelectedBook(null); }}
        title="Ajukan Peminjaman"
      >
        {selectedBook && (
          <PublicRequestForm
            book={selectedBook}
            loading={submitRequest.isPending}
            onCancel={() => setSelectedBook(null)}
            onSubmit={handleSubmit}
          />
        )}
      </AppModal>
    </main>
  );
}

function PublicRequestForm({
  book,
  loading,
  onCancel,
  onSubmit,
}: {
  book: PublicCatalogBook;
  loading: boolean;
  onCancel: () => void;
  onSubmit: (input: PublicBorrowRequestInput) => void;
}) {
  const [form, setForm] = useState({
    borrowingType: "PERSONAL" as PublicBorrowRequestInput["borrowingType"],
    requesterName: "",
    requesterClass: "",
    requesterStudentId: "",
    requesterContact: "",
    quantity: "1",
    notes: "",
  });

  function update(key: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit({
          bookId: book.id,
          quantity: Math.max(1, Number(form.quantity)),
          borrowingType: form.borrowingType,
          requesterName: form.requesterName.trim(),
          requesterClass: form.requesterClass.trim(),
          requesterStudentId: form.requesterStudentId.trim(),
          requesterContact: form.requesterContact.trim(),
          notes: form.notes.trim(),
        });
      }}
      className="space-y-4"
    >
      <div className="rounded-xl bg-emerald-50 p-3">
        <p className="text-sm font-bold text-emerald-950">{book.title}</p>
        <p className="mt-1 text-xs text-emerald-800">{book.availableCopies} eksemplar tersedia · {book.author}</p>
      </div>
      <fieldset>
        <legend className="text-xs font-bold uppercase tracking-wider text-slate-500">Jenis peminjaman</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {typeOptions.map((option) => (
            <label key={option.value} className={`cursor-pointer rounded-xl border p-3 text-sm transition ${
              form.borrowingType === option.value ? "border-emerald-500 bg-emerald-50 text-emerald-800" : "border-slate-200"
            }`}>
              <input
                type="radio"
                name="borrowingType"
                value={option.value}
                checked={form.borrowingType === option.value}
                onChange={(event) => update("borrowingType", event.target.value)}
                className="sr-only"
              />
              <span className="font-semibold">{option.label}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Nama lengkap *" value={form.requesterName} onChange={(value) => update("requesterName", value)} required />
        <Field label="Kelas *" value={form.requesterClass} onChange={(value) => update("requesterClass", value)} required />
        <Field label="NIS/NISN *" value={form.requesterStudentId} onChange={(value) => update("requesterStudentId", value)} required />
        <Field label="Kontak (opsional)" value={form.requesterContact} onChange={(value) => update("requesterContact", value)} />
        <label className="block">
          <span className="text-xs font-semibold text-slate-600">Jumlah *</span>
          <input type="number" min={1} max={book.availableCopies} value={form.quantity} onChange={(event) => update("quantity", event.target.value)} required className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-emerald-400" />
        </label>
      </div>
      <label className="block">
        <span className="text-xs font-semibold text-slate-600">Catatan (opsional)</span>
        <textarea value={form.notes} onChange={(event) => update("notes", event.target.value)} rows={3} className="mt-1 w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400" />
      </label>
      <div className="flex items-center justify-end gap-2 pt-1">
        <button type="button" onClick={onCancel} disabled={loading} className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100">
          <X className="h-4 w-4" /> Batal
        </button>
        <button type="submit" disabled={loading} className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
          Kirim Request
        </button>
      </div>
    </form>
  );
}

function Field({ label, value, onChange, required = false }: { label: string; value: string; onChange: (value: string) => void; required?: boolean }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-slate-600">{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} required={required} className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-emerald-400" />
    </label>
  );
}