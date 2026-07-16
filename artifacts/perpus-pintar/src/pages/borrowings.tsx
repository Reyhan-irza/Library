import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, ArrowLeftRight, X, Loader2, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useListBorrowings, useCreateBorrowing, useReturnBook, useListMembers, useListBooks } from "@/hooks/api";
import type { BorrowingInput } from "@/types";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { addDays, format } from "date-fns";

function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ type: "spring", stiffness: 320, damping: 30 }}
            className="relative bg-card border border-border/50 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-border/50">
              <h2 className="text-sm font-bold" style={{ fontFamily: "'Outfit', sans-serif" }}>{title}</h2>
              <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-muted transition-colors"><X size={15} /></button>
            </div>
            <div className="p-5">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

const statusConfig = {
  borrowed: { label: "Dipinjam", icon: Clock, className: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  returned: { label: "Dikembalikan", icon: CheckCircle2, className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  overdue: { label: "Terlambat", icon: AlertTriangle, className: "bg-rose-500/10 text-rose-600 dark:text-rose-400" },
};

export default function BorrowingsPage() {
  const { data: borrowings = [], isLoading } = useListBorrowings();
  const { data: members = [] } = useListMembers();
  const { data: books = [] } = useListBooks();
  const createBorrowing = useCreateBorrowing();
  const returnBook = useReturnBook();

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"" | "borrowed" | "returned" | "overdue">("");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<{ memberId: string; bookId: string; dueDate: string; notes: string }>({
    memberId: "", bookId: "", dueDate: format(addDays(new Date(), 7), "yyyy-MM-dd"), notes: "",
  });

  const filtered = borrowings.filter(b => {
    const q = search.toLowerCase();
    const matchSearch = !q || b.memberName.toLowerCase().includes(q) || b.bookTitle.toLowerCase().includes(q) || b.memberNumber.toLowerCase().includes(q);
    const matchStatus = !filterStatus || b.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const availableBooks = books.filter(b => b.status === "available");

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.memberId || !form.bookId || !form.dueDate) { toast.error("Lengkapi semua field wajib"); return; }
    createBorrowing.mutate({
      memberId: Number(form.memberId), bookId: Number(form.bookId),
      dueDate: form.dueDate, notes: form.notes || undefined,
    } as BorrowingInput, {
      onSuccess: () => { toast.success("Peminjaman berhasil dicatat"); setShowAdd(false); },
      onError: (e: any) => toast.error(e?.message ?? "Gagal mencatat peminjaman"),
    });
  }

  function handleReturn(id: number) {
    if (!confirm("Konfirmasi pengembalian buku ini?")) return;
    returnBook.mutate(id, {
      onSuccess: () => toast.success("Buku berhasil dikembalikan"),
      onError: (e: any) => toast.error(e?.message ?? "Gagal memproses pengembalian"),
    });
  }

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold gradient-text" style={{ fontFamily: "'Sora', sans-serif" }}>Peminjaman</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{borrowings.filter(b => b.status !== "returned").length} aktif</p>
        </div>
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-primary text-primary-foreground text-sm font-bold shadow-sm shadow-primary/20 hover:bg-primary/90 transition-all">
          <Plus size={16} /> Pinjam Buku
        </motion.button>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }}
        className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Cari anggota atau buku…"
            className="w-full h-10 pl-9 pr-3 rounded-xl border border-border bg-background/60 text-sm focus:outline-none focus:border-primary transition-colors" />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)}
          className="h-10 px-3 rounded-xl border border-border bg-background/60 text-sm focus:outline-none focus:border-primary transition-colors">
          <option value="">Semua Status</option>
          <option value="borrowed">Dipinjam</option>
          <option value="returned">Dikembalikan</option>
          <option value="overdue">Terlambat</option>
        </select>
      </motion.div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-primary" /></div>
      ) : (
        <div className="space-y-2">
          {filtered.map((b, i) => {
            const cfg = statusConfig[b.status];
            const Icon = cfg.icon;
            return (
              <motion.div key={b.id}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, type: "spring", stiffness: 280, damping: 26 }}
                className="glass rounded-2xl p-4 shadow-card flex items-center gap-4">
                <div className={cn("w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0", cfg.className.replace("text-", "bg-").replace("bg-", "bg-"))}>
                  <Icon size={15} className={cfg.className.split(" ").find(c => c.startsWith("text-")) ?? ""} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{b.bookTitle}</p>
                      <p className="text-xs text-muted-foreground">{b.memberName} · {b.memberNumber}</p>
                    </div>
                    <span className={cn("flex-shrink-0 text-[10px] font-bold px-2 py-1 rounded-lg", cfg.className)}>
                      {cfg.label}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-3 mt-1.5 text-[10px] text-muted-foreground">
                    <span>Pinjam: {formatDate(b.borrowDate)}</span>
                    <span>Jatuh tempo: {formatDate(b.dueDate)}</span>
                    {b.returnDate && <span>Kembali: {formatDate(b.returnDate)}</span>}
                    {b.fine ? <span className="text-rose-500 font-semibold">Denda: Rp {b.fine.toLocaleString("id-ID")}</span> : null}
                  </div>
                </div>
                {b.status !== "returned" && (
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onClick={() => handleReturn(b.id)}
                    disabled={returnBook.isPending}
                    className="flex-shrink-0 px-3 py-2 rounded-xl bg-primary/10 text-primary text-xs font-bold hover:bg-primary hover:text-primary-foreground transition-all">
                    Kembalikan
                  </motion.button>
                )}
              </motion.div>
            );
          })}
          {!filtered.length && (
            <div className="text-center py-16 text-muted-foreground">
              <ArrowLeftRight size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Tidak ada data peminjaman</p>
            </div>
          )}
        </div>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Catat Peminjaman">
        <form onSubmit={handleCreate} className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider">Anggota *</label>
            <select value={form.memberId} onChange={e => setForm(f => ({ ...f, memberId: e.target.value }))} required
              className="mt-1 w-full h-10 px-3 rounded-xl border border-border bg-background/60 text-sm focus:outline-none focus:border-primary transition-colors">
              <option value="">Pilih Anggota</option>
              {members.map(m => <option key={m.id} value={m.id}>{m.name} ({m.memberNumber})</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider">Buku *</label>
            <select value={form.bookId} onChange={e => setForm(f => ({ ...f, bookId: e.target.value }))} required
              className="mt-1 w-full h-10 px-3 rounded-xl border border-border bg-background/60 text-sm focus:outline-none focus:border-primary transition-colors">
              <option value="">Pilih Buku (tersedia)</option>
              {availableBooks.map(b => <option key={b.id} value={b.id}>{b.title}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider">Tanggal Jatuh Tempo *</label>
            <input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} required
              className="mt-1 w-full h-10 px-3 rounded-xl border border-border bg-background/60 text-sm focus:outline-none focus:border-primary transition-colors" />
          </div>
          <div>
            <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider">Catatan</label>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2}
              className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-background/60 text-sm focus:outline-none focus:border-primary transition-colors resize-none" />
          </div>
          <button type="submit" disabled={createBorrowing.isPending}
            className="w-full h-11 rounded-xl bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-all">
            {createBorrowing.isPending ? <><Loader2 size={15} className="animate-spin" /> Memproses…</> : "Pinjam Buku"}
          </button>
        </form>
      </Modal>
    </div>
  );
}
