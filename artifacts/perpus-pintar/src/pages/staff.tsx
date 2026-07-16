import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, UserCog, X, Loader2, Edit, Trash2, Shield } from "lucide-react";
import { toast } from "sonner";
import { useListStaff, useCreateStaff, useUpdateStaff, useDeleteStaff } from "@/hooks/api";
import type { StaffMember, StaffInput, StaffUpdate } from "@/types";
import { cn } from "@/lib/utils";

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

export default function StaffPage() {
  const { data: staff = [], isLoading } = useListStaff();
  const createStaff = useCreateStaff();
  const updateStaff = useUpdateStaff();
  const deleteStaff = useDeleteStaff();
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editStaff, setEditStaff] = useState<StaffMember | null>(null);

  // Add form state
  const [addForm, setAddForm] = useState<StaffInput>({ email: "", password: "", name: "", role: "librarian" });
  const [editForm, setEditForm] = useState<StaffUpdate>({});

  const filtered = staff.filter(s => !search || s.name.toLowerCase().includes(search.toLowerCase()) || (s.email ?? "").toLowerCase().includes(search.toLowerCase()));

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    createStaff.mutate(addForm, {
      onSuccess: () => { toast.success("Staff berhasil ditambahkan"); setShowAdd(false); setAddForm({ email: "", password: "", name: "", role: "librarian" }); },
      onError: (e: any) => toast.error(e?.message ?? "Gagal menambahkan staff"),
    });
  }

  function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editStaff) return;
    updateStaff.mutate({ id: editStaff.id, data: editForm }, {
      onSuccess: () => { toast.success("Staff diperbarui"); setEditStaff(null); },
      onError: (e: any) => toast.error(e?.message ?? "Gagal memperbarui staff"),
    });
  }

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold gradient-text" style={{ fontFamily: "'Sora', sans-serif" }}>Staff</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{staff.length} staff terdaftar</p>
        </div>
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-primary text-primary-foreground text-sm font-bold shadow-sm shadow-primary/20 hover:bg-primary/90 transition-all">
          <Plus size={16} /> Tambah Staff
        </motion.button>
      </motion.div>

      <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-400">
        <strong>Catatan:</strong> Pembuatan staff baru menggunakan email. Pastikan konfirmasi email dinonaktifkan di Supabase Dashboard → Authentication → Email → "Confirm email".
      </div>

      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari nama atau email…"
          className="w-full h-10 pl-9 pr-3 rounded-xl border border-border bg-background/60 text-sm focus:outline-none focus:border-primary transition-colors" />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-primary" /></div>
      ) : (
        <div className="space-y-2">
          {filtered.map((s, i) => (
            <motion.div key={s.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, type: "spring", stiffness: 280, damping: 26 }}
              className="glass rounded-2xl p-4 shadow-card flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-primary">{s.name.charAt(0).toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{s.name}</p>
                <p className="text-xs text-muted-foreground">{s.username}</p>
                <span className={cn("inline-flex items-center gap-1 mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full",
                  s.role === "admin" ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground")}>
                  <Shield size={9} />{s.role === "admin" ? "Admin" : "Pustakawan"}
                </span>
              </div>
              <div className="flex gap-1">
                <button onClick={() => { setEditStaff(s); setEditForm({ name: s.name, role: s.role }); }}
                  className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all">
                  <Edit size={13} />
                </button>
                <button onClick={() => { if (confirm("Hapus staff ini?")) deleteStaff.mutate(s.id, { onSuccess: () => toast.success("Staff dihapus"), onError: (e: any) => toast.error(e?.message) }); }}
                  className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all">
                  <Trash2 size={13} />
                </button>
              </div>
            </motion.div>
          ))}
          {!filtered.length && (
            <div className="text-center py-16 text-muted-foreground">
              <UserCog size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Tidak ada staff ditemukan</p>
            </div>
          )}
        </div>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Tambah Staff">
        <form onSubmit={handleCreate} className="space-y-3">
          {[
            { key: "name" as const, label: "Nama Lengkap *", type: "text", required: true },
            { key: "email" as const, label: "Email *", type: "email", required: true },
            { key: "password" as const, label: "Password *", type: "password", required: true },
          ].map(f => (
            <div key={f.key}>
              <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider">{f.label}</label>
              <input type={f.type} value={(addForm as any)[f.key]} required={f.required}
                onChange={e => setAddForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                className="mt-1 w-full h-10 px-3 rounded-xl border border-border bg-background/60 text-sm focus:outline-none focus:border-primary transition-colors" />
            </div>
          ))}
          <div>
            <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider">Role</label>
            <select value={addForm.role} onChange={e => setAddForm(f => ({ ...f, role: e.target.value as any }))}
              className="mt-1 w-full h-10 px-3 rounded-xl border border-border bg-background/60 text-sm focus:outline-none focus:border-primary transition-colors">
              <option value="librarian">Pustakawan</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button type="submit" disabled={createStaff.isPending}
            className="w-full h-11 rounded-xl bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-all">
            {createStaff.isPending ? <><Loader2 size={15} className="animate-spin" /> Menyimpan…</> : "Tambah Staff"}
          </button>
        </form>
      </Modal>

      <Modal open={!!editStaff} onClose={() => setEditStaff(null)} title="Edit Staff">
        {editStaff && (
          <form onSubmit={handleUpdate} className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider">Nama Lengkap</label>
              <input value={editForm.name ?? ""} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                className="mt-1 w-full h-10 px-3 rounded-xl border border-border bg-background/60 text-sm focus:outline-none focus:border-primary transition-colors" />
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider">Role</label>
              <select value={editForm.role ?? editStaff.role} onChange={e => setEditForm(f => ({ ...f, role: e.target.value as any }))}
                className="mt-1 w-full h-10 px-3 rounded-xl border border-border bg-background/60 text-sm focus:outline-none focus:border-primary transition-colors">
                <option value="librarian">Pustakawan</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <button type="submit" disabled={updateStaff.isPending}
              className="w-full h-11 rounded-xl bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-all">
              {updateStaff.isPending ? <><Loader2 size={15} className="animate-spin" /> Menyimpan…</> : "Simpan"}
            </button>
          </form>
        )}
      </Modal>
    </div>
  );
}
