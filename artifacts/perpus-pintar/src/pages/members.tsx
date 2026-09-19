import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Users, Loader2, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useListMembers, useCreateMember, useUpdateMember, useDeleteMember } from "@/hooks/api";
import type { Member, MemberInput } from "@/types";
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

export default function MembersPage() {
  const { data: members = [], isLoading } = useListMembers();
  const createMember = useCreateMember();
  const updateMember = useUpdateMember();
  const deleteMember = useDeleteMember();

  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editMember, setEditMember] = useState<Member | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const filtered = members.filter(m => {
    const q = search.toLowerCase();
    return !q || m.name.toLowerCase().includes(q) || m.memberNumber.toLowerCase().includes(q) || (m.email ?? "").toLowerCase().includes(q);
  });

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

      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari nama, nomor, atau email…"
          className="w-full h-10 pl-9 pr-3 rounded-xl border border-border bg-background/60 text-sm focus:outline-none focus:border-primary transition-colors" />
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
                <button onClick={() => setEditMember(m)}
                  className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all">
                  <Edit size={13} />
                </button>
                <button onClick={() => setDeleteId(m.id)}
                  className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all">
                  <Trash2 size={13} />
                </button>
              </div>
            </motion.div>
          ))}
          {!filtered.length && (
            <EmptyState variant={search ? "search" : "members"} />
          )}
        </div>
      )}

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
