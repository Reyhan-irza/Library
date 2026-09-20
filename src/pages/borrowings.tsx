import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Plus, Search, ArrowLeftRight, Loader2, CheckCircle2, Clock,
  AlertTriangle, XCircle, ClipboardCheck, Inbox, ListChecks,
} from "lucide-react";
import { toast } from "sonner";
import {
  useListBorrowings,
  useCreateBorrowing,
  useReturnBook,
  useListMembers,
  useListBooks,
  useApproveBorrowRequest,
  useRejectBorrowRequest,
  useMarkOverdueBorrowings,
} from "@/hooks/api";
import type { BorrowingInput } from "@/types";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { addDays, format } from "date-fns";
import AppModal from "@/components/ui/app-modal";
import { SkeletonRow } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";

const statusConfig = {
  pending: { label: "Menunggu", icon: Clock, className: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  approved: { label: "Disetujui", icon: CheckCircle2, className: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400" },
  borrowed: { label: "Dipinjam", icon: Clock, className: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  returned: { label: "Dikembalikan", icon: CheckCircle2, className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  overdue: { label: "Terlambat", icon: AlertTriangle, className: "bg-rose-500/10 text-rose-600 dark:text-rose-400" },
  rejected: { label: "Ditolak", icon: XCircle, className: "bg-rose-500/10 text-rose-600 dark:text-rose-400" },
  cancelled: { label: "Dibatalkan", icon: XCircle, className: "bg-slate-500/10 text-slate-600 dark:text-slate-400" },
} as const;

const borrowingTypeLabel = {
  PERSONAL: "Pribadi",
  CLASS_REPRESENTATIVE: "Perwakilan Kelas",
} as const;

type QueueTab = "pending" | "borrowed" | "overdue" | "returned" | "all";

const queueTabs: { value: QueueTab; label: string }[] = [
  { value: "pending", label: "Perlu ditinjau" },
  { value: "borrowed", label: "Sedang dipinjam" },
  { value: "overdue", label: "Terlambat" },
  { value: "returned", label: "Selesai" },
  { value: "all", label: "Semua transaksi" },
];

function QueueMetric({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  tone: "primary" | "amber" | "rose" | "violet";
}) {
  const toneClasses = {
    primary: "bg-primary/10 text-primary",
    amber: "bg-amber-500/10 text-amber-600",
    rose: "bg-rose-500/10 text-rose-600",
    violet: "bg-violet-500/10 text-violet-600",
  };

  return (
    <div className="glass flex items-center gap-2.5 rounded-2xl p-3 shadow-card">
      <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-xl", toneClasses[tone])}>
        <Icon size={15} />
      </div>
      <div className="min-w-0">
        <p className="font-heading text-base font-extrabold leading-none text-foreground">{value}</p>
        <p className="mt-1 truncate text-[10px] text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

export default function BorrowingsPage() {
  const { data: borrowings = [], isLoading } = useListBorrowings();
  const { data: members = [] } = useListMembers();
  const { data: books = [] } = useListBooks();
  const createBorrowing = useCreateBorrowing();
  const returnBook = useReturnBook();
  const approveRequest = useApproveBorrowRequest();
  const rejectRequest = useRejectBorrowRequest();
  const markOverdue = useMarkOverdueBorrowings();

  useEffect(() => {
    markOverdue.mutate(undefined, {
      onError: (error: any) => toast.error(error?.message ?? "Gagal menyinkronkan status keterlambatan"),
    });
    // The RPC is idempotent and keeps the database status/fine current for staff.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [search, setSearch] = useState("");
  const [queueTab, setQueueTab] = useState<QueueTab>("pending");
  const [showAdd, setShowAdd] = useState(false);
  const [returnId, setReturnId] = useState<number | null>(null);
  const [returnCondition, setReturnCondition] = useState("GOOD");
  const [returnNotes, setReturnNotes] = useState("");
  const [approveId, setApproveId] = useState<number | null>(null);
  const [approveDueDate, setApproveDueDate] = useState(format(addDays(new Date(), 7), "yyyy-MM-dd"));
  const [rejectId, setRejectId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [form, setForm] = useState<{
    memberId: string;
    bookId: string;
    quantity: string;
    borrowingType: "PERSONAL" | "CLASS_REPRESENTATIVE";
    dueDate: string;
    notes: string;
  }>({
    memberId: "",
    bookId: "",
    quantity: "1",
    borrowingType: "PERSONAL",
    dueDate: format(addDays(new Date(), 7), "yyyy-MM-dd"),
    notes: "",
  });

  const pendingCount = borrowings.filter((borrowing) => borrowing.status === "pending").length;
  const approvedTodayCount = borrowings.filter((borrowing) =>
    borrowing.status === "approved" && borrowing.approvedAt?.slice(0, 10) === format(new Date(), "yyyy-MM-dd")
  ).length;
  const overdueCount = borrowings.filter((borrowing) => borrowing.status === "overdue").length;
  const attentionCount = borrowings.filter((borrowing) => {
    if (borrowing.status !== "pending") return false;
    const book = books.find((item) => item.id === borrowing.bookId);
    return book ? book.availableStock < borrowing.quantity : false;
  }).length;

  const filtered = borrowings.filter((borrowing) => {
    const q = search.toLowerCase();
    const searchable = [
      borrowing.memberName,
      borrowing.memberNumber,
      borrowing.requesterClass ?? "",
      borrowing.requesterStudentId ?? "",
      borrowing.bookTitle,
      borrowing.requestCode ?? "",
    ].join(" ").toLowerCase();
    const matchesTab = queueTab === "all"
      || (queueTab === "pending" && borrowing.status === "pending")
      || (queueTab === "borrowed" && borrowing.status === "borrowed")
      || (queueTab === "overdue" && borrowing.status === "overdue")
      || (queueTab === "returned" && ["returned", "rejected", "cancelled"].includes(borrowing.status));
    return (!q || searchable.includes(q)) && matchesTab;
  }).sort((a, b) => {
    const rank = (status: typeof a.status) => {
      if (status === "pending") return 0;
      if (status === "overdue") return 1;
      if (status === "borrowed") return 2;
      if (status === "approved") return 3;
      return 4;
    };
    if (queueTab === "pending" && a.status === "pending" && b.status === "pending") {
      return new Date(a.createdAt ?? a.borrowDate).getTime() - new Date(b.createdAt ?? b.borrowDate).getTime();
    }
    const rankDifference = rank(a.status) - rank(b.status);
    if (rankDifference !== 0) return rankDifference;
    if (a.status === "overdue" && b.status === "overdue") {
      return new Date(a.dueDate ?? a.borrowDate).getTime() - new Date(b.dueDate ?? b.borrowDate).getTime();
    }
    return new Date(b.createdAt ?? b.borrowDate).getTime() - new Date(a.createdAt ?? a.borrowDate).getTime();
  });

  const availableBooks = books.filter((book) => book.status === "available");

  function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    if (!form.memberId || !form.bookId || !form.dueDate) {
      toast.error("Lengkapi semua field wajib");
      return;
    }
    createBorrowing.mutate({
      memberId: Number(form.memberId),
      bookId: Number(form.bookId),
      quantity: Math.max(1, Number(form.quantity)),
      borrowingType: form.borrowingType,
      dueDate: form.dueDate,
      notes: form.notes || undefined,
    } satisfies BorrowingInput, {
      onSuccess: () => {
        toast.success("Peminjaman admin berhasil dicatat");
        setShowAdd(false);
      },
      onError: (error: any) => toast.error(error?.message ?? "Gagal mencatat peminjaman"),
    });
  }

  function handleReturn() {
    if (!returnId) return;
    returnBook.mutate(
      { borrowingId: returnId, condition: returnCondition, notes: returnNotes || undefined },
      {
        onSuccess: () => {
          toast.success("Buku berhasil dikembalikan");
          setReturnId(null);
          setReturnNotes("");
          setReturnCondition("GOOD");
        },
        onError: (error: any) => toast.error(error?.message ?? "Gagal memproses pengembalian"),
      },
    );
  }

  function handleApprove() {
    if (!approveId) return;
    approveRequest.mutate(
      { borrowingId: approveId, dueDate: approveDueDate },
      {
        onSuccess: () => {
          toast.success("Request disetujui dan stok diperbarui");
          setApproveId(null);
        },
        onError: (error: any) => toast.error(error?.message ?? "Gagal menyetujui request"),
      },
    );
  }

  function handleReject() {
    if (!rejectId || !rejectionReason.trim()) {
      toast.error("Alasan penolakan wajib diisi");
      return;
    }
    rejectRequest.mutate(
      { borrowingId: rejectId, reason: rejectionReason.trim() },
      {
        onSuccess: () => {
          toast.success("Request ditolak");
          setRejectId(null);
          setRejectionReason("");
        },
        onError: (error: any) => toast.error(error?.message ?? "Gagal menolak request"),
      },
    );
  }

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-extrabold gradient-text font-heading">Peminjaman</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">{borrowings.filter((borrowing) => !["returned", "rejected", "cancelled"].includes(borrowing.status)).length} aktif</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-sm shadow-primary/20 transition-all hover:bg-primary/90 btn-primary-glow"
        >
          <Plus size={16} /> Input Peminjaman
        </motion.button>
      </motion.div>

      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <QueueMetric icon={Inbox} label="Perlu ditinjau" value={pendingCount} tone="primary" />
        <QueueMetric icon={CheckCircle2} label="Disetujui hari ini" value={approvedTodayCount} tone="violet" />
        <QueueMetric icon={AlertTriangle} label="Terlambat" value={overdueCount} tone="rose" />
        <QueueMetric icon={ListChecks} label="Perlu perhatian" value={attentionCount} tone="amber" />
      </div>

      <div className="-mx-1 overflow-x-auto px-1 pb-1">
        <div className="flex min-w-max gap-1 rounded-2xl border border-border/70 bg-muted/35 p-1" role="tablist" aria-label="Filter antrean peminjaman">
          {queueTabs.map((tab) => {
            const count = tab.value === "pending"
              ? pendingCount
              : tab.value === "borrowed"
                ? borrowings.filter((borrowing) => borrowing.status === "borrowed").length
                : tab.value === "overdue"
                  ? overdueCount
                  : tab.value === "returned"
                    ? borrowings.filter((borrowing) => ["returned", "rejected", "cancelled"].includes(borrowing.status)).length
                    : borrowings.length;
            const active = queueTab === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => setQueueTab(tab.value)}
                role="tab"
                aria-selected={active}
                className={cn(
                  "inline-flex min-h-9 items-center gap-1.5 rounded-xl px-3 text-xs font-semibold transition-all",
                  active ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:bg-card/70 hover:text-foreground",
                )}
              >
                {tab.label}
                <span className={cn("rounded-full px-1.5 py-0.5 text-[9px] leading-none", active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }} className="flex flex-wrap gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Cari kode request, anggota, kelas, atau buku…"
            className="h-10 w-full rounded-xl border border-border bg-background/60 pl-9 pr-3 text-sm transition-colors focus:border-primary focus:outline-none"
          />
        </div>
      </motion.div>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 6 }).map((_, index) => <SkeletonRow key={index} />)}</div>
      ) : (
        <div className="space-y-2">
          {filtered.map((borrowing, index) => {
            const config = statusConfig[borrowing.status];
            const Icon = config.icon;
            const matchedBook = books.find((book) => book.id === borrowing.bookId);
            const needsAttention = borrowing.status === "pending"
              && matchedBook
              && matchedBook.availableStock < borrowing.quantity;
            return (
              <motion.div
                key={borrowing.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04, type: "spring", stiffness: 280, damping: 26 }}
                className={cn(
                  "glass flex flex-col gap-3 rounded-2xl p-4 shadow-card card-lift sm:flex-row sm:items-center sm:gap-4",
                  borrowing.status === "pending" && "border-primary/20",
                  needsAttention && "border-amber-400/50 bg-amber-500/[0.035]",
                )}
              >
                <div className={cn("flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-2xl", config.className)}><Icon size={15} /></div>
                <div className="min-w-0 flex-1 w-full">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{borrowing.bookTitle}</p>
                      <p className="text-xs text-muted-foreground">
                        {borrowing.memberName}{borrowing.memberNumber !== "-" ? ` · ${borrowing.memberNumber}` : ""}
                        {borrowing.requesterClass ? ` · ${borrowing.requesterClass}` : ""}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-2 text-[10px] text-muted-foreground">
                        {borrowing.requestCode && <span className="font-mono font-semibold text-primary">{borrowing.requestCode}</span>}
                        {borrowing.requesterStudentId && <span>NIS/NISN: {borrowing.requesterStudentId}</span>}
                        <span>{borrowingTypeLabel[borrowing.borrowingType]}</span>
                        <span>{borrowing.quantity} eksemplar</span>
                        <span>{borrowing.borrowingMethod === "SELF_SERVICE" ? "Self-service" : "Admin-assisted"}</span>
                        {needsAttention && <span className="font-semibold text-amber-600">Stok perlu dicek</span>}
                      </div>
                    </div>
                    <span className={cn("flex-shrink-0 rounded-lg px-2 py-1 text-[10px] font-bold", config.className)}>{config.label}</span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-3 text-[10px] text-muted-foreground">
                    <span>{borrowing.status === "pending" ? "Diajukan" : "Pinjam"}: {formatDate(borrowing.borrowDate)}</span>
                    {borrowing.dueDate && <span>Jatuh tempo: {formatDate(borrowing.dueDate)}</span>}
                    {borrowing.returnDate && <span>Kembali: {formatDate(borrowing.returnDate)}</span>}
                    {(borrowing.fine ?? 0) > 0 && <span className="font-semibold text-rose-500">Denda: Rp {borrowing.fine!.toLocaleString("id-ID")}</span>}
                  </div>
                  {borrowing.rejectionReason && <p className="mt-1 text-[11px] text-rose-600">Alasan: {borrowing.rejectionReason}</p>}
                </div>
                {borrowing.status === "pending" ? (
                  <div className="flex w-full flex-shrink-0 gap-1.5 sm:w-auto">
                    <button onClick={() => setApproveId(borrowing.id)} disabled={approveRequest.isPending} className="inline-flex flex-1 items-center justify-center gap-1 rounded-xl bg-primary/10 px-2.5 py-2 text-xs font-bold text-primary transition-all hover:bg-primary hover:text-primary-foreground disabled:opacity-50 sm:flex-none">
                      <ClipboardCheck size={13} /> Setujui
                    </button>
                    <button onClick={() => setRejectId(borrowing.id)} disabled={rejectRequest.isPending} className="inline-flex flex-1 items-center justify-center gap-1 rounded-xl bg-rose-500/10 px-2.5 py-2 text-xs font-bold text-rose-600 transition-all hover:bg-rose-500 hover:text-white disabled:opacity-50 sm:flex-none">
                      <XCircle size={13} /> Tolak
                    </button>
                  </div>
                ) : borrowing.status !== "returned" && borrowing.status !== "rejected" && borrowing.status !== "cancelled" && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setReturnId(borrowing.id)}
                    disabled={returnBook.isPending}
                    className="w-full flex-shrink-0 rounded-xl bg-primary/10 px-3 py-2 text-xs font-bold text-primary transition-all hover:bg-primary hover:text-primary-foreground disabled:opacity-50 sm:w-auto"
                  >
                    Catat Pengembalian
                  </motion.button>
                )}
              </motion.div>
            );
          })}
          {!filtered.length && <EmptyState variant={search || queueTab !== "all" ? "search" : "borrowings"} />}
        </div>
      )}

      <AppModal open={showAdd} onClose={() => setShowAdd(false)} title="Input Peminjaman Admin">
        <form onSubmit={handleCreate} className="space-y-3">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-foreground/70">Anggota *</label>
            <select value={form.memberId} onChange={(event) => setForm((current) => ({ ...current, memberId: event.target.value }))} required className="mt-1 h-10 w-full rounded-xl border border-border bg-background/60 px-3 text-sm transition-colors focus:border-primary focus:outline-none">
              <option value="">Pilih Anggota</option>
              {members.map((member) => <option key={member.id} value={member.id}>{member.name} ({member.memberNumber})</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-foreground/70">Buku *</label>
            <select value={form.bookId} onChange={(event) => setForm((current) => ({ ...current, bookId: event.target.value }))} required className="mt-1 h-10 w-full rounded-xl border border-border bg-background/60 px-3 text-sm transition-colors focus:border-primary focus:outline-none">
              <option value="">Pilih Buku (tersedia)</option>
              {availableBooks.map((book) => <option key={book.id} value={book.id}>{book.title} · {book.availableStock} tersedia</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-foreground/70">Jenis</label>
              <select value={form.borrowingType} onChange={(event) => setForm((current) => ({ ...current, borrowingType: event.target.value as "PERSONAL" | "CLASS_REPRESENTATIVE" }))} className="mt-1 h-10 w-full rounded-xl border border-border bg-background/60 px-3 text-sm transition-colors focus:border-primary focus:outline-none">
                <option value="PERSONAL">Pribadi</option>
                <option value="CLASS_REPRESENTATIVE">Perwakilan Kelas</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-foreground/70">Jumlah *</label>
              <input type="number" min={1} value={form.quantity} onChange={(event) => setForm((current) => ({ ...current, quantity: event.target.value }))} required className="mt-1 h-10 w-full rounded-xl border border-border bg-background/60 px-3 text-sm transition-colors focus:border-primary focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-foreground/70">Tanggal Jatuh Tempo *</label>
            <input type="date" value={form.dueDate} onChange={(event) => setForm((current) => ({ ...current, dueDate: event.target.value }))} required className="mt-1 h-10 w-full rounded-xl border border-border bg-background/60 px-3 text-sm transition-colors focus:border-primary focus:outline-none" />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-foreground/70">Catatan</label>
            <textarea value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} rows={2} className="mt-1 w-full resize-none rounded-xl border border-border bg-background/60 px-3 py-2 text-sm transition-colors focus:border-primary focus:outline-none" />
          </div>
          <button type="submit" disabled={createBorrowing.isPending} className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-60">
            {createBorrowing.isPending ? <><Loader2 size={15} className="animate-spin" /> Memproses…</> : "Simpan Peminjaman"}
          </button>
        </form>
      </AppModal>

      <AppModal open={!!approveId} onClose={() => setApproveId(null)} title="Setujui Request">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Stok akan dikurangi setelah approval berhasil. Ketersediaan akan diperiksa ulang di database.</p>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wider text-foreground/70">Tanggal Jatuh Tempo *</span>
            <input type="date" value={approveDueDate} onChange={(event) => setApproveDueDate(event.target.value)} className="mt-1 h-10 w-full rounded-xl border border-border bg-background/60 px-3 text-sm focus:border-primary focus:outline-none" />
          </label>
          <button type="button" onClick={handleApprove} disabled={approveRequest.isPending} className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-primary-foreground disabled:opacity-60">
            {approveRequest.isPending ? <Loader2 size={15} className="animate-spin" /> : <ClipboardCheck size={15} />} Konfirmasi Approval
          </button>
        </div>
      </AppModal>

      <AppModal open={!!rejectId} onClose={() => setRejectId(null)} title="Tolak Request">
        <div className="space-y-4">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wider text-foreground/70">Alasan Penolakan *</span>
            <textarea value={rejectionReason} onChange={(event) => setRejectionReason(event.target.value)} rows={4} placeholder="Contoh: stok tidak lagi tersedia" className="mt-1 w-full resize-none rounded-xl border border-border bg-background/60 px-3 py-2 text-sm focus:border-primary focus:outline-none" />
          </label>
          <button type="button" onClick={handleReject} disabled={rejectRequest.isPending} className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-rose-600 text-sm font-bold text-white disabled:opacity-60">
            {rejectRequest.isPending ? <Loader2 size={15} className="animate-spin" /> : <XCircle size={15} />} Tolak Request
          </button>
        </div>
      </AppModal>

      <AppModal open={!!returnId} onClose={() => setReturnId(null)} title="Catat Pengembalian">
        <div className="space-y-4">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wider text-foreground/70">Kondisi Buku *</span>
            <select value={returnCondition} onChange={(event) => setReturnCondition(event.target.value)} className="mt-1 h-10 w-full rounded-xl border border-border bg-background/60 px-3 text-sm focus:border-primary focus:outline-none">
              <option value="GOOD">Baik</option>
              <option value="MINOR_DAMAGE">Rusak Ringan</option>
              <option value="MAJOR_DAMAGE">Rusak Berat</option>
              <option value="LOST">Hilang</option>
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wider text-foreground/70">Catatan</span>
            <textarea value={returnNotes} onChange={(event) => setReturnNotes(event.target.value)} rows={3} className="mt-1 w-full resize-none rounded-xl border border-border bg-background/60 px-3 py-2 text-sm focus:border-primary focus:outline-none" />
          </label>
          <button type="button" onClick={handleReturn} disabled={returnBook.isPending} className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-primary-foreground disabled:opacity-60">
            {returnBook.isPending ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />} Konfirmasi Pengembalian
          </button>
        </div>
      </AppModal>
    </div>
  );
}