import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, FolderOpen, X, Loader2, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useListCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from "@/hooks/api";
import type { Category, CategoryInput } from "@/types";

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

function CategoryForm({ initial, onSubmit, loading }: { initial?: Partial<CategoryInput>; onSubmit: (d: CategoryInput) => void; loading: boolean }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit({ name, description: description || undefined }); }} className="space-y-3">
      <div>
        <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider">Nama Kategori *</label>
        <input value={name} onChange={e => setName(e.target.value)} required
          className="mt-1 w-full h-10 px-3 rounded-xl border border-border bg-background/60 text-sm focus:outline-none focus:border-primary transition-colors" />
      </div>
      <div>
        <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider">Deskripsi</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
          className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-background/60 text-sm focus:outline-none focus:border-primary transition-colors resize-none" />
      </div>
      <button type="submit" disabled={loading}
        className="w-full h-11 rounded-xl bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-all">
        {loading ? <><Loader2 size={15} className="animate-spin" /> Menyimpan…</> : "Simpan"}
      </button>
    </form>
  );
}

export default function CategoriesPage() {
  const { data: categories = [], isLoading } = useListCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editCat, setEditCat] = useState<Category | null>(null);

  const filtered = categories.filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold gradient-text" style={{ fontFamily: "'Sora', sans-serif" }}>Kategori</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{categories.length} kategori</p>
        </div>
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-primary text-primary-foreground text-sm font-bold shadow-sm shadow-primary/20 hover:bg-primary/90 transition-all">
          <Plus size={16} /> Tambah Kategori
        </motion.button>
      </motion.div>

      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari kategori…"
          className="w-full h-10 pl-9 pr-3 rounded-xl border border-border bg-background/60 text-sm focus:outline-none focus:border-primary transition-colors" />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-primary" /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((c, i) => (
            <motion.div key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, type: "spring", stiffness: 280, damping: 26 }}
              className="glass rounded-2xl p-4 shadow-card card-glow-green group">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <FolderOpen size={18} className="text-primary" />
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => setEditCat(c)}
                    className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all">
                    <Edit size={12} />
                  </button>
                  <button onClick={() => { if (confirm("Hapus kategori ini?")) deleteCategory.mutate(c.id, { onSuccess: () => toast.success("Kategori dihapus"), onError: (e: any) => toast.error(e?.message) }); }}
                    className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
              <div className="mt-3">
                <p className="text-sm font-bold text-foreground">{c.name}</p>
                {c.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{c.description}</p>}
                <p className="text-xs text-primary font-medium mt-2">{c.bookCount} buku</p>
              </div>
            </motion.div>
          ))}
          {!filtered.length && (
            <div className="col-span-full text-center py-16 text-muted-foreground">
              <FolderOpen size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Belum ada kategori</p>
            </div>
          )}
        </div>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Tambah Kategori">
        <CategoryForm onSubmit={d => createCategory.mutate(d, { onSuccess: () => { toast.success("Kategori ditambahkan"); setShowAdd(false); }, onError: (e: any) => toast.error(e?.message) })} loading={createCategory.isPending} />
      </Modal>
      <Modal open={!!editCat} onClose={() => setEditCat(null)} title="Edit Kategori">
        {editCat && (
          <CategoryForm initial={{ name: editCat.name, description: editCat.description ?? "" }}
            onSubmit={d => updateCategory.mutate({ id: editCat.id, data: d }, { onSuccess: () => { toast.success("Kategori diperbarui"); setEditCat(null); }, onError: (e: any) => toast.error(e?.message) })}
            loading={updateCategory.isPending} />
        )}
      </Modal>
    </div>
  );
}
