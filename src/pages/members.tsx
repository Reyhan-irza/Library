import { useState } from "react";
import { motion } from "framer-motion";
import {
  Plus, Search, Users, Loader2, Edit, Trash2, BookOpen, CircleDollarSign,
  AlertTriangle, Eye, History, CalendarDays, CheckCircle2, Clock3, XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useListMembers, useListBorrowings, useCreateMember, useUpdateMember, useDeleteMember } from "@/hooks/api";
import type { Borrowing, Member, MemberInput } from "@/types";
import { formatDate, formatCurrency } from "@/lib/format";
import AppModal from "@/components/ui/app-modal";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import { SkeletonRow } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";

function MemberForm({ initial, onSubmit, loading }: { initial?: Partial<MemberInput>; onSubmit: (d: MemberInput) => void; loading: boolean }) {
  const [form, setForm] = useState<MemberInput>({
    name: initial?.name ?? "", email: initial?.email ?? "",
    phone: initial?.phone ?? "", address: initial?.address ?? "",
  });
  const fields: { key: keyof MemberInput; label: string; required?: boolean; type?: string }[] = [
    { key: "name", label: "Nama Lengkap", required: true },
    { key: "email", label: "Email", type: "email" },
    { key: "phone", label: "Nomor HP" },
    { key: "address", label: "Alamat" },
  ];
  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(form); }} className="space-y-3">
      {fields.map(f => (
        <div key={f.key}>
          <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider">{f.label}{f.required ? " *" : ""}</label>
          <input type={f.type ?? "text"} value={(form as any)[f.key] ?? ""} required={f.required}
            onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
            className="mt-1 w-full h-10 px-3 rounded-xl border border-border bg-background/60 text-sm focus:outline-none focus:border-primary transition-colors" />
        </div>
      ))}
      <button type="submit" disabled={loading}
        className="w-full h-11 rounded-xl bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-all">
        {loading ? <><Loader2 size={15} className="animate-spin" /> Menyimpan…</> : "Simpan"}
      </button>
    </form>
  );
}

