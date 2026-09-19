import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { BookX, ArrowLeft } from "lucide-react";

export default function NotFoundPage() {
  const [, navigate] = useLocation();
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 28 }}
        className="text-center max-w-sm"
      >
        <div className="w-20 h-20 rounded-3xl bg-muted flex items-center justify-center mx-auto mb-5">
          <BookX size={34} className="text-muted-foreground" />
        </div>
        <h1 className="text-5xl font-black gradient-text mb-2" style={{ fontFamily: "'Sora', sans-serif" }}>404</h1>
        <p className="text-lg font-semibold text-foreground mb-1">Halaman Tidak Ditemukan</p>
        <p className="text-sm text-muted-foreground mb-6">
          Halaman yang Anda cari tidak ada atau telah dipindahkan.
        </p>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate("/dashboard")}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-primary text-primary-foreground text-sm font-bold shadow-sm shadow-primary/30 hover:bg-primary/90 transition-all"
        >
          <ArrowLeft size={15} />
          Kembali ke Dashboard
        </motion.button>
      </motion.div>
    </div>
  );
}
