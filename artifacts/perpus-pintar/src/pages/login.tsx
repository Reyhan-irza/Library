/**
 * VIREON — Login Page
 *
 * Split-panel layout: dark brand panel (left) + white form panel (right).
 * Light-mode only. No "Lupa password" link. Consistent with landing page.
 */

import { useState, useEffect } from "react";
import VIREON_LOGO from "@/assets/logo";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import type { TargetAndTransition, Transition } from "framer-motion";
import {
  Eye,
  EyeOff,
  Loader2,
  ArrowRight,
  BookOpen,
  Users,
  BarChart3,
  ShieldCheck,
  ChevronLeft,
} from "lucide-react";
import { toast } from "sonner";
import { useLogin } from "@/hooks/api";

// ─── Animation helpers ──────────────────────────────────────────────────────

interface Anim {
  initial?: TargetAndTransition;
  animate?: TargetAndTransition;
  transition?: Transition;
}

const EASE = [0.21, 1.04, 0.58, 1] as const;

function fadeUp(delay = 0): Anim {
  return {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.55, delay, ease: EASE },
  };
}

// ─── Static data ─────────────────────────────────────────────────────────────

const BRAND_FEATURES = [
  { icon: BookOpen, text: "Kelola ribuan koleksi buku dengan mudah" },
  { icon: Users, text: "Manajemen anggota & riwayat peminjaman" },
  { icon: BarChart3, text: "Laporan dan statistik real-time" },
  { icon: ShieldCheck, text: "Keamanan data berlapis berbasis peran" },
] as const;

