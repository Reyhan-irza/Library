import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Archive, Loader2, Edit, Trash2, MapPin } from "lucide-react";
import { toast } from "sonner";
import { useListRacks, useCreateRack, useUpdateRack, useDeleteRack } from "@/hooks/api";
import type { Rack, RackInput } from "@/types";
import AppModal from "@/components/ui/app-modal";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import { SkeletonCard } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";

function RackForm({ initial, onSubmit, loading }: { initial?: Partial<RackInput>; onSubmit: (d: RackInput) => void; loading: boolean }) {
  const [form, setForm] = useState<RackInput>({ name: initial?.name ?? "", location: initial?.location ?? "", description: initial?.description ?? "" });
  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit({ ...form, location: form.location || undefined, description: form.description || undefined }); }} className="space-y-3">
      {(["name", "location", "description"] as const).map(k => (
        <div key={k}>
          <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider">
            {k === "name" ? "Nama Rak *" : k === "location" ? "Lokasi" : "Deskripsi"}
          </label>
          <input value={(form as any)[k] ?? ""} required={k === "name"} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}
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

export default function RacksPage() {
  const { data: racks = [], isLoading } = useListRacks();
  const createRack = useCreateRack();
  const updateRack = useUpdateRack();
  const deleteRack = useDeleteRack();
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editRack, setEditRack] = useState<Rack | null>(null);
  const [deleteRackId, setDeleteRackId] = useState<number | null>(null);

  const filtered = racks.filter(r => !search || r.name.toLowerCase().includes(search.toLowerCase()) || (r.location ?? "").toLowerCase().includes(search.toLowerCase()));

  function handleDelete() {
    if (!deleteRackId) return;
    deleteRack.mutate(deleteRackId, {
      onSuccess: () => { toast.success("Rak dihapus"); setDeleteRackId(null); },
      onError: (e: any) => { toast.error(e?.message ?? "Gagal menghapus rak"); setDeleteRackId(null); },
    });
  }

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold gradient-text font-heading">Rak Buku</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{racks.length} rak terdaftar</p>
        </div>
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-primary text-primary-foreground text-sm font-bold shadow-sm shadow-primary/20 hover:bg-primary/90 transition-all">
          <Plus size={16} /> Tambah Rak
        </motion.button>
      </motion.div>

      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari rak atau lokasi…"
          className="w-full h-10 pl-9 pr-3 rounded-xl border border-border bg-background/60 text-sm focus:outline-none focus:border-primary transition-colors" />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((r, i) => (
            <motion.div key={r.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, type: "spring", stiffness: 280, damping: 26 }}
              className="glass rounded-2xl p-4 shadow-card group">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                  <Archive size={18} className="text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => setEditRack(r)}
                    className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all">
                    <Edit size={12} />
                  </button>
                  <button onClick={() => setDeleteRackId(r.id)}
                    className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
              <div className="mt-3">
                <p className="text-sm font-bold text-foreground">{r.name}</p>
                {r.location && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <MapPin size={11} className="text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">{r.location}</p>
                  </div>
                )}
                {r.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{r.description}</p>}
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-2">{r.bookCount} buku</p>
              </div>
            </motion.div>
          ))}
          {!filtered.length && (
            <div className="col-span-full">
              <EmptyState variant={search ? "search" : "racks"} />
            </div>
          )}
        </div>
      )}

      <AppModal open={showAdd} onClose={() => setShowAdd(false)} title="Tambah Rak">
        <RackForm
          onSubmit={d => createRack.mutate(d, {
            onSuccess: () => { toast.success("Rak ditambahkan"); setShowAdd(false); },
            onError: (e: any) => toast.error(e?.message),
          })}
          loading={createRack.isPending}
        />
      </AppModal>

      <AppModal open={!!editRack} onClose={() => setEditRack(null)} title="Edit Rak">
        {editRack && (
          <RackForm
            initial={{ name: editRack.name, location: editRack.location ?? "", description: editRack.description ?? "" }}
            onSubmit={d => updateRack.mutate({ id: editRack.id, data: d }, {
              onSuccess: () => { toast.success("Rak diperbarui"); setEditRack(null); },
              onError: (e: any) => toast.error(e?.message),
            })}
            loading={updateRack.isPending}
          />
        )}
      </AppModal>

      <ConfirmDialog
        open={!!deleteRackId}
        onClose={() => setDeleteRackId(null)}
        onConfirm={handleDelete}
        title="Hapus Rak"
        message="Rak ini akan dihapus permanen. Buku yang terhubung ke rak ini tidak akan ikut terhapus."
        confirmLabel="Hapus Rak"
        loading={deleteRack.isPending}
      />
    </div>
  );
}
