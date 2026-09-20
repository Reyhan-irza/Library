import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Search, FolderOpen, Loader2, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useListCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from "@/hooks/api";
import type { Category, CategoryInput } from "@/types";
import AppModal from "@/components/ui/app-modal";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import { SkeletonCard } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";

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
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const filtered = categories.filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()));

  function handleDelete() {
    if (!deleteId) return;
    deleteCategory.mutate(deleteId, {
      onSuccess: () => { toast.success("Kategori dihapus"); setDeleteId(null); },
      onError: (e: any) => { toast.error(e?.message ?? "Gagal menghapus kategori"); setDeleteId(null); },
    });
  }

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold gradient-text font-heading">Kategori</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{categories.length} kategori terdaftar</p>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
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
                  <button onClick={() => setDeleteId(c.id)}
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
            <div className="col-span-full">
              <EmptyState variant={search ? "search" : "categories"} />
            </div>
          )}
        </div>
      )}

      <AppModal open={showAdd} onClose={() => setShowAdd(false)} title="Tambah Kategori">
        <CategoryForm
          onSubmit={d => createCategory.mutate(d, {
            onSuccess: () => { toast.success("Kategori ditambahkan"); setShowAdd(false); },
            onError: (e: any) => toast.error(e?.message),
          })}
          loading={createCategory.isPending}
        />
      </AppModal>

      <AppModal open={!!editCat} onClose={() => setEditCat(null)} title="Edit Kategori">
        {editCat && (
          <CategoryForm
            initial={{ name: editCat.name, description: editCat.description ?? "" }}
            onSubmit={d => updateCategory.mutate({ id: editCat.id, data: d }, {
              onSuccess: () => { toast.success("Kategori diperbarui"); setEditCat(null); },
              onError: (e: any) => toast.error(e?.message),
            })}
            loading={updateCategory.isPending}
          />
        )}
      </AppModal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Hapus Kategori"
        message="Kategori ini akan dihapus permanen. Buku yang terhubung tidak akan ikut terhapus."
        confirmLabel="Hapus Kategori"
        loading={deleteCategory.isPending}
      />
    </div>
  );
}