// ─── Page ────────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const login = useLogin();

  // Force light mode — same pattern as LandingPage
  useEffect(() => {
    const root = document.documentElement;
    const wasDark = root.classList.contains("dark");
    root.classList.remove("dark");
    return () => {
      if (wasDark) root.classList.add("dark");
    };
  }, []);

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
      }
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white overflow-hidden">

      {/* ── Left — Brand Panel ───────────────────────────────────────────── */}
      <div className="relative lg:w-[46%] bg-slate-900 flex flex-col overflow-hidden">

        {/* Decorative background layers */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          {/* Dot grid */}
          <svg className="absolute inset-0 w-full h-full opacity-[0.055]">
            <defs>
              <pattern id="login-dots" x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse">
                <circle cx="1.5" cy="1.5" r="1.5" fill="white" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#login-dots)" />
          </svg>
          {/* Primary orb — top left */}
          <div
            className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full"
            style={{ background: "radial-gradient(circle, hsl(161 50% 40% / 0.28) 0%, transparent 65%)" }}
          />
          {/* Accent orb — bottom right */}
          <div
            className="absolute -bottom-24 -right-16 w-[380px] h-[380px] rounded-full"
            style={{ background: "radial-gradient(circle, hsl(161 50% 35% / 0.18) 0%, transparent 65%)" }}
          />
          {/* Horizontal accent lines */}
          <div className="absolute inset-x-0 top-[28%] h-px bg-gradient-to-r from-transparent via-white/[0.04] to-transparent" />
          <div className="absolute inset-x-0 top-[56%] h-px bg-gradient-to-r from-transparent via-white/[0.04] to-transparent" />
          {/* Large watermark text */}
          <div
            className="absolute -bottom-4 -right-4 font-black leading-none select-none text-white/[0.025] tracking-tighter"
            style={{ fontSize: "clamp(80px, 14vw, 140px)" }}
          >
            VIREON
          </div>
          {/* Thin right border glow */}
          <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between h-full px-8 py-8 lg:px-12 lg:py-10 min-h-[280px] lg:min-h-screen">

          {/* Top: back link */}
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-[12px] font-medium text-slate-500 hover:text-slate-300 transition-colors group"
            >
              <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" aria-hidden="true" />
              Kembali ke Beranda
            </Link>
          </div>

          {/* Middle: branding + features */}
          <div className="py-10 lg:py-0">
            {/* Logo + wordmark */}
            <motion.div
              {...fadeUp(0)}
              className="flex items-center gap-3 mb-8"
            >
              <div className="w-11 h-11 rounded-xl overflow-hidden ring-1 ring-white/20 shadow-xl flex-shrink-0">
                <img
                  src={VIREON_LOGO}
                  alt="Vireon"
                  className="w-full h-full object-cover"
                  loading="eager"
                  decoding="sync"
                />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[14px] font-bold text-white tracking-[0.07em]">VIREON</span>
                <span className="text-[9px] font-medium text-slate-500 uppercase tracking-[0.15em]">
                  Library System
                </span>
              </div>
            </motion.div>

            {/* Headline */}
            <motion.h2
              {...fadeUp(0.08)}
              className="text-[2rem] lg:text-[2.5rem] font-extrabold text-white leading-[1.1] tracking-tight font-sans mb-4"
            >
              Sistem Perpustakaan
              <br />
              <span style={{ color: "hsl(161 50% 56%)" }}>Cerdas</span> untuk
              <br />
              Sekolah Modern
            </motion.h2>

            <motion.p
              {...fadeUp(0.16)}
              className="text-[14px] text-slate-400 leading-relaxed max-w-sm mb-9"
            >
              Kelola koleksi buku, anggota, dan peminjaman dalam satu platform yang
              sederhana, cepat, dan terpercaya.
            </motion.p>

            {/* Feature list */}
            <ul className="space-y-3.5">
              {BRAND_FEATURES.map((f, i) => {
                const Icon = f.icon;
                return (
                  <motion.li
                    key={f.text}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.45, delay: 0.28 + i * 0.09, ease: EASE }}
                    className="flex items-center gap-3"
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center"
                      style={{
                        background: "hsl(161 50% 40% / 0.2)",
                        border: "1px solid hsl(161 50% 40% / 0.35)",
                      }}
                    >
                      <Icon
                        className="w-3.5 h-3.5"
                        style={{ color: "hsl(161 50% 60%)" }}
                        strokeWidth={1.75}
                        aria-hidden="true"
                      />
                    </div>
                    <span className="text-[13px] text-slate-300 leading-snug">{f.text}</span>
                  </motion.li>
                );
              })}
            </ul>
          </div>

          {/* Bottom: school badge */}
          <div className="hidden lg:block">
            <motion.div
              {...fadeUp(0.7)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full"
              style={{
                background: "hsl(161 50% 40% / 0.1)",
                border: "1px solid hsl(161 50% 40% / 0.25)",
              }}
            >
              <div
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ background: "hsl(161 50% 56%)" }}
              />
              <span className="text-[11px] text-slate-400 font-medium">
                SMKN 2 Lubuk Basung, Sumatera Barat
              </span>
            </motion.div>
          </div>
        </div>
      </div>

      {/* ── Right — Form Panel ────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 sm:px-10 lg:px-16 bg-white relative">

        {/* Subtle ambient gradient */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 80% 55% at 50% 0%, hsl(161 50% 40% / 0.045) 0%, transparent 65%)",
          }}
          aria-hidden="true"
        />

        <motion.div
          {...fadeUp(0.1)}
          className="relative w-full max-w-[400px]"
        >
          {/* Heading */}
          <div className="mb-8">
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-semibold mb-5"
              style={{
                background: "hsl(161 50% 40% / 0.08)",
                border: "1px solid hsl(161 50% 40% / 0.2)",
                color: "hsl(161 50% 35%)",
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ background: "hsl(161 50% 40%)" }}
              />
              Masuk ke Akun Anda
            </div>
            <h1 className="text-[1.85rem] sm:text-3xl font-extrabold text-slate-900 tracking-tight font-sans leading-tight mb-2">
              Selamat Datang
              <br />
              Kembali
            </h1>
            <p className="text-[14px] text-slate-500 leading-relaxed">
              Gunakan email dan password yang telah diberikan oleh administrator.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Email */}
            <div className="space-y-2">
              <label
                htmlFor="login-email"
                className="block text-[12px] font-semibold text-slate-700 uppercase tracking-wider"
              >
                Email
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@sekolah.sch.id"
                autoComplete="email"
                required
                className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-white text-[14px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all duration-150 font-sans"
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label
                htmlFor="login-password"
                className="block text-[12px] font-semibold text-slate-700 uppercase tracking-wider"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password Anda"
                  autoComplete="current-password"
                  required
                  className="w-full h-12 px-4 pr-12 rounded-xl border border-slate-200 bg-white text-[14px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all duration-150 font-sans"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-700 transition-colors rounded-lg hover:bg-slate-100"
                  aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" aria-hidden="true" />
                  ) : (
                    <Eye className="w-4 h-4" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <motion.button
              whileHover={{ scale: 1.012 }}
              whileTap={{ scale: 0.975 }}
              type="submit"
              disabled={login.isPending}
              className="w-full h-12 mt-2 rounded-xl bg-primary text-white text-[14px] font-semibold flex items-center justify-center gap-2 shadow-md shadow-primary/20 hover:opacity-90 active:scale-[0.98] transition-all duration-200 disabled:opacity-60 font-sans"
            >
              {login.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  Memproses…
                </>
              ) : (
                <>
                  Masuk ke Sistem
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </>
              )}
            </motion.button>
          </form>

          {/* Security note */}
          <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-start gap-2.5">
              <ShieldCheck
                className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5"
                strokeWidth={1.75}
                aria-hidden="true"
              />
              <p className="text-[12px] text-slate-500 leading-relaxed">
                Akses bersifat terbatas. Hubungi administrator sekolah jika Anda
                mengalami masalah saat masuk.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-[11px] text-slate-400">
              &copy; {new Date().getFullYear()} Vireon Library System &mdash; SMKN 2 Lubuk Basung
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
