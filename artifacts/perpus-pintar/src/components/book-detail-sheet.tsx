import { motion, AnimatePresence } from "framer-motion";
import {
  X, BookOpen, Building2, Calendar, Hash, FileText,
  BookCopy, Heart, ArrowLeftRight, Star,
  CheckCircle2, Clock, Layers,
} from "lucide-react";
import type { Book } from "@/types";
import { cn } from "@/lib/utils";

interface BookDetailSheetProps {
  book: Book | null;
  open: boolean;
  onClose: () => void;
  isFavorite: boolean;
  onToggleFavorite: (book: Book) => void;
  onBorrow?: (book: Book) => void;
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | number | null | undefined }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-border/50 last:border-0">
      <div className="w-7 h-7 rounded-lg bg-primary/8 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon size={13} className="text-primary/70" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{label}</p>
        <p className="text-sm text-foreground font-medium mt-0.5">{value}</p>
      </div>
    </div>
  );
}

export default function BookDetailSheet({ book, open, onClose, isFavorite, onToggleFavorite, onBorrow }: BookDetailSheetProps) {
  if (!book) return null;

  const isAvailable = book.status === "available";

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 340, damping: 34 }}
            className="relative bg-card border border-border/50 rounded-t-[28px] md:rounded-[28px] shadow-2xl w-full md:max-w-lg max-h-[92vh] overflow-hidden flex flex-col"
          >
            <div className="flex justify-center pt-3 pb-1 md:hidden">
              <div className="w-10 h-1 rounded-full bg-border" />
            </div>

            <div className="flex items-center justify-between px-5 py-3 border-b border-border/50">
              <h2 className="text-sm font-semibold text-foreground" style={{ fontFamily: "'Outfit', sans-serif" }}>
                Detail Buku
              </h2>
              <div className="flex items-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => onToggleFavorite(book)}
                  className={cn(
                    "w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200",
                    isFavorite ? "bg-rose-500/15 text-rose-500" : "bg-muted text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500",
                  )}
                  aria-label={isFavorite ? "Hapus dari favorit" : "Tambah ke favorit"}
                >
                  <Heart size={14} fill={isFavorite ? "currentColor" : "none"} />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center hover:bg-accent transition-colors"
                >
                  <X size={14} className="text-muted-foreground" />
                </motion.button>
              </div>
            </div>

            <div className="overflow-y-auto flex-1">
              <div className="p-5">
                <div className="flex gap-4">
                  <div className="w-24 h-36 rounded-2xl overflow-hidden flex-shrink-0 shadow-md">
                    {book.coverUrl ? (
                      <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                        <BookOpen size={28} className="text-primary/40" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 pt-1">
                    <h3 className="text-base font-bold text-foreground leading-tight line-clamp-3" style={{ fontFamily: "'Outfit', sans-serif" }}>
                      {book.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">{book.author}</p>

                    {book.categoryName && (
                      <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 text-primary rounded-lg text-[11px] font-medium">
                        <Layers size={10} />
                        {book.categoryName}
                      </div>
                    )}

                    <div className="mt-3 flex items-center gap-2">
                      <span className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold",
                        isAvailable
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "bg-amber-500/10 text-amber-600 dark:text-amber-400",
                      )}>
                        {isAvailable ? <CheckCircle2 size={10} /> : <Clock size={10} />}
                        {isAvailable ? "Tersedia" : "Dipinjam"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {book.stock} eks.
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-5 pb-2">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Informasi Buku</p>
                <div className="bg-muted/40 rounded-2xl px-4 py-1">
                  <InfoRow icon={Hash} label="ISBN" value={book.isbn} />
                  <InfoRow icon={Building2} label="Penerbit" value={book.publisher} />
                  <InfoRow icon={Calendar} label="Tahun Terbit" value={book.year} />
                  <InfoRow icon={FileText} label="Jumlah Halaman" value={book.pages ? `${book.pages} halaman` : null} />
                  <InfoRow icon={BookCopy} label="Rak" value={book.rackName} />
                  <InfoRow icon={Star} label="Kategori" value={book.categoryName} />
                </div>
              </div>

              {book.description && (
                <div className="px-5 pb-4 mt-3">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Sinopsis</p>
                  <p className="text-sm text-foreground leading-relaxed bg-muted/40 rounded-2xl p-4">
                    {book.description}
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-border/50 flex gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => onToggleFavorite(book)}
                className={cn(
                  "flex-1 py-3 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200",
                  isFavorite
                    ? "bg-rose-500/15 text-rose-500 hover:bg-rose-500/20"
                    : "bg-muted text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500",
                )}
              >
                <Heart size={15} fill={isFavorite ? "currentColor" : "none"} />
                Favorit
              </motion.button>

              {onBorrow && (
                <motion.button
                  whileHover={{ scale: isAvailable ? 1.02 : 1 }}
                  whileTap={{ scale: isAvailable ? 0.97 : 1 }}
                  onClick={() => { if (isAvailable) { onBorrow(book); onClose(); } }}
                  disabled={!isAvailable}
                  className={cn(
                    "flex-[2] py-3 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200",
                    isAvailable
                      ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm shadow-primary/20"
                      : "bg-muted text-muted-foreground opacity-50 cursor-not-allowed",
                  )}
                >
                  <ArrowLeftRight size={15} />
                  {isAvailable ? "Pinjam Buku" : "Tidak Tersedia"}
                </motion.button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
