/**
 * VIREON — Login Page (Phase 1 Premium Redesign)
 *
 * Desktop: form panel (left) + immersive visual panel (right).
 * Mobile: independent layout — compact header + full-width form.
 * Auth logic unchanged — Supabase signInWithPassword via useLogin().
 */

import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence, useReducedMotion, useScroll, useTransform, type Transition } from "framer-motion";
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
  Mail,
  KeyRound,
  CheckCircle2,
} from "lucide-react";
import VIREON_LOGO, { VIREON_WORDMARK } from "@/assets/logo";
import { useLogin, useLandingStats } from "@/hooks/api";
import DashboardPreview from "@/components/dashboard-preview";
import { PrivacyBook, type PrivacyBookState } from "@/components/login-illustration";

// ── Animation helpers ────────────────────────────────────────────────────────

const EASE = [0.21, 1.04, 0.58, 1] as const;

function fadeUp(delay = 0, reduced = false) {
  if (reduced) {
    return {
      initial: { opacity: 1, y: 0 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0 },
    } as const;
  }
  return {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.52, delay, ease: EASE },
  } as const;
}

const getAssetUrl = (path: string) => {
  const base = import.meta.env.BASE_URL || "/";
  return `${base.endsWith("/") ? base.slice(0, -1) : base}${path}`;
};

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
  const [formState, setFormState] = useState<PrivacyBookState>("idle");
  const [emailCaretProgress, setEmailCaretProgress] = useState(-1);
  const emailInputRef = useRef<HTMLInputElement>(null);

  const login = useLogin();
  const { data: stats, isLoading: statsLoading } = useLandingStats();
  const reduced = useReducedMotion() ?? true;
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

  function syncEmailCaret(input: HTMLInputElement) {
    const styles = window.getComputedStyle(input);
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) return;

    context.font = [
      styles.fontStyle,
      styles.fontWeight,
      styles.fontSize,
      styles.fontFamily,
    ].join(" ");

    const caretIndex = input.selectionStart ?? input.value.length;
    const textBeforeCaret = input.value.slice(0, caretIndex);
    const textWidth = context.measureText(textBeforeCaret).width;
    const paddingLeft = Number.parseFloat(styles.paddingLeft) || 0;
    const paddingRight = Number.parseFloat(styles.paddingRight) || 0;
    const contentWidth = Math.max(1, input.clientWidth - paddingLeft - paddingRight);
    const visibleCaretX = Math.max(0, Math.min(contentWidth, textWidth - input.scrollLeft));
    const normalizedProgress = (visibleCaretX / contentWidth) * 2 - 1;

    setEmailCaretProgress(Math.max(-1, Math.min(1, normalizedProgress)));
  }

  function handleBlur(e: React.FocusEvent) {
    const form = e.currentTarget.closest("form");
    if (form && form.contains(e.relatedTarget as Node)) {
      return;
    }
    setFormState("idle");
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (login.isPending) return;

    // Explicit browser validation check
    const form = e.currentTarget;
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

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

  const isSubmittable = email.trim().length > 0 && password.length > 0 && !login.isPending;
  const activeTypingValue = formState === "email" ? email : password;
  const typingLimit = formState === "email" ? 28 : 16;
  const passwordTypingProgress =
    activeTypingValue.length === 0
      ? -1
      : Math.min(activeTypingValue.length / typingLimit, 1) * 2 - 1;
  const typingProgress = formState === "email" ? emailCaretProgress : passwordTypingProgress;
  const emailLooksValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const accessStatus = authError
    ? "Periksa kembali data masuk"
    : login.isPending
      ? "Memverifikasi akses..."
      : formState === "email"
        ? "Identitas email sedang diisi"
        : formState === "password-visible"
          ? "Tampilan password sedang aktif"
          : formState === "password-hidden"
            ? "Password tersimpan dengan aman"
            : "Siap membuka ruang kerja";
  const accessStage = formState === "password-hidden" || formState === "password-visible" || login.isPending ? 2 : 1;

  return (
    <div
      className="min-h-[100dvh] flex flex-col lg:flex-row bg-[#fbfaf6] overflow-hidden"
      role="main"
    >
      {/* ══════════════════════════════════════════════════════════════════════
          LEFT — Form Panel
          ══════════════════════════════════════════════════════════════════════ */}
      <div
        className="relative z-10 flex flex-1 flex-col overflow-hidden border-r border-slate-200/40 bg-[#f8faf7] shadow-[4px_0_24px_rgba(0,0,0,0.02)] lg:w-[480px] lg:max-w-[480px] lg:flex-none"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 85% 35% at 18% 8%, hsl(161 52% 44% / 0.08) 0%, transparent 72%), radial-gradient(ellipse 70% 45% at 100% 65%, hsl(194 56% 66% / 0.07) 0%, transparent 70%), linear-gradient(145deg, #fafcf9 0%, #f6faf7 100%)",
        }}
      >

        {/* Rich textural background for form panel */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.02]"
          style={{
            backgroundImage:
              "radial-gradient(circle, hsl(161 52% 30% / 0.5) 1px, transparent 1px), linear-gradient(135deg, transparent 0 48%, hsl(161 52% 30% / 0.18) 49% 50%, transparent 51%)",
            backgroundSize: "22px 22px, 44px 44px",
          }}
          aria-hidden="true"
        />

        {/* Ambient top glow */}
        <div
          className="absolute inset-0 pointer-events-none mix-blend-multiply"
          style={{
            background:
              "radial-gradient(ellipse 100% 40% at 50% -5%, hsl(161 52% 40% / 0.08) 0%, transparent 65%)",
          }}
          aria-hidden="true"
        />

        {/* Soft spatial shapes keep the form panel from feeling flat,
            especially on mobile where the visual panel is hidden. */}
        <div
          className="pointer-events-none absolute -left-28 top-[13%] h-72 w-72 rounded-full bg-emerald-200/20 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -right-36 top-[42%] h-80 w-80 rounded-full border border-emerald-900/[0.055]"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -right-20 top-[48%] h-48 w-48 rounded-full border border-emerald-900/[0.045]"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute bottom-16 left-8 h-24 w-44 rounded-full bg-sky-100/30 blur-3xl"
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
          <div className="flex items-center lg:hidden">
            <img
              src={VIREON_WORDMARK}
              alt="VIREON Library"
              className="block w-[112px] h-auto object-contain"
              style={{ filter: "none" }}
              loading="eager"
              decoding="sync"
            />
          </div>
        </div>

        {/* ── Form content ──────────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col justify-center px-6 sm:px-8 lg:px-10 py-6 lg:py-10 relative">
          <div className="absolute -right-20 top-1/2 hidden h-64 w-64 -translate-y-1/2 rounded-full border border-emerald-900/[0.06] lg:block" aria-hidden="true" />
          <div className="absolute -right-8 top-1/2 hidden h-40 w-40 -translate-y-1/2 rounded-full border border-emerald-900/[0.06] lg:block" aria-hidden="true" />

          <div className="w-full max-w-[360px] mx-auto lg:mx-0 lg:max-w-[400px] lg:bg-white lg:shadow-[0_4px_40px_-12px_rgba(0,0,0,0.08)] lg:border lg:border-slate-100 lg:rounded-[28px] lg:p-9 relative">

            {/* Desktop form top edge decorative highlight */}
            <div className="hidden lg:block absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-t-[28px] opacity-80" />
            <div className="absolute right-6 top-6 hidden text-[8px] font-bold uppercase tracking-[0.24em] text-slate-300 lg:block" aria-hidden="true">
              Access / 01
            </div>

            {/* VIREON wordmark — desktop only */}
            <motion.div
              {...fadeUp(0, reduced)}
              className="hidden lg:flex items-center mb-10"
            >
              <img
                src={VIREON_WORDMARK}
                alt="VIREON Library"
                className="block w-[164px] h-auto object-contain"
                style={{ filter: "none" }}
                loading="eager"
                decoding="sync"
              />
            </motion.div>

            {/* Heading group with Privacy Mascot */}
            <motion.div {...fadeUp(0.04, reduced)} className="mb-7">
              <div className="flex justify-between items-start mb-2">
                <div
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-semibold mt-2 shadow-sm"
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

                <div className="relative mr-2 shrink-0 -mt-2 sm:mr-0 lg:mt-0">
                  <div
                    className="pointer-events-none absolute -inset-3 rounded-full bg-emerald-100/55 blur-xl"
                    aria-hidden="true"
                  />
                  <div
                    className="pointer-events-none absolute right-2 top-1 h-16 w-16 rounded-full border border-emerald-700/[0.10]"
                    aria-hidden="true"
                  />
                  <PrivacyBook
                    state={formState}
                    typingProgress={typingProgress}
                    hasError={Boolean(authError)}
                    isSubmitting={login.isPending}
                    className="relative z-10"
                  />
                </div>
              </div>

              <h1 className="text-[1.875rem] sm:text-[2.125rem] font-extrabold text-slate-900 tracking-[-0.025em] leading-[1.08] mb-3 mt-2 sm:mt-0">
                Selamat datang
                <br />
                kembali
              </h1>
              <p className="text-[13.5px] text-slate-500 leading-relaxed">
                Masuk untuk mengatur koleksi, melihat aktivitas, dan menjaga
                perjalanan membaca tetap rapi.
              </p>
            </motion.div>

            {/* Small interaction rail makes the form feel like an active access
                flow instead of a static white card. */}
            <motion.div
              layout
              {...fadeUp(0.07, reduced)}
              className="relative mb-5 flex items-center gap-3 overflow-hidden rounded-2xl border border-emerald-900/[0.08] bg-emerald-50/45 px-3.5 py-2.5"
              aria-live="polite"
            >
              <motion.div
                className="absolute inset-x-0 top-0 h-[2px] origin-left bg-gradient-to-r from-emerald-300 via-emerald-500 to-sky-300"
                animate={{ scaleX: accessStage === 2 ? 1 : 0.5 }}
                transition={reduced ? { duration: 0 } : { duration: 0.35, ease: EASE }}
                aria-hidden="true"
              />
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/80 text-emerald-700 shadow-sm ring-1 ring-emerald-900/[0.06]">
                <ShieldCheck className="h-4 w-4" strokeWidth={1.9} aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-emerald-800/65">
                  Akses Vireon
                </p>
                <motion.p
                  key={accessStatus}
                  initial={reduced ? false : { opacity: 0, y: 3 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`truncate text-[11px] font-semibold ${
                    authError ? "text-rose-600" : "text-slate-600"
                  }`}
                >
                  {accessStatus}
                </motion.p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5" aria-hidden="true">
                {[1, 2].map((step) => (
                  <motion.span
                    key={step}
                    className="h-1.5 rounded-full bg-emerald-500"
                    animate={{
                      width: step <= accessStage ? 16 : 6,
                      opacity: step <= accessStage ? 0.8 : 0.2,
                    }}
                    transition={reduced ? { duration: 0 } : { duration: 0.25 }}
                  />
                ))}
              </div>
            </motion.div>

            {/* ── Form ────────────────────────────────────────────────────── */}
            <motion.form
              {...fadeUp(0.1, reduced)}
              onSubmit={handleSubmit}
              className="space-y-4"
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
                <div className="relative">
                  <Mail
                    className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300 transition-colors duration-150 peer-focus:text-emerald-600/70"
                    aria-hidden="true"
                  />
                  <input
                    id="login-email"
                    ref={emailInputRef}
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      handleFieldChange();
                      syncEmailCaret(e.currentTarget);
                    }}
                    onFocus={(e) => {
                      setFormState("email");
                      syncEmailCaret(e.currentTarget);
                    }}
                    onSelect={(e) => syncEmailCaret(e.currentTarget)}
                    onKeyUp={(e) => syncEmailCaret(e.currentTarget)}
                    onBlur={handleBlur}
                    placeholder="nama@ruangbaca.id"
                    autoComplete="email"
                    required
                    aria-required="true"
                    aria-invalid={authError ? "true" : undefined}
                    className="peer h-11 w-full rounded-xl border border-slate-200/80 bg-[#fdfcf9] pl-10 pr-10 text-[14px] text-slate-900 shadow-inner placeholder:text-slate-400 transition-all duration-150 focus:border-emerald-400/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/10 lg:bg-slate-50/50"
                  />
                  <AnimatePresence>
                    {emailLooksValid && (
                      <motion.span
                        initial={{ opacity: 0, scale: 0.7 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.7 }}
                        transition={reduced ? { duration: 0 } : { duration: 0.16 }}
                        className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-600"
                        title="Format email valid"
                        aria-hidden="true"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
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
                  <KeyRound
                    className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300 transition-colors duration-150 peer-focus:text-emerald-600/70"
                    aria-hidden="true"
                  />
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      handleFieldChange();
                    }}
                    onFocus={() => setFormState(showPassword ? "password-visible" : "password-hidden")}
                    onBlur={handleBlur}
                    placeholder="Tulis password kamu"
                    autoComplete="current-password"
                    required
                    aria-required="true"
                    aria-invalid={authError ? "true" : undefined}
                    className="peer h-11 w-full rounded-xl border border-slate-200/80 bg-[#fdfcf9] pl-10 pr-[52px] text-[14px] text-slate-900 shadow-inner placeholder:text-slate-400 transition-all duration-150 focus:border-emerald-400/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/10 lg:bg-slate-50/50"
                  />
                  <AnimatePresence>
                    {password.length > 0 && (
                      <motion.span
                        initial={{ opacity: 0, scale: 0.7 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.7 }}
                        transition={reduced ? { duration: 0 } : { duration: 0.16 }}
                        className="pointer-events-none absolute right-11 top-1/2 -translate-y-1/2 text-emerald-600"
                        title="Password sudah diisi"
                        aria-hidden="true"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </motion.span>
                    )}
                  </AnimatePresence>
                  <button
                    type="button"
                    onPointerDown={(e) => e.preventDefault()} // Keeps focus correctly when clicked
                    onClick={() => {
                      const next = !showPassword;
                      setShowPassword(next);
                      setFormState(next ? "password-visible" : "password-hidden");
                    }}
                    onFocus={() => setFormState(showPassword ? "password-visible" : "password-hidden")}
                    onBlur={handleBlur}
                    className="absolute right-1 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors duration-150 rounded-lg hover:bg-slate-200/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
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
                    transition={{ duration: reduced ? 0 : 0.22, ease: "easeOut" }}
                    className="overflow-hidden"
                    role="alert"
                    aria-live="polite"
                  >
                    <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl bg-red-50 border border-red-100 shadow-sm">
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
                  disabled={!isSubmittable}
                  whileHover={reduced || !isSubmittable ? {} : { scale: 1.012 }}
                  whileTap={reduced || !isSubmittable ? {} : { scale: 0.982 }}
                  className="w-full h-11 rounded-xl text-white text-[14px] font-semibold flex items-center justify-center gap-2.5 transition-all duration-200 disabled:opacity-55 disabled:cursor-not-allowed relative overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-emerald-600"
                  style={{
                    background: "linear-gradient(135deg, hsl(161 52% 34%) 0%, hsl(161 52% 26%) 100%)",
                    boxShadow:
                      "0 3px 7px rgba(15, 23, 42, 0.18), 0 0 0 1px hsl(161 52% 44% / 0.4), inset 0 1px 0 rgb(255 255 255 / 0.16)",
                  }}
                  onMouseEnter={(e) => {
                    if (isSubmittable)
                      (e.currentTarget as HTMLButtonElement).style.background =
                        "linear-gradient(135deg, hsl(161 52% 39%) 0%, hsl(161 52% 30%) 100%)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background =
                      "linear-gradient(135deg, hsl(161 52% 34%) 0%, hsl(161 52% 26%) 100%)";
                  }}
                >
                  {!reduced && isSubmittable && !login.isPending && (
                    <motion.span
                      className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 skew-x-[-18deg] bg-white/15 blur-[1px]"
                      initial={{ x: "-120%" }}
                      animate={{ x: "420%" }}
                      transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 1.8, ease: "easeInOut" }}
                      aria-hidden="true"
                    />
                  )}
                  {login.isPending ? (
                    <>
                      <Loader2
                        className="w-4 h-4 animate-spin"
                        aria-hidden="true"
                      />
                      <span className="relative z-10">Memproses…</span>
                    </>
                  ) : (
                    <>
                      <span className="relative z-10">Masuk ke Sistem</span>
                      <ArrowRight className="relative z-10 w-4 h-4" aria-hidden="true" />
                    </>
                  )}
                </motion.button>
              </div>
            </motion.form>

            {/* Security note */}
            <motion.div {...fadeUp(0.18, reduced)} className="mt-5 flex items-start gap-2.5">
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
        <div className="relative px-6 sm:px-8 lg:px-10 py-5 border-t border-slate-100/80 flex items-center justify-between">
          <p className="text-[11.5px] text-slate-400">
            &copy; {new Date().getFullYear()} Vireon Library System
          </p>
          <p className="text-[10.5px] font-medium text-slate-400 uppercase tracking-widest">
            Reyhan Irza
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
            src={getAssetUrl('/library-bg.jpg')}
            alt=""
            className="w-full h-full object-cover"
            style={{ objectPosition: "center 30%" }}
            loading="eager"
            decoding="sync"
          />
          <div className="vireon-dark-line-field absolute inset-0 opacity-40 mix-blend-screen" />
          <div className="absolute -right-20 top-16 h-[420px] w-[420px] rounded-full border border-emerald-100/[0.10]" />
          <div className="absolute -right-2 top-32 h-[280px] w-[280px] rounded-full border border-emerald-100/[0.08]" />
          <div className="absolute left-10 top-20 hidden text-[clamp(4rem,8vw,8rem)] font-black leading-none tracking-[-0.08em] text-emerald-50/[0.06] xl:block">
            VIREON
          </div>
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
            <div className="mb-5 flex items-center gap-3 text-[9px] font-bold uppercase tracking-[0.24em] text-emerald-100/50">
              <span className="h-px w-8 bg-emerald-200/40" />
              Library workspace
            </div>
            {/* Floating chip — top right */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={reduced ? { duration: 0 } : { duration: 0.5, delay: 0.5, ease: EASE }}
              className="absolute -top-5 right-4 z-20 flex items-center gap-2 bg-white border border-slate-200/80 rounded-full px-3 py-1.5 shadow-[0_6px_24px_rgba(0,0,0,0.22),0_1px_3px_rgba(0,0,0,0.12)]"
            >
              <div
                className="w-1.5 h-1.5 rounded-full animate-pulse flex-shrink-0"
                style={{ background: "hsl(161 52% 44%)" }}
              />
              <span className="text-[11.5px] font-semibold text-slate-700">
                Pratinjau Dasbor
              </span>
            </motion.div>

            {/* Dashboard Preview */}
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={reduced ? { duration: 0 } : { duration: 0.7, delay: 0.12, ease: EASE }}
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
              transition={reduced ? { duration: 0 } : { duration: 0.5, delay: 0.62, ease: EASE }}
              className="absolute -bottom-5 left-4 z-20 flex items-center gap-2 bg-white border border-slate-200/80 rounded-full px-3 py-1.5 shadow-[0_6px_24px_rgba(0,0,0,0.22),0_1px_3px_rgba(0,0,0,0.12)]"
            >
              <Clock
                className="w-3 h-3 flex-shrink-0"
                style={{ color: "hsl(161 52% 44%)" }}
                aria-hidden="true"
              />
              <span className="text-[11.5px] font-semibold text-slate-700">
                Visualisasi Antarmuka
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
                  transition={
                    reduced
                      ? { duration: 0 }
                      : { duration: 0.4, delay: 0.55 + i * 0.07, ease: EASE }
                  }
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
            transition={reduced ? { duration: 0 } : { duration: 0.5, delay: 0.82 }}
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