function MemberMetric({ icon: Icon, label, value, tone }: {
  icon: React.ElementType;
  label: string;
  value: number;
  tone: "primary" | "amber" | "rose";
}) {
  const tones = {
    primary: "bg-primary/10 text-primary",
    amber: "bg-amber-500/10 text-amber-600",
    rose: "bg-rose-500/10 text-rose-600",
  };
  return (
    <div className="glass flex items-center gap-2.5 rounded-2xl p-3 shadow-card">
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${tones[tone]}`}>
        <Icon size={15} />
      </div>
      <div className="min-w-0">
        <p className="text-base font-extrabold leading-none text-foreground font-heading">{value}</p>
        <p className="mt-1 truncate text-[10px] text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

const borrowingStatusLabels: Record<Borrowing["status"], string> = {
  pending: "Menunggu",
  approved: "Disetujui",
  rejected: "Ditolak",
  borrowed: "Dipinjam",
  returned: "Dikembalikan",
  overdue: "Terlambat",
  cancelled: "Dibatalkan",
};

function MemberDetail({ member, borrowings, loading }: { member: Member; borrowings: Borrowing[]; loading: boolean }) {
  const history = borrowings.filter(borrowing => borrowing.memberId === member.id);
  const activeBorrowings = history.filter(borrowing => ["pending", "approved", "borrowed", "overdue"].includes(borrowing.status));

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3 rounded-2xl border border-primary/15 bg-primary/5 p-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/15">
          <span className="text-lg font-extrabold text-primary">{member.name.charAt(0).toUpperCase()}</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-base font-bold text-foreground">{member.name}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{member.memberNumber}</p>
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
            {member.email && <span>{member.email}</span>}
            {member.phone && <span>{member.phone}</span>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-2xl bg-muted/60 p-3">
          <p className="text-lg font-extrabold text-foreground font-heading">{history.length}</p>
          <p className="mt-1 text-[10px] text-muted-foreground">Total riwayat</p>
        </div>
        <div className="rounded-2xl bg-amber-500/10 p-3">
          <p className="text-lg font-extrabold text-amber-700 font-heading">{activeBorrowings.length}</p>
          <p className="mt-1 text-[10px] text-amber-700/75">Masih berjalan</p>
        </div>
        <div className="rounded-2xl bg-rose-500/10 p-3">
          <p className="text-lg font-extrabold text-rose-700 font-heading">{formatCurrency(member.fine ?? 0)}</p>
          <p className="mt-1 text-[10px] text-rose-700/75">Denda aktif</p>
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center gap-2">
          <History size={15} className="text-primary" />
          <h3 className="text-sm font-bold text-foreground">Riwayat peminjaman</h3>
        </div>
        {loading ? (
          <div className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-border p-8 text-xs text-muted-foreground">
            <Loader2 size={15} className="animate-spin" /> Memuat riwayat…
          </div>
        ) : history.length ? (
          <div className="space-y-2">
            {history.map(borrowing => {
              const isOverdue = borrowing.status === "overdue";
              const isRejected = borrowing.status === "rejected" || borrowing.status === "cancelled";
              const StatusIcon = isRejected ? XCircle : isOverdue ? AlertTriangle : borrowing.status === "returned" ? CheckCircle2 : Clock3;
              return (
                <div
                  key={borrowing.id}
                  className="rounded-2xl border border-border/70 bg-background/50 p-3"
                  data-testid={`row-member-borrowing-${borrowing.id}`}
                >
                  <div className="flex items-start gap-3">
                    <StatusIcon size={15} className={`mt-0.5 shrink-0 ${
                      isRejected ? "text-rose-500" : isOverdue ? "text-amber-500" : borrowing.status === "returned" ? "text-emerald-600" : "text-primary"
                    }`} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold text-foreground">{borrowing.bookTitle}</p>
                      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
                        <span className="inline-flex items-center gap-1"><CalendarDays size={11} /> {formatDate(borrowing.borrowDate)}</span>
                        {borrowing.dueDate && <span>Jatuh tempo {formatDate(borrowing.dueDate)}</span>}
                      </div>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-1 text-[9px] font-bold ${
                      isRejected ? "bg-rose-500/10 text-rose-600" : isOverdue ? "bg-amber-500/10 text-amber-700" : borrowing.status === "returned" ? "bg-emerald-500/10 text-emerald-700" : "bg-primary/10 text-primary"
                    }`}>
                      {borrowingStatusLabels[borrowing.status]}
                    </span>
                  </div>
                  {borrowing.fine && borrowing.fine > 0 ? (
                    <p className="mt-2 pl-6 text-[10px] font-semibold text-rose-600">Denda: {formatCurrency(borrowing.fine)}</p>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center">
            <BookOpen size={20} className="mx-auto text-muted-foreground/50" />
            <p className="mt-2 text-xs font-semibold text-foreground">Belum ada riwayat peminjaman</p>
            <p className="mt-1 text-[10px] text-muted-foreground">Aktivitas peminjaman anggota ini akan muncul di sini.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MembersPage() {
  const { data: members = [], isLoading } = useListMembers();
  const { data: borrowings = [], isLoading: borrowingsLoading } = useListBorrowings();
  const createMember = useCreateMember();
  const updateMember = useUpdateMember();
  const deleteMember = useDeleteMember();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"" | "loans" | "fines">("");
  const [showAdd, setShowAdd] = useState(false);
  const [detailMember, setDetailMember] = useState<Member | null>(null);
  const [editMember, setEditMember] = useState<Member | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const filtered = members.filter(m => {
    const q = search.toLowerCase();
    const matchSearch = !q || m.name.toLowerCase().includes(q) || m.memberNumber.toLowerCase().includes(q) || (m.email ?? "").toLowerCase().includes(q);
    const matchFilter = filter === "loans"
      ? (m.borrowCount ?? 0) > 0
      : filter === "fines"
        ? (m.fine ?? 0) > 0
        : true;
    return matchSearch && matchFilter;
  });
  const activeLoanMembers = members.filter(member => (member.borrowCount ?? 0) > 0).length;
  const membersWithFines = members.filter(member => (member.fine ?? 0) > 0).length;

  function handleCreate(data: MemberInput) {
    createMember.mutate(data, {
      onSuccess: () => { toast.success("Anggota berhasil ditambahkan"); setShowAdd(false); },
      onError: (e: any) => toast.error(e?.message ?? "Gagal menambahkan anggota"),
    });
  }

  function handleUpdate(data: MemberInput) {
    if (!editMember) return;
    updateMember.mutate({ id: editMember.id, data }, {
      onSuccess: () => { toast.success("Anggota diperbarui"); setEditMember(null); },
      onError: (e: any) => toast.error(e?.message ?? "Gagal memperbarui anggota"),
    });
  }

  function handleDelete() {
    if (!deleteId) return;
    deleteMember.mutate(deleteId, {
      onSuccess: () => { toast.success("Anggota dihapus"); setDeleteId(null); },
      onError: (e: any) => { toast.error(e?.message ?? "Gagal menghapus anggota"); setDeleteId(null); },
    });
  }

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold gradient-text font-heading">Anggota</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{members.length} anggota terdaftar</p>
        </div>
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-primary text-primary-foreground text-sm font-bold shadow-sm shadow-primary/20 hover:bg-primary/90 transition-all btn-primary-glow">
          <Plus size={16} /> Tambah Anggota
        </motion.button>
      </motion.div>

      <div className="grid grid-cols-3 gap-2">
        <MemberMetric icon={Users} label="Total anggota" value={members.length} tone="primary" />
        <MemberMetric icon={BookOpen} label="Pinjaman aktif" value={activeLoanMembers} tone="amber" />
        <MemberMetric icon={CircleDollarSign} label="Ada denda" value={membersWithFines} tone="rose" />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari nama, nomor, atau email…"
            className="w-full h-10 pl-9 pr-3 rounded-xl border border-border bg-background/60 text-sm focus:outline-none focus:border-primary transition-colors"
            data-testid="input-search-members"
          />
        </div>
        <select
          value={filter}
          onChange={e => setFilter(e.target.value as typeof filter)}
          className="h-10 rounded-xl border border-border bg-background/60 px-3 text-sm focus:outline-none focus:border-primary transition-colors"
          aria-label="Filter anggota"
          data-testid="select-filter-members"
        >
          <option value="">Semua anggota</option>
          <option value="loans">Pinjaman aktif</option>
          <option value="fines">Ada denda</option>
        </select>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((m, i) => (
            <motion.div key={m.id}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, type: "spring", stiffness: 280, damping: 26 }}
              className="glass rounded-2xl p-4 shadow-card card-lift flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-primary">{m.name.charAt(0).toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{m.name}</p>
                <p className="text-xs text-muted-foreground">{m.memberNumber}{m.email ? ` · ${m.email}` : ""}</p>
                <div className="flex flex-wrap gap-3 mt-1 text-[10px] text-muted-foreground">
                  {m.phone && <span>{m.phone}</span>}
                  {(m.borrowCount ?? 0) > 0 && <span className="text-amber-500 font-medium">{m.borrowCount} pinjaman aktif</span>}
                  {(m.fine ?? 0) > 0 && <span className="text-rose-500 font-medium">Denda: {formatCurrency(m.fine!)}</span>}
                  <span>Bergabung: {formatDate(m.createdAt)}</span>
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => setDetailMember(m)}
                  className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary transition-all hover:bg-primary hover:text-primary-foreground"
                  title="Lihat detail anggota"
                  aria-label={`Lihat detail ${m.name}`}
                  data-testid={`button-detail-member-${m.id}`}
                >
                  <Eye size={13} />
                </button>
                <button onClick={() => setEditMember(m)}
                  className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all"
                  title="Edit anggota"
                  aria-label={`Edit ${m.name}`}
                  data-testid={`button-edit-member-${m.id}`}>
                  <Edit size={13} />
                </button>
                <button onClick={() => setDeleteId(m.id)}
                  className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all"
                  title="Hapus anggota"
                  aria-label={`Hapus ${m.name}`}
                  data-testid={`button-delete-member-${m.id}`}>
                  <Trash2 size={13} />
                </button>
              </div>
            </motion.div>
          ))}
          {!filtered.length && (
            <EmptyState variant={search || filter ? "search" : "members"} />
          )}
        </div>
      )}

      <AppModal open={!!detailMember} onClose={() => setDetailMember(null)} title="Detail Anggota" scrollable>
        {detailMember && (
          <MemberDetail member={detailMember} borrowings={borrowings} loading={borrowingsLoading} />
        )}
      </AppModal>

      <AppModal open={showAdd} onClose={() => setShowAdd(false)} title="Tambah Anggota">
        <MemberForm onSubmit={handleCreate} loading={createMember.isPending} />
      </AppModal>

      <AppModal open={!!editMember} onClose={() => setEditMember(null)} title="Edit Anggota">
        {editMember && (
          <MemberForm
            initial={{ name: editMember.name, email: editMember.email ?? "", phone: editMember.phone ?? "", address: editMember.address ?? "" }}
            onSubmit={handleUpdate}
            loading={updateMember.isPending}
          />
        )}
      </AppModal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Hapus Anggota"
        message="Anggota ini akan dihapus. Riwayat peminjaman tetap tersimpan di sistem."
        confirmLabel="Hapus Anggota"
        loading={deleteMember.isPending}
      />
    </div>
  );
}
