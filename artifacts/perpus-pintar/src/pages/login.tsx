/**
 * VIREON — Login Page (Phase 1 Premium Redesign)
 *
 * Desktop: form panel (left) + immersive visual panel (right).
 * Mobile: independent layout — compact header + full-width form.
 * Auth logic unchanged — Supabase signInWithPassword via useLogin().
 */

import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence, useReducedMotion, useScroll, useTransform } from "framer-motion";
import {
  Eye,
  EyeOff,
  Loader2,
  ArrowRight,
  ChevronLeft,
  BookOpen,
  Users,
  BarChart3,
  ShieldCheck,
  AlertCircle,
  Clock,
} from "lucide-react";
import VIREON_LOGO from "@/assets/logo";
import { useLogin, useLandingStats } from "@/hooks/api";
import DashboardPreview from "@/components/dashboard-preview";

// ── Animation helpers ────────────────────────────────────────────────────────

const EASE = [0.21, 1.04, 0.58, 1] as const;

function fadeUp(delay = 0) {
  return {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.52, delay, ease: EASE },
  } as const;
}

// ── Feature list for the visual panel ────────────────────────────────────────

const PANEL_FEATURES = [
  { icon: BookOpen, text: "Kelola ribuan koleksi buku" },
  { icon: Users, text: "Manajemen anggota & peminjaman" },
  { icon: BarChart3, text: "Laporan dan statistik real-time" },
  { icon: ShieldCheck, text: "Data aman & terenkripsi" },
] as const;

