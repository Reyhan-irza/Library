import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { BookOpen, Eye, EyeOff, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useLogin } from "@/hooks/api";
import AnimatedBackground from "@/components/animated-bg";
import { ThemeProvider } from "@/components/theme-provider";

export default function LoginPage() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const login = useLogin();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error("Email dan password wajib diisi");
      return;
    }
    login.mutate(
      { data: { email: email.trim(), password } },
      {
        onSuccess: () => {
          toast.success("Login berhasil!");
          navigate("/dashboard");
        },
        onError: (err: any) => {
          toast.error(err?.message ?? "Login gagal, periksa kredensial Anda");
        },
      },
    );
  }

  return (
    <ThemeProvider>
      <div className="min-h-screen flex items-center justify-center p-4 bg-background relative overflow-hidden">
        <AnimatedBackground />

        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          className="relative z-10 w-full max-w-sm"
        >
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 20, delay: 0.1 }}
              className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-xl shadow-primary/30 mb-4 float-slow"
            >
              <BookOpen size={28} className="text-primary-foreground" />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-center"
            >
              <h1 className="text-2xl font-extrabold gradient-text" style={{ fontFamily: "'Sora', sans-serif" }}>
                Perpustakaan
              </h1>
              <p className="text-sm text-muted-foreground mt-1">SMKN 2 Lubuk Basung</p>
            </motion.div>
          </div>

          {/* Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="glass rounded-3xl p-6 shadow-card"
          >
            <div className="flex items-center gap-2 mb-5">
              <Sparkles size={14} className="text-primary" />
              <h2 className="text-sm font-bold text-foreground" style={{ fontFamily: "'Outfit', sans-serif" }}>
                Masuk ke Sistem
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="email@sekolah.sch.id"
                  autoComplete="email"
                  required
                  className="w-full h-11 px-4 rounded-xl border border-border bg-background/60 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                    className="w-full h-11 px-4 pr-11 rounded-xl border border-border bg-background/60 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                type="submit"
                disabled={login.isPending}
                className="w-full h-11 rounded-xl bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center gap-2 shadow-sm shadow-primary/30 hover:bg-primary/90 transition-all duration-200 disabled:opacity-70"
              >
                {login.isPending ? (
                  <><Loader2 size={16} className="animate-spin" /> Memproses…</>
                ) : (
                  "Masuk"
                )}
              </motion.button>
            </form>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center text-xs text-muted-foreground mt-5"
          >
            Sistem Informasi Perpustakaan Digital
          </motion.p>
        </motion.div>
      </div>
    </ThemeProvider>
  );
}
