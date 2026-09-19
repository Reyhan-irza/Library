import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

interface AppModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  scrollable?: boolean;
}

/**
 * Shared modal component — replaces the 6 identical inline Modal definitions
 * that were duplicated across every CRUD page.
 */
export default function AppModal({ open, onClose, title, children, scrollable = false }: AppModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            className={`relative bg-card border border-border/50 rounded-3xl shadow-2xl w-full max-w-md ${
              scrollable ? "max-h-[90vh] overflow-y-auto" : "overflow-hidden"
            }`}
          >
            <div
              className={`flex items-center justify-between p-5 border-b border-border/50 ${
                scrollable ? "sticky top-0 bg-card z-10" : ""
              }`}
            >
              <h2 className="text-sm font-bold text-foreground" style={{ fontFamily: "'Outfit', sans-serif" }}>
                {title}
              </h2>
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                aria-label="Tutup"
              >
                <X size={15} />
              </button>
            </div>
            <div className="p-5">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