// ── Page ─────────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const login = useLogin();
  const { data: stats, isLoading: statsLoading } = useLandingStats();
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const visualY = useTransform(scrollYProgress, [0, 1], ["0%", "7%"]);

  // Force light mode — login page is always light
  useEffect(() => {
    const root = document.documentElement;
    const wasDark = root.classList.contains("dark");
    root.classList.remove("dark");
    return () => {
      if (wasDark) root.classList.add("dark");
    };
  }, []);

  function handleFieldChange() {
    if (authError) setAuthError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setAuthError(null);
    login.mutate(
      { data: { email: email.trim(), password } },
      {
        onSuccess: () => navigate("/dashboard"),
        onError: (err: unknown) => {
          const msg =
            err instanceof Error
              ? err.message
              : "Email atau password tidak valid";
          setAuthError(msg);
        },
      }
    );
  }

  const isSubmittable = email.trim().length > 0 && password.length > 0;

  return (
    <div
      className="min-h-[100dvh] flex flex-col lg:flex-row bg-[#fbfaf6] overflow-hidden"
      role="main"
    >
      {/* ══════════════════════════════════════════════════════════════════════
          LEFT — Form Panel
          ══════════════════════════════════════════════════════════════════════ */}
      <div className="flex-1 lg:w-[460px] lg:max-w-[460px] lg:flex-none flex flex-col bg-[#fbfaf6] relative z-10">

        {/* Subtle ambient top glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 100% 40% at 50% -5%, hsl(161 52% 40% / 0.05) 0%, transparent 65%)",
          }}
          aria-hidden="true"
        />

        {/* ── Top bar ───────────────────────────────────────────────────────── */}
        <div className="relative flex items-center justify-between px-6 sm:px-8 lg:px-10 pt-6 pb-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-slate-400 hover:text-slate-700 transition-colors duration-150 group"
            aria-label="Kembali ke halaman beranda"
          >
            <ChevronLeft
              className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform duration-150"
              aria-hidden="true"
            />
            Beranda
          </Link>

          {/* VIREON mark — mobile only (right side of header) */}
          <div className="flex items-center gap-2 lg:hidden">
            <div className="w-7 h-7 shrink-0">
              <img
                src={VIREON_LOGO}
                alt="VIREON"
                className="w-full h-full object-contain"
                loading="eager"
                decoding="sync"
              />
            </div>
            <span className="text-[12.5px] font-bold text-slate-800 tracking-[0.05em]">
              VIREON
            </span>
          </div>
        </div>

        {/* ── Form content ──────────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col justify-center px-6 sm:px-8 lg:px-10 py-6 lg:py-10">
          <div className="w-full max-w-[360px] mx-auto lg:mx-0">

            {/* VIREON wordmark — desktop only */}
            <motion.div
              {...(reduced ? {} : fadeUp(0))}
              className="hidden lg:flex items-center gap-2.5 mb-10"
            >
              <div className="w-10 h-10 shrink-0">
                <img
                  src={VIREON_LOGO}
                  alt="VIREON"
                  className="w-full h-full object-contain"
                  loading="eager"
                  decoding="sync"
                />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[13px] font-bold text-slate-900 tracking-[0.06em]">
                  VIREON
                </span>
                <span className="text-[9.5px] font-medium text-slate-400 uppercase tracking-[0.14em]">
                  Library System
                </span>
              </div>
            </motion.div>

            {/* Heading group */}
            <motion.div {...(reduced ? {} : fadeUp(0.04))} className="mb-7">
              {/* Badge pill */}
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-semibold mb-5"
                style={{
                  background: "hsl(161 52% 40% / 0.07)",
                  border: "1px solid hsl(161 52% 40% / 0.18)",
                  color: "hsl(161 52% 30%)",
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: "hsl(161 52% 44%)" }}
                  aria-hidden="true"
                />
                Buka ruang bacaanmu
              </div>

              <h1 className="text-[1.875rem] sm:text-[2.125rem] font-extrabold text-slate-900 tracking-[-0.025em] leading-[1.08] mb-3">
                Selamat datang
                <br />
                kembali
              </h1>
              <p className="text-[13.5px] text-slate-500 leading-relaxed">
                Masuk untuk mengatur koleksi, melihat aktivitas, dan menjaga
                perjalanan membaca tetap rapi.
              </p>
            </motion.div>

            {/* ── Form ────────────────────────────────────────────────────── */}
            <motion.form
              {...(reduced ? {} : fadeUp(0.1))}
              onSubmit={handleSubmit}
              className="space-y-4"
              noValidate
              aria-label="Formulir masuk"
            >

              {/* Email */}
              <div className="space-y-1.5">
                <label
                  htmlFor="login-email"
                  className="block text-[11.5px] font-semibold text-slate-600 uppercase tracking-[0.08em]"
                >
                  Email
                </label>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    handleFieldChange();
                  }}
                  placeholder="nama@ruangbaca.id"
                  autoComplete="email"
                  required
                  aria-required="true"
                  aria-invalid={authError ? "true" : undefined}
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-white text-[14px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-400/70 focus:ring-2 focus:ring-emerald-500/10 transition-all duration-150"
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label
                  htmlFor="login-password"
                  className="block text-[11.5px] font-semibold text-slate-600 uppercase tracking-[0.08em]"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      handleFieldChange();
                    }}
                    placeholder="Tulis password kamu"
                    autoComplete="current-password"
                    required
                    aria-required="true"
                    aria-invalid={authError ? "true" : undefined}
                    className="w-full h-11 px-3.5 pr-11 rounded-xl border border-slate-200 bg-white text-[14px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-400/70 focus:ring-2 focus:ring-emerald-500/10 transition-all duration-150"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 transition-colors duration-150 rounded-lg hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                    aria-label={
                      showPassword ? "Sembunyikan password" : "Tampilkan password"
                    }
                    aria-pressed={showPassword}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" aria-hidden="true" />
                    ) : (
                      <Eye className="w-4 h-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>

              {/* Inline auth error */}
              <AnimatePresence>
                {authError && (
                  <motion.div
                    key="auth-error"
                    initial={{ opacity: 0, y: -6, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, y: -4, height: 0 }}
                    transition={{ duration: 0.22, ease: "easeOut" }}
                    className="overflow-hidden"
                    role="alert"
                    aria-live="polite"
                  >
                    <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl bg-red-50 border border-red-100">
                      <AlertCircle
                        className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-[1px]"
                        aria-hidden="true"
                      />
                      <p className="text-[12.5px] text-red-600 leading-snug">
                        {authError}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit button */}
              <div className="pt-1">
                <motion.button
                  type="submit"
                  disabled={login.isPending || !isSubmittable}
                  whileHover={{ scale: login.isPending || !isSubmittable ? 1 : 1.012 }}
                  whileTap={{ scale: login.isPending || !isSubmittable ? 1 : 0.982 }}
                  className="w-full h-11 rounded-xl text-white text-[14px] font-semibold flex items-center justify-center gap-2.5 transition-all duration-200 disabled:opacity-55 disabled:cursor-not-allowed relative overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-emerald-600"
                  style={{
                    background: "hsl(161 52% 28%)",
                    boxShadow:
                      "0 1px 3px rgba(0,0,0,0.22), 0 0 0 1px hsl(161 52% 44% / 0.3)",
                  }}
                  onMouseEnter={(e) => {
                    if (!login.isPending && isSubmittable)
                      (e.currentTarget as HTMLButtonElement).style.background =
                        "hsl(161 52% 34%)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background =
                      "hsl(161 52% 28%)";
                  }}
                >
                  {login.isPending ? (
                    <>
                      <Loader2
                        className="w-4 h-4 animate-spin"
                        aria-hidden="true"
                      />
                      <span>Memproses…</span>
                    </>
                  ) : (
                    <>
                      <span>Masuk ke Sistem</span>
                      <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    </>
                  )}
                </motion.button>
              </div>
            </motion.form>

            {/* Security note */}
            <motion.div {...(reduced ? {} : fadeUp(0.18))} className="mt-5 flex items-start gap-2.5">
              <ShieldCheck
                className="w-3.5 h-3.5 text-slate-350 flex-shrink-0 mt-0.5"
                style={{ color: "#cbd5e1" }}
                strokeWidth={1.75}
                aria-hidden="true"
              />
              <p className="text-[12px] text-slate-400 leading-relaxed">
                Akses bersifat terbatas. Hubungi administrator jika mengalami
                masalah saat masuk.
              </p>
            </motion.div>
          </div>
        </div>

        {/* ── Footer ────────────────────────────────────────────────────────── */}
        <div className="relative px-6 sm:px-8 lg:px-10 py-5 border-t border-slate-100/80">
          <p className="text-[11.5px] text-slate-400">
            &copy; {new Date().getFullYear()} Vireon Library System
          </p>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          RIGHT — Visual Panel (desktop only)
          ══════════════════════════════════════════════════════════════════════ */}
      <div
        className="hidden lg:flex flex-1 relative overflow-hidden items-center justify-center"
        aria-hidden="true"
      >
        {/* ── Background: library photo ──────────────────────────────────── */}
        <motion.div
          className="absolute inset-0 pointer-events-none select-none"
          style={reduced ? {} : { y: visualY }}
          aria-hidden="true"
        >
          <img
            src="/library-bg.jpg"
            alt=""
            className="w-full h-full object-cover"
            style={{ objectPosition: "center 30%" }}
            loading="eager"
            decoding="sync"
          />
          {/* Dark emerald overlay — identical to landing page hero */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(160deg, hsl(161 62% 5% / 0.93) 0%, hsl(161 48% 9% / 0.85) 55%, hsl(161 38% 8% / 0.89) 100%)",
            }}
          />
          {/* Left-edge glow separator */}
          <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent" />
          {/* Top vignette */}
          <div
            className="absolute inset-x-0 top-0 h-28"
            style={{
              background:
                "linear-gradient(to bottom, hsl(161 62% 4% / 0.45), transparent)",
            }}
          />
          {/* Bottom vignette */}
          <div
            className="absolute inset-x-0 bottom-0 h-28"
            style={{
              background:
                "linear-gradient(to top, hsl(161 62% 4% / 0.45), transparent)",
            }}
          />
        </motion.div>

        {/* ── Content ─────────────────────────────────────────────────────── */}
        <div className="relative z-10 w-full max-w-[580px] px-10 xl:px-14 py-12 flex flex-col">

          {/* Ambient glow around the preview card */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 80% 65% at 50% 45%, hsl(161 52% 55% / 0.16) 0%, transparent 70%)",
            }}
            aria-hidden="true"
          />

          {/* ── Dashboard preview card with floating chips ─────────────── */}
          <div className="relative">
            {/* Floating chip — top right */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5, ease: EASE }}
              className="absolute -top-5 right-4 z-20 flex items-center gap-2 bg-white border border-slate-200/80 rounded-full px-3 py-1.5 shadow-[0_6px_24px_rgba(0,0,0,0.22),0_1px_3px_rgba(0,0,0,0.12)]"
            >
              <div
                className="w-1.5 h-1.5 rounded-full animate-pulse flex-shrink-0"
                style={{ background: "hsl(161 52% 44%)" }}
              />
              <span className="text-[11.5px] font-semibold text-slate-700">
                Sistem Aktif
              </span>
            </motion.div>

            {/* Dashboard Preview */}
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.12, ease: EASE }}
            >
              <div
                style={{
                  transform: "perspective(1400px) rotateY(-3deg) rotateX(1.5deg)",
                  transformOrigin: "center center",
                }}
              >
                <DashboardPreview stats={stats} loading={statsLoading} />
              </div>
            </motion.div>

            {/* Floating chip — bottom left */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.62, ease: EASE }}
              className="absolute -bottom-5 left-4 z-20 flex items-center gap-2 bg-white border border-slate-200/80 rounded-full px-3 py-1.5 shadow-[0_6px_24px_rgba(0,0,0,0.22),0_1px_3px_rgba(0,0,0,0.12)]"
            >
              <Clock
                className="w-3 h-3 flex-shrink-0"
                style={{ color: "hsl(161 52% 44%)" }}
                aria-hidden="true"
              />
              <span className="text-[11.5px] font-semibold text-slate-700">
                Diperbarui real-time
              </span>
            </motion.div>
          </div>

          {/* ── Feature grid ──────────────────────────────────────────────── */}
          <div className="mt-14 grid grid-cols-2 gap-x-6 gap-y-3.5">
            {PANEL_FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={f.text}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.4,
                    delay: 0.55 + i * 0.07,
                    ease: EASE,
                  }}
                  className="flex items-center gap-2.5"
                >
                  <div
                    className="w-6 h-6 rounded-lg flex-shrink-0 flex items-center justify-center"
                    style={{
                      background: "hsl(161 50% 40% / 0.15)",
                      border: "1px solid hsl(161 50% 40% / 0.28)",
                    }}
                  >
                    <Icon
                      className="w-3 h-3"
                      style={{ color: "hsl(161 50% 64%)" }}
                      strokeWidth={1.75}
                      aria-hidden="true"
                    />
                  </div>
                  <span className="text-[12px] text-slate-400 leading-snug">
                    {f.text}
                  </span>
                </motion.div>
              );
            })}
          </div>

          {/* ── Workspace badge ───────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.82 }}
            className="mt-8 inline-flex items-center gap-2 px-3.5 py-2 rounded-full self-start"
            style={{
              background: "hsl(161 50% 40% / 0.08)",
              border: "1px solid hsl(161 50% 40% / 0.22)",
            }}
          >
            <div
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ background: "hsl(161 50% 56%)" }}
            />
            <span className="text-[10.5px] text-slate-500 font-medium">
              Ruang kerja perpustakaan digital
            </span>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
