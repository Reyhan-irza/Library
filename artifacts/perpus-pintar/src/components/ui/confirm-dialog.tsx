import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Loader2 } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmLabel?: string;
  loading?: boolean;
  variant?: "danger" | "warning";
}

/**
 * Styled confirmation dialog — replaces all browser confirm() calls
 * which were unstyled, non-cancellable on mobile, and broke visual continuity.
 */
export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = "Konfirmasi",
  message,
  confirmLabel = "Hapus",
  loading = false,
  variant = "danger",
}: ConfirmDialogProps) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="alertdialog" aria-modal="true">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            className="relative bg-card border border-border/50 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden"
          >
            <div className="p-6">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${
                  variant === "danger" ? "bg-rose-500/10" : "bg-amber-500/10"
                }`}
              >
                <AlertTriangle
                  size={22}
                  className={variant === "danger" ? "text-rose-500" : "text-amber-500"}
                />
              </div>
              <h3
                className="text-sm font-bold text-foreground mb-1.5"
                style={{ fontFamily: "'Outfit', sans-serif" }}
              >
                {title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{message}</p>
            </div>
            <div className="flex gap-2.5 px-6 pb-6">
              <button
                onClick={onClose}
                disabled={loading}
                className="flex-1 h-10 rounded-xl border border-border text-sm font-semibold text-foreground hover:bg-muted transition-all disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={onConfirm}
                disabled={loading}
                className={`flex-1 h-10 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-70 ${
                  variant === "danger"
                    ? "bg-rose-500 hover:bg-rose-600 shadow-sm shadow-rose-500/20"
                    : "bg-amber-500 hover:bg-amber-600 shadow-sm shadow-amber-500/20"
                }`}
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
