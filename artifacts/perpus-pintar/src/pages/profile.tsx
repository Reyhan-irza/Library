import { useState } from "react";
import { motion } from "framer-motion";
import { User, Shield, Lock, Loader2, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useGetMe, useChangePassword } from "@/hooks/api";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
  const { data: me, isLoading } = useGetMe();
  const changePassword = useChangePassword();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) { toast.error("Konfirmasi password tidak cocok"); return; }
    if (newPassword.length < 6) { toast.error("Password minimal 6 karakter"); return; }
    changePassword.mutate({ newPassword }, {
      onSuccess: () => {
        toast.success("Password berhasil diubah");
        setOldPassword(""); setNewPassword(""); setConfirmPassword("");
      },
      onError: (e: any) => toast.error(e?.message ?? "Gagal mengubah password"),
    });
  }

  if (isLoading) return (
    <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-primary" /></div>
  );

  return (
    <div className="space-y-5 max-w-lg">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-extrabold gradient-text" style={{ fontFamily: "'Sora', sans-serif" }}>Profil</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Informasi akun Anda</p>
      </motion.div>

      {/* Profile Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="glass rounded-3xl p-6 shadow-card">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/15 flex items-center justify-center">
            <span className="text-2xl font-black text-primary">{me?.name?.charAt(0).toUpperCase() ?? "?"}</span>
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground" style={{ fontFamily: "'Outfit', sans-serif" }}>{me?.name}</h2>
            <p className="text-sm text-muted-foreground">{me?.email}</p>
            <span className={cn("inline-flex items-center gap-1.5 mt-1.5 text-xs font-bold px-2.5 py-1 rounded-full",
              me?.role === "admin" ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground")}>
              <Shield size={11} />{me?.role === "admin" ? "Admin" : "Pustakawan"}
            </span>
          </div>
        </div>

        <div className="mt-5 pt-5 border-t border-border/50 space-y-3">
          {[
            { label: "Nama", value: me?.name },
            { label: "Email", value: me?.email },
            { label: "Username", value: me?.username },
            { label: "Role", value: me?.role === "admin" ? "Admin" : "Pustakawan" },
          ].map(row => (
            <div key={row.label} className="flex justify-between items-center py-1.5 border-b border-border/30 last:border-0">
              <span className="text-xs text-muted-foreground font-medium">{row.label}</span>
              <span className="text-sm font-semibold text-foreground">{row.value ?? "-"}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Change Password */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="glass rounded-3xl p-6 shadow-card">
        <div className="flex items-center gap-2 mb-4">
          <Lock size={15} className="text-primary" />
          <h3 className="text-sm font-bold text-foreground" style={{ fontFamily: "'Outfit', sans-serif" }}>Ubah Password</h3>
        </div>
        <form onSubmit={handleChangePassword} className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider">Password Baru *</label>
            <div className="relative mt-1">
              <input type={showNew ? "text" : "password"} value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={6}
                className="w-full h-10 px-3 pr-10 rounded-xl border border-border bg-background/60 text-sm focus:outline-none focus:border-primary transition-colors" />
              <button type="button" onClick={() => setShowNew(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider">Konfirmasi Password *</label>
            <div className="relative mt-1">
              <input type={showConfirm ? "text" : "password"} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required
                className="w-full h-10 px-3 pr-10 rounded-xl border border-border bg-background/60 text-sm focus:outline-none focus:border-primary transition-colors" />
              <button type="button" onClick={() => setShowConfirm(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="text-xs text-rose-500 mt-1">Password tidak cocok</p>
            )}
            {confirmPassword && newPassword === confirmPassword && confirmPassword.length >= 6 && (
              <div className="flex items-center gap-1 mt-1">
                <CheckCircle2 size={12} className="text-emerald-500" />
                <p className="text-xs text-emerald-500">Password cocok</p>
              </div>
            )}
          </div>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            type="submit" disabled={changePassword.isPending}
            className="w-full h-11 rounded-xl bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-all">
            {changePassword.isPending ? <><Loader2 size={15} className="animate-spin" /> Memproses…</> : "Ubah Password"}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}
