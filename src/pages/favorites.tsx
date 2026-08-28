import { useState } from "react";
import { motion } from "framer-motion";
import { Heart, BookOpen, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { useGetFavorites, useGetFavoriteIds, useRemoveFavorite, useAddFavorite } from "@/hooks/api";
import type { Book } from "@/types";
import BookDetailSheet from "@/components/book-detail-sheet";
import { cn } from "@/lib/utils";
import { SkeletonBookCard } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";

export default function FavoritesPage() {
  const { data: favorites = [], isLoading } = useGetFavorites();
  const { data: favoriteIds = [] } = useGetFavoriteIds();
  const removeFav = useRemoveFavorite();
  const addFav = useAddFavorite();
  const [search, setSearch] = useState("");
  const [detailBook, setDetailBook] = useState<Book | null>(null);

  const filtered = favorites.filter(b => !search || b.title.toLowerCase().includes(search.toLowerCase()) || b.author.toLowerCase().includes(search.toLowerCase()));

  function handleToggle(book: Book) {
    if (favoriteIds.includes(book.id)) {
      removeFav.mutate(book.id, { onSuccess: () => toast.success("Dihapus dari favorit") });
    } else {
      addFav.mutate(book.id, { onSuccess: () => toast.success("Ditambah ke favorit") });
    }
  }

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-extrabold gradient-text font-heading">Favorit</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{favorites.length} buku favorit</p>
      </motion.div>

      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari buku favorit…"
          className="w-full h-10 pl-9 pr-3 rounded-xl border border-border bg-background/60 text-sm focus:outline-none focus:border-primary transition-colors" />
      </div>

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
              className="glass rounded-2xl overflow-hidden shadow-card hover:shadow-md transition-all duration-300 group cursor-pointer"
              onClick={() => setDetailBook(book)}>
              <div className="aspect-[3/4] overflow-hidden bg-muted relative">
                {book.coverUrl
                  ? <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  : <div className="w-full h-full bg-gradient-to-br from-rose-500/20 to-rose-500/5 flex items-center justify-center">
                      <BookOpen size={24} className="text-rose-500/30" />
                    </div>
                }
                <button
                  onClick={e => { e.stopPropagation(); handleToggle(book); }}
                  className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-card/90 backdrop-blur-sm flex items-center justify-center shadow-sm hover:bg-rose-500 hover:text-white transition-all opacity-0 group-hover:opacity-100 text-rose-500">
                  <Heart size={12} fill="currentColor" />
                </button>
              </div>
              <div className="p-2.5">
                <p className="text-xs font-semibold text-foreground line-clamp-2 leading-tight">{book.title}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{book.author}</p>
              </div>
            </motion.div>
          ))}
          {!filtered.length && (
            <div className="col-span-full">
              <EmptyState
                variant={search ? "search" : "favorites"}
                description={!search ? "Buka Koleksi Buku dan klik ikon hati untuk menandai favorit." : undefined}
              />
            </div>
          )}
        </motion.div>
      )}

      <BookDetailSheet book={detailBook} open={!!detailBook} onClose={() => setDetailBook(null)}
        isFavorite={detailBook ? favoriteIds.includes(detailBook.id) : false}
        onToggleFavorite={handleToggle} />
    </div>
  );
}
