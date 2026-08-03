/**
 * VIREON — Landing Page
 *
 * Light-mode only. Inter font throughout.
 * Live statistics from Supabase — skeleton while loading, 0 when empty.
 * No fabricated data. No off-brand decorations.
 */

import { Link } from "wouter";
import { motion, useReducedMotion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { useEffect, useRef, useState, useCallback } from "react";
import {
  BookOpen,
  Users,
  ArrowLeftRight,
  BarChart3,
  Search,
  ShieldCheck,
  Zap,
  Layers,
  RefreshCw,
  ChevronRight,
  Menu,
  X,
  CheckCircle2,
  Database,
  TrendingUp,
  ArrowRight,
  LayoutDashboard,
  BookMarked,
  Clock,
  Activity,
} from "lucide-react";
import VIREON_LOGO from "@/assets/logo";
import { useLandingStats } from "@/hooks/api";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  return n.toLocaleString("id-ID");
}

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

// ─── Animation presets ────────────────────────────────────────────────────────

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

function fadeUp(delay = 0, reduced = false) {
  if (reduced) return {};
  return {
    initial: { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, delay, ease: EASE_OUT },
  };
}

function fadeUpView(delay = 0, reduced = false) {
  if (reduced) return {};
  return {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-48px" },
    transition: { duration: 0.5, delay, ease: EASE_OUT },
  };
}

// ─── Static data ──────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: BookOpen,
    num: "01",
    title: "Manajemen Koleksi",
    desc: "Tambah, edit, dan lacak seluruh koleksi buku dengan mudah. Lengkap dengan kategori, rak, ISBN, dan informasi pengarang.",
    span: "lg:col-span-2",
    accent: true,
  },
  {
    icon: Users,
    num: "02",
    title: "Data Anggota",
    desc: "Kelola data siswa dan anggota perpustakaan dalam satu tempat. Pantau riwayat peminjaman dan status denda setiap anggota.",
    span: "lg:col-span-1",
    accent: false,
  },
  {
    icon: ArrowLeftRight,
    num: "03",
    title: "Peminjaman & Pengembalian",
    desc: "Catat setiap transaksi dengan cepat dan akurat. Sistem otomatis menghitung denda keterlambatan sesuai kebijakan sekolah.",
    span: "lg:col-span-1",
    accent: false,
  },
  {
    icon: BarChart3,
    num: "04",
    title: "Laporan & Statistik",
    desc: "Pantau aktivitas perpustakaan melalui laporan lengkap dan visualisasi tren peminjaman bulanan yang mudah dibaca.",
    span: "lg:col-span-2",
    accent: false,
  },
  {
    icon: Search,
    num: "05",
    title: "Pencarian Cepat",
    desc: "Temukan buku, anggota, atau transaksi dalam hitungan detik dengan sistem pencarian yang responsif dan akurat.",
    span: "lg:col-span-1",
    accent: false,
  },
  {
    icon: ShieldCheck,
    num: "06",
    title: "Keamanan Terjamin",
    desc: "Data perpustakaan tersimpan aman dengan sistem kontrol akses berlapis berbasis peran dan enkripsi end-to-end.",
    span: "lg:col-span-1",
    accent: false,
  },
] as const;

const HOW_STEPS = [
  {
    icon: Database,
    num: "01",
    title: "Daftarkan Koleksi",
    desc: "Input buku, kategori, dan rak dengan form yang intuitif. ISBN dan data pengarang tersimpan secara terstruktur.",
  },
  {
    icon: ArrowLeftRight,
    num: "02",
    title: "Catat Transaksi",
    desc: "Proses peminjaman dan pengembalian dalam hitungan detik. Denda terlambat terhitung secara otomatis.",
  },
  {
    icon: TrendingUp,
    num: "03",
    title: "Pantau & Evaluasi",
    desc: "Lihat laporan lengkap dan grafik statistik untuk mengambil keputusan berbasis data yang akurat.",
  },
] as const;

const MARQUEE_ITEMS = [
  "Manajemen Koleksi",
  "Peminjaman Otomatis",
  "Laporan Real-time",
  "Pencarian Instan",
  "Kontrol Akses",
  "Sinkronisasi Data",
  "Manajemen Anggota",
  "Statistik Bulanan",
  "Enkripsi Data",
  "Antarmuka Intuitif",
  "Denda Otomatis",
];

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Sk({ w = "w-12", h = "h-5" }: { w?: string; h?: string }) {
  return (
    <div
      className={`${w} ${h} rounded bg-slate-200 animate-pulse`}
      aria-hidden="true"
    />
  );
}

// ─── Navigation ───────────────────────────────────────────────────────────────

function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 16);
    handler();
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [mobileOpen]);

  const handleScroll = useCallback((id: string) => {
    setMobileOpen(false);
    setTimeout(() => scrollTo(id), 50);
  }, []);

  const navItem = scrolled
    ? "text-[13.5px] font-medium text-slate-500 hover:text-slate-900 px-3.5 py-2 rounded-lg hover:bg-slate-50 transition-colors duration-150"
    : "text-[13.5px] font-medium text-white/75 hover:text-white px-3.5 py-2 rounded-lg hover:bg-white/10 transition-colors duration-150";

  return (
    <>
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white/[0.97] backdrop-blur-xl border-b border-slate-200/70 shadow-[0_1px_0_0_rgba(0,0,0,0.04),0_4px_16px_-2px_rgba(0,0,0,0.04)]"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[60px] flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className={`w-7 h-7 rounded-lg overflow-hidden shrink-0 ring-1 transition-all duration-300 ${scrolled ? "ring-slate-900/8" : "ring-white/20"}`}>
              <img
                src={VIREON_LOGO}
                alt="VIREON"
                className="w-full h-full object-cover"
                loading="eager"
                decoding="sync"
              />
            </div>
            <div className="leading-none">
              <span className={`text-[13px] font-bold tracking-[0.05em] transition-colors duration-300 ${scrolled ? "text-slate-900" : "text-white"}`}>
                VIREON
              </span>
              <span className={`hidden sm:block text-[9.5px] font-medium uppercase tracking-[0.14em] mt-0.5 transition-colors duration-300 ${scrolled ? "text-slate-400" : "text-white/50"}`}>
                Library System
              </span>
            </div>
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-0.5" aria-label="Navigasi utama">
            {[
              { label: "Cara Kerja", id: "how" },
              { label: "Fitur", id: "features" },
              { label: "Tentang", id: "about" },
            ].map(({ label, id }) => (
              <button
                key={id}
                onClick={() => handleScroll(id)}
                className={navItem}
              >
                {label}
              </button>
            ))}
          </nav>

          {/* CTAs */}
          <div className="hidden md:flex items-center gap-2">
            <Link
              href="/login"
              className={navItem}
            >
              Masuk
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[hsl(161_52%_38%)] hover:bg-[hsl(161_52%_44%)] text-white text-[13.5px] font-semibold rounded-lg transition-all duration-150 active:scale-[0.98] shadow-[0_1px_3px_rgba(0,0,0,0.25)]"
            >
              Mulai Sekarang
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className={`md:hidden p-2 rounded-lg transition-colors ${scrolled ? "text-slate-500 hover:text-slate-900 hover:bg-slate-50" : "text-white/80 hover:text-white hover:bg-white/10"}`}
            aria-label={mobileOpen ? "Tutup menu" : "Buka menu"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={reduced ? {} : { opacity: 0, y: -6 }}
            animate={reduced ? {} : { opacity: 1, y: 0 }}
            exit={reduced ? {} : { opacity: 0, y: -4 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="fixed top-[60px] inset-x-0 z-40 bg-white/[0.98] backdrop-blur-xl border-b border-slate-200 shadow-xl md:hidden"
            role="dialog"
            aria-modal="true"
          >
            <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col gap-0.5">
              {[
                { label: "Cara Kerja", id: "how" },
                { label: "Fitur", id: "features" },
                { label: "Tentang", id: "about" },
              ].map(({ label, id }) => (
                <button
                  key={id}
                  onClick={() => handleScroll(id)}
                  className="text-left text-[15px] font-medium text-slate-700 px-3 py-3.5 rounded-xl hover:bg-slate-50 transition-colors min-h-[44px] flex items-center"
                >
                  {label}
                </button>
              ))}
              <div className="border-t border-slate-100 mt-1 pt-3 flex flex-col gap-2">
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="text-[15px] font-medium text-slate-700 px-3 py-3.5 rounded-xl hover:bg-slate-50 transition-colors min-h-[44px] flex items-center"
                >
                  Masuk
                </Link>
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center gap-1.5 text-[15px] font-semibold bg-[hsl(161_52%_26%)] text-white px-4 py-3.5 rounded-xl hover:bg-[hsl(161_52%_22%)] transition-all min-h-[44px]"
                >
                  Mulai Sekarang
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Dashboard Preview ────────────────────────────────────────────────────────
// Designed as a realistic app mockup. Replace inner content with
// a <video> or <img> when a promotional asset is available.

function DashboardPreview({
  stats,
  loading,
}: {
  stats?: { totalBooks: number; totalMembers: number; totalBorrowings: number; availableBooks: number };
  loading: boolean;
}) {
  const cards = [
    { label: "Total Buku", value: stats?.totalBooks, icon: BookMarked, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Anggota", value: stats?.totalMembers, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Dipinjam", value: stats?.totalBorrowings, icon: ArrowLeftRight, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Tersedia", value: stats?.availableBooks, icon: CheckCircle2, color: "text-slate-500", bg: "bg-slate-50" },
  ];

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", active: true },
    { icon: BookOpen, label: "Buku", active: false },
    { icon: ArrowLeftRight, label: "Peminjaman", active: false },
    { icon: Users, label: "Anggota", active: false },
    { icon: BarChart3, label: "Laporan", active: false },
  ];

  // Static chart bars (7 months) — purely decorative, shows product context
  const chartBars = [22, 38, 29, 52, 44, 60, 47];
  const maxBar = Math.max(...chartBars);

  return (
    <div
      className="w-full rounded-2xl overflow-hidden border border-slate-200/80"
      style={{
        boxShadow:
          "0 0 0 1px rgba(0,0,0,0.04), 0 24px 64px -12px rgba(0,0,0,0.14), 0 8px 24px -8px rgba(0,0,0,0.08)",
      }}
    >
      {/* Browser chrome */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#f5f5f7] border-b border-slate-200/80">
        <div className="flex items-center gap-1.5" aria-hidden="true">
          <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
          <div className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
          <div className="w-3 h-3 rounded-full bg-[#28C840]" />
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-white rounded-md border border-slate-200/60 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
          <div className="w-1.5 h-1.5 rounded-full bg-slate-300" aria-hidden="true" />
          <span className="text-[11px] text-slate-400 font-mono">app.vireon.id/dashboard</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600">
          <Activity className="w-3 h-3" aria-hidden="true" />
          Admin
        </div>
      </div>

      {/* App layout */}
      <div className="flex" style={{ background: "#fafafa" }}>
        {/* Sidebar */}
        <div className="w-[108px] shrink-0 border-r border-slate-200/60 bg-white flex flex-col py-3">
          {/* Brand mark */}
          <div className="flex items-center gap-1.5 px-3 mb-3">
            <div
              className="w-5 h-5 rounded-[5px] flex items-center justify-center shrink-0"
              style={{ background: "hsl(161 52% 26%)" }}
            >
              <BookOpen className="w-2.5 h-2.5 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-[10px] font-extrabold tracking-[0.06em] text-slate-900">
              VIREON
            </span>
          </div>

          {/* Nav items */}
          <div className="flex flex-col gap-0.5 px-1.5">
            {navItems.map(({ icon: Icon, label, active }) => (
              <div
                key={label}
                className={`flex items-center gap-1.5 px-2 py-1.5 rounded-[6px] ${
                  active
                    ? "bg-[hsl(161_52%_26%/0.10)] text-[hsl(161_52%_26%)]"
                    : "text-slate-400"
                }`}
              >
                <Icon
                  className="w-2.5 h-2.5 shrink-0"
                  strokeWidth={active ? 2.25 : 1.75}
                />
                <span className="text-[9px] font-medium leading-none">{label}</span>
              </div>
            ))}
          </div>

          {/* Bottom divider + profile */}
          <div className="mt-auto px-2.5 pt-2 border-t border-slate-100 mx-2">
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shrink-0" />
              <div>
                <div className="text-[8px] font-semibold text-slate-700 leading-none">Admin</div>
                <div className="text-[7px] text-slate-400 mt-0.5 leading-none">Pustakawan</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0 p-3.5">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[12px] font-bold text-slate-900 leading-tight">Dashboard</p>
              <p className="text-[9.5px] text-slate-400 mt-0.5">Perpustakaan SMKN 2 Lubuk Basung</p>
            </div>
            <div
              className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold"
              style={{
                background: "hsl(161 52% 26% / 0.08)",
                border: "1px solid hsl(161 52% 26% / 0.2)",
                color: "hsl(161 52% 26%)",
              }}
            >
              <div className="w-1 h-1 rounded-full bg-current animate-pulse" />
              Live
            </div>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-4 gap-2 mb-3">
            {cards.map(({ label, value, icon: Icon, color, bg }) => (
              <div
                key={label}
                className="bg-white rounded-lg border border-slate-100 p-2 shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
              >
                <div className={`w-5 h-5 rounded-[5px] ${bg} flex items-center justify-center mb-1.5`}>
                  <Icon className={`w-2.5 h-2.5 ${color}`} strokeWidth={2} />
                </div>
                {loading ? (
                  <div className="h-3.5 w-8 bg-slate-200 rounded animate-pulse mb-0.5" />
                ) : (
                  <p className="text-[13px] font-extrabold text-slate-900 tabular-nums leading-none">
                    {fmt(value ?? 0)}
                  </p>
                )}
                <p className="text-[8px] text-slate-400 font-medium mt-0.5 leading-tight">{label}</p>
              </div>
            ))}
          </div>

          {/* Mini chart */}
          <div className="bg-white rounded-lg border border-slate-100 p-2.5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[9.5px] font-semibold text-slate-700">Tren Peminjaman</p>
              <span className="text-[8px] text-slate-400">7 bulan terakhir</span>
            </div>
            <div className="flex items-end gap-1 h-9">
              {chartBars.map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-sm transition-all"
                  style={{
                    height: `${(h / maxBar) * 100}%`,
                    background:
                      i === chartBars.length - 1
                        ? "hsl(161 52% 30%)"
                        : "hsl(161 52% 30% / 0.25)",
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function HeroSection() {
  const { data: stats, isLoading } = useLandingStats();
  const reduced = useReducedMotion();
  const { scrollY } = useScroll();
  const bgY = useTransform(scrollY, [0, 700], ["0%", "18%"]);

  return (
    <section className="relative min-h-[92vh] flex items-center pt-[60px] overflow-hidden">

      {/* ── Library photo background with parallax ── */}
      <motion.div
        className="absolute inset-0 scale-[1.12] pointer-events-none select-none"
        style={{ y: reduced ? undefined : bgY }}
        aria-hidden="true"
      >
        <img
          src="/library-bg.jpg"
          alt=""
          className="w-full h-full object-cover"
          style={{ objectPosition: "center 35%" }}
          loading="eager"
          decoding="sync"
          fetchPriority="high"
        />
      </motion.div>

      {/* ── Dark emerald overlay — lets warm library tones bleed through ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(135deg, hsl(161 62% 5% / 0.91) 0%, hsl(161 48% 9% / 0.82) 55%, hsl(161 38% 8% / 0.86) 100%)",
        }}
        aria-hidden="true"
      />

      {/* ── Top vignette ── */}
      <div
        className="absolute inset-x-0 top-0 h-36 pointer-events-none"
        style={{ background: "linear-gradient(to bottom, hsl(161 62% 4% / 0.55), transparent)" }}
        aria-hidden="true"
      />

      {/* ── Content ── */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-16 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-[5fr_7fr] gap-12 lg:gap-16 items-center">

          {/* Left — copy */}
          <div className="max-w-lg">

            {/* Badge */}
            <motion.div {...fadeUp(0, reduced ?? false)}>
              <div
                className="inline-flex items-center gap-2 text-[11.5px] font-semibold px-3 py-1.5 rounded-full mb-7"
                style={{
                  background: "hsl(161 52% 68% / 0.13)",
                  border: "1px solid hsl(161 52% 68% / 0.30)",
                  color: "hsl(161 52% 78%)",
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full animate-pulse"
                  style={{ background: "hsl(161 52% 65%)" }}
                  aria-hidden="true"
                />
                Sistem Manajemen Perpustakaan
              </div>
            </motion.div>

            {/* Headline */}
            <motion.h1
              {...fadeUp(0.06, reduced ?? false)}
              className="text-[2.75rem] sm:text-5xl lg:text-[3.25rem] xl:text-[3.75rem] font-extrabold text-white leading-[1.04] tracking-[-0.03em]"
            >
              Kelola Perpustakaan
              <br />
              Sekolah dengan
              <br />
              <span
                className="inline-block"
                style={{
                  background: "linear-gradient(135deg, hsl(161 68% 58%) 0%, hsl(150 80% 70%) 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Lebih Cerdas
              </span>
            </motion.h1>

            {/* Sub */}
            <motion.p
              {...fadeUp(0.14, reduced ?? false)}
              className="mt-6 text-[1.0625rem] text-white/62 leading-[1.65] max-w-[420px]"
            >
              VIREON menyederhanakan operasional perpustakaan — dari pengelolaan
              koleksi, transaksi peminjaman, hingga laporan analitik — dalam satu
              platform yang bersih dan andal.
            </motion.p>

            {/* CTAs */}
            <motion.div
              {...fadeUp(0.22, reduced ?? false)}
              className="mt-8 flex flex-wrap items-center gap-3"
            >
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-5 py-3 text-[14px] font-semibold text-white rounded-[10px] transition-all duration-150 active:scale-[0.98] min-h-[44px]"
                style={{
                  background: "hsl(161 52% 38%)",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.35), 0 0 0 1px hsl(161 52% 55% / 0.35)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.background = "hsl(161 52% 44%)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.background = "hsl(161 52% 38%)";
                }}
              >
                Masuk ke Sistem
                <ChevronRight className="w-4 h-4" />
              </Link>
              <button
                onClick={() => scrollTo("how")}
                className="inline-flex items-center gap-2 px-5 py-3 text-[14px] font-medium text-white/80 bg-white/10 border border-white/20 rounded-[10px] hover:bg-white/16 hover:border-white/32 hover:text-white transition-all duration-150 active:scale-[0.98] min-h-[44px] backdrop-blur-sm"
              >
                Lihat Cara Kerja
              </button>
            </motion.div>

            {/* Trust signals */}
            <motion.div
              {...fadeUp(0.3, reduced ?? false)}
              className="mt-8 flex flex-wrap gap-x-5 gap-y-2"
            >
              {[
                "Tidak perlu instalasi",
                "Data aman & terenkripsi",
                "Pembaruan otomatis",
              ].map((item) => (
                <div key={item} className="flex items-center gap-1.5 text-[12.5px] text-white/48">
                  <CheckCircle2
                    className="w-3.5 h-3.5 shrink-0"
                    style={{ color: "hsl(161 52% 62%)" }}
                  />
                  {item}
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right — dashboard preview */}
          <motion.div
            {...(reduced
              ? {}
              : {
                  initial: { opacity: 0, x: 28, scale: 0.97 },
                  animate: { opacity: 1, x: 0, scale: 1 },
                  transition: { duration: 0.7, delay: 0.14, ease: EASE_OUT },
                })}
            className="relative w-full"
          >
            {/* Ambient glow behind the preview card */}
            <div
              className="absolute -inset-12 pointer-events-none"
              style={{
                background:
                  "radial-gradient(ellipse 75% 65% at 50% 50%, hsl(161 52% 55% / 0.18) 0%, transparent 70%)",
              }}
              aria-hidden="true"
            />

            {/* Floating chip — top */}
            <motion.div
              {...(reduced
                ? {}
                : {
                    initial: { opacity: 0, y: 12 },
                    animate: { opacity: 1, y: 0 },
                    transition: { duration: 0.5, delay: 0.58, ease: EASE_OUT },
                  })}
              className="absolute -top-4 right-6 z-10 flex items-center gap-2 bg-white border border-slate-200/80 rounded-full px-3 py-1.5 shadow-[0_6px_20px_rgba(0,0,0,0.14),0_1px_3px_rgba(0,0,0,0.08)]"
              aria-hidden="true"
            >
              <div
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ background: "hsl(161 52% 44%)" }}
              />
              <span className="text-[11.5px] font-semibold text-slate-700">Sistem Aktif</span>
            </motion.div>

            {/* Floating chip — bottom */}
            <motion.div
              {...(reduced
                ? {}
                : {
                    initial: { opacity: 0, y: -12 },
                    animate: { opacity: 1, y: 0 },
                    transition: { duration: 0.5, delay: 0.68, ease: EASE_OUT },
                  })}
              className="absolute -bottom-4 left-6 z-10 flex items-center gap-2 bg-white border border-slate-200/80 rounded-full px-3 py-1.5 shadow-[0_6px_20px_rgba(0,0,0,0.14),0_1px_3px_rgba(0,0,0,0.08)]"
              aria-hidden="true"
            >
              <Clock
                className="w-3 h-3"
                style={{ color: "hsl(161 52% 44%)" }}
              />
              <span className="text-[11.5px] font-semibold text-slate-700">Diperbarui real-time</span>
            </motion.div>

            <DashboardPreview stats={stats} loading={isLoading} />
          </motion.div>
        </div>
      </div>

      {/* ── Bottom fade to white ── */}
      <div
        className="absolute inset-x-0 bottom-0 h-36 pointer-events-none"
        style={{ background: "linear-gradient(to bottom, transparent, white)" }}
        aria-hidden="true"
      />
    </section>
  );
}

// ─── Marquee Ticker ───────────────────────────────────────────────────────────

function MarqueeTicker() {
  const doubled = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS];
  const reduced = useReducedMotion();

  return (
    <div
      className="relative py-3.5 overflow-hidden border-y border-slate-200/60"
      style={{ background: "hsl(161 52% 26%)" }}
      aria-hidden="true"
    >
      {/* Fades */}
      <div
        className="absolute left-0 top-0 bottom-0 w-24 z-10 pointer-events-none"
        style={{ background: "linear-gradient(to right, hsl(161 52% 26%), transparent)" }}
      />
      <div
        className="absolute right-0 top-0 bottom-0 w-24 z-10 pointer-events-none"
        style={{ background: "linear-gradient(to left, hsl(161 52% 26%), transparent)" }}
      />

      <motion.div
        animate={reduced ? {} : { x: ["0%", "-50%"] }}
        transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
        className="flex items-center whitespace-nowrap"
      >
        {doubled.map((item, i) => (
          <div key={i} className="flex items-center gap-5 px-5">
            <span className="text-[11.5px] font-semibold text-white/70 tracking-[0.06em] uppercase">
              {item}
            </span>
            <div
              className="w-[3px] h-[3px] rounded-full shrink-0"
              style={{ background: "rgba(255,255,255,0.35)" }}
            />
          </div>
        ))}
      </motion.div>
    </div>
  );
}

// ─── Stats ────────────────────────────────────────────────────────────────────

function StatsSection() {
  const { data: stats, isLoading } = useLandingStats();
  const reduced = useReducedMotion();

  const items = [
    { label: "Total Koleksi Buku", value: stats?.totalBooks, icon: BookMarked },
    { label: "Anggota Terdaftar", value: stats?.totalMembers, icon: Users },
    { label: "Total Peminjaman", value: stats?.totalBorrowings, icon: ArrowLeftRight },
    { label: "Buku Tersedia", value: stats?.availableBooks, icon: CheckCircle2 },
  ];

  return (
    <section className="border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-slate-100">
          {items.map(({ label, value, icon: Icon }, i) => (
            <motion.div
              key={label}
              {...fadeUpView(i * 0.07, reduced ?? false)}
              className="group relative py-9 px-6 lg:px-8"
            >
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
                style={{ background: "hsl(161 52% 26% / 0.025)" }}
              />
              <div className="relative">
                <Icon
                  className="w-4 h-4 mb-3"
                  strokeWidth={1.75}
                  style={{ color: "hsl(161 52% 38%)" }}
                />
                {isLoading ? (
                  <Sk w="w-16" h="h-8" />
                ) : (
                  <p className="text-[2rem] font-extrabold text-slate-900 tabular-nums tracking-tight leading-none">
                    {fmt(value ?? 0)}
                    {(value ?? 0) > 0 && (
                      <span
                        className="text-base font-bold ml-0.5"
                        style={{ color: "hsl(161 52% 38%)" }}
                      >
                        +
                      </span>
                    )}
                  </p>
                )}
                <p className="mt-2 text-[13px] text-slate-500 font-medium">{label}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── How It Works ─────────────────────────────────────────────────────────────

function HowItWorksSection() {
  const reduced = useReducedMotion();

  return (
    <section
      id="how"
      className="relative py-24 sm:py-32 overflow-hidden"
      style={{ background: "#f8f9fa" }}
    >
      {/* Subtle grid */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <svg className="absolute inset-0 w-full h-full opacity-[0.022]">
          <defs>
            <pattern id="how-grid" x="0" y="0" width="48" height="48" patternUnits="userSpaceOnUse">
              <path
                d="M 48 0 L 0 0 0 48"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.5"
                className="text-slate-900"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#how-grid)" />
        </svg>
        {/* Radial accent */}
        <div
          className="absolute top-0 right-0 w-[500px] h-[500px]"
          style={{
            background:
              "radial-gradient(ellipse at 100% 0%, hsl(161 52% 30% / 0.06) 0%, transparent 60%)",
          }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          {...fadeUpView(0, reduced ?? false)}
          className="max-w-xl mb-16"
        >
          <p
            className="text-[11.5px] font-bold uppercase tracking-[0.1em] mb-3"
            style={{ color: "hsl(161 52% 32%)" }}
          >
            Cara Kerja
          </p>
          <h2 className="text-[2rem] sm:text-[2.5rem] font-extrabold text-slate-900 tracking-[-0.025em] leading-[1.1]">
            Mulai Digunakan dalam
            <br />
            Tiga Langkah
          </h2>
          <p className="mt-4 text-[15px] text-slate-500 leading-relaxed">
            Tidak perlu pelatihan teknis. VIREON dirancang agar langsung bisa
            digunakan oleh pengelola perpustakaan sekolah mana pun.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 relative">
          {/* Connector (desktop) */}
          <div
            className="hidden md:block absolute top-[26px] left-[calc(33.33%_-_12px)] right-[calc(33.33%_-_12px)] h-[1px]"
            aria-hidden="true"
            style={{
              background:
                "linear-gradient(to right, transparent, hsl(161 52% 36% / 0.35) 25%, hsl(161 52% 36% / 0.35) 75%, transparent)",
            }}
          />

          {HOW_STEPS.map(({ icon: Icon, num, title, desc }, i) => (
            <motion.div
              key={title}
              {...fadeUpView(i * 0.12, reduced ?? false)}
              className="flex flex-col"
            >
              <div className="flex items-center gap-4 mb-5">
                <div
                  className="w-[52px] h-[52px] rounded-2xl flex items-center justify-center shrink-0 relative"
                  style={{
                    background: "white",
                    border: "1.5px solid hsl(161 52% 36% / 0.25)",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 0 0 4px hsl(161 52% 36% / 0.06)",
                  }}
                >
                  <Icon
                    className="w-5 h-5"
                    strokeWidth={1.75}
                    style={{ color: "hsl(161 52% 30%)" }}
                  />
                  <div
                    className="absolute -top-2 -right-2 w-[18px] h-[18px] rounded-full flex items-center justify-center"
                    style={{ background: "hsl(161 52% 26%)" }}
                  >
                    <span className="text-[9px] font-bold text-white">{i + 1}</span>
                  </div>
                </div>
                <span
                  className="text-[44px] font-black leading-none tracking-[-0.06em] select-none"
                  style={{ color: "hsl(161 52% 26% / 0.1)" }}
                  aria-hidden="true"
                >
                  {num}
                </span>
              </div>
              <h3 className="text-[16px] font-bold text-slate-900 mb-2 tracking-tight">{title}</h3>
              <p className="text-[14px] text-slate-500 leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          {...fadeUpView(0.36, reduced ?? false)}
          className="mt-16 flex justify-start"
        >
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-[13.5px] font-semibold group"
            style={{ color: "hsl(161 52% 26%)" }}
          >
            Mulai sekarang
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-150" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Features ─────────────────────────────────────────────────────────────────
// Bento grid: alternating wide/narrow cards for visual variety.

function FeaturesSection() {
  const reduced = useReducedMotion();

  return (
    <section id="features" className="relative py-24 sm:py-32 bg-white overflow-hidden">
      {/* Decorative radial */}
      <div
        className="absolute -top-24 left-1/2 -translate-x-1/2 w-[800px] h-[600px] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, hsl(161 52% 30% / 0.05) 0%, transparent 60%)",
        }}
        aria-hidden="true"
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          {...fadeUpView(0, reduced ?? false)}
          className="max-w-xl mb-14"
        >
          <p
            className="text-[11.5px] font-bold uppercase tracking-[0.1em] mb-3"
            style={{ color: "hsl(161 52% 32%)" }}
          >
            Fitur Lengkap
          </p>
          <h2 className="text-[2rem] sm:text-[2.5rem] font-extrabold text-slate-900 tracking-[-0.025em] leading-[1.1]">
            Semua yang Anda Butuhkan
            <br />
            dalam Satu Platform
          </h2>
          <p className="mt-4 text-[15px] text-slate-500 leading-relaxed">
            VIREON mencakup seluruh siklus operasional perpustakaan sekolah — dari
            pengelolaan koleksi hingga pelaporan akhir tahun.
          </p>
        </motion.div>

        {/* Bento grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
          {FEATURES.map((feature, i) => {
            const Icon = feature.icon;
            const isWide = feature.span === "lg:col-span-2";

            return (
              <motion.div
                key={feature.title}
                {...(reduced
                  ? {}
                  : {
                      ...fadeUpView(i * 0.06),
                      whileHover: { y: -3, transition: { duration: 0.18, ease: "easeOut" } },
                    })}
                className={`group relative rounded-2xl p-6 border overflow-hidden cursor-default ${
                  feature.accent
                    ? "border-transparent"
                    : "border-slate-200/70 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
                } hover:shadow-[0_8px_28px_rgba(0,0,0,0.08)] hover:border-[hsl(161_52%_36%/0.3)] transition-all duration-300 ${feature.span}`}
                style={
                  feature.accent
                    ? {
                        background:
                          "linear-gradient(140deg, hsl(161 52% 26% / 0.06) 0%, hsl(161 52% 26% / 0.02) 100%)",
                        border: "1px solid hsl(161 52% 36% / 0.18)",
                      }
                    : {}
                }
              >
                {/* Top accent line on hover */}
                <div
                  className="absolute inset-x-0 top-0 h-[1.5px] opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  style={{
                    background:
                      "linear-gradient(to right, transparent, hsl(161 52% 36% / 0.6) 40%, hsl(161 52% 36% / 0.6) 60%, transparent)",
                  }}
                  aria-hidden="true"
                />

                {/* Large decorative num */}
                <div
                  className="absolute top-4 right-5 text-[36px] font-black leading-none select-none opacity-[0.07] tracking-[-0.05em]"
                  style={{ color: "hsl(161 52% 26%)" }}
                  aria-hidden="true"
                >
                  {feature.num}
                </div>

                {/* Icon */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-5 shrink-0"
                  style={{
                    background: "hsl(161 52% 26% / 0.09)",
                    border: "1px solid hsl(161 52% 36% / 0.18)",
                  }}
                >
                  <Icon
                    className="w-[18px] h-[18px]"
                    strokeWidth={1.75}
                    style={{ color: "hsl(161 52% 28%)" }}
                  />
                </div>

                <h3 className="text-[15px] font-bold text-slate-900 mb-2 tracking-tight">
                  {feature.title}
                </h3>
                <p className="text-[13.5px] text-slate-500 leading-relaxed">
                  {feature.desc}
                </p>

                {/* Wide card extra indicator */}
                {isWide && (
                  <div className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-1.5">
                    <span
                      className="text-[12px] font-semibold"
                      style={{ color: "hsl(161 52% 30%)" }}
                    >
                      Lihat demo
                    </span>
                    <ArrowRight
                      className="w-3 h-3 group-hover:translate-x-0.5 transition-transform duration-150"
                      style={{ color: "hsl(161 52% 30%)" }}
                    />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── About / Benefits ─────────────────────────────────────────────────────────

function AboutSection() {
  const reduced = useReducedMotion();

  const points = [
    {
      icon: Zap,
      title: "Dirancang untuk Kecepatan",
      desc: "Alur kerja yang meminimalkan langkah. Dari input buku hingga cetak laporan — semua dalam hitungan detik.",
    },
    {
      icon: Layers,
      title: "Terintegrasi Penuh",
      desc: "Semua modul terhubung. Perubahan di satu bagian langsung tercermin di seluruh sistem secara otomatis.",
    },
    {
      icon: RefreshCw,
      title: "Data Selalu Terkini",
      desc: "Sinkronisasi real-time memastikan informasi yang Anda lihat selalu mencerminkan kondisi perpustakaan terkini.",
    },
  ];

  return (
    <section
      id="about"
      className="relative py-24 sm:py-32 overflow-hidden"
      style={{ background: "#f8f9fa" }}
    >
      {/* Top border accent */}
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{
          background:
            "linear-gradient(to right, transparent, hsl(161 52% 36% / 0.25) 40%, hsl(161 52% 36% / 0.25) 60%, transparent)",
        }}
        aria-hidden="true"
      />

      {/* Radial accent */}
      <div
        className="absolute -left-32 top-1/2 -translate-y-1/2 w-[500px] h-[500px] pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, hsl(161 52% 30% / 0.06) 0%, transparent 65%)",
        }}
        aria-hidden="true"
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">

          {/* Left — text */}
          <motion.div {...fadeUpView(0, reduced ?? false)}>
            <p
              className="text-[11.5px] font-bold uppercase tracking-[0.1em] mb-3"
              style={{ color: "hsl(161 52% 32%)" }}
            >
              Mengapa VIREON
            </p>
            <h2 className="text-[2rem] sm:text-[2.5rem] font-extrabold text-slate-900 tracking-[-0.025em] leading-[1.1] mb-5">
              Dirancang untuk
              <br />
              Kemudahan Sehari-hari
            </h2>
            <p className="text-[15px] text-slate-500 leading-relaxed mb-8">
              Kami memahami tantangan pengelola perpustakaan sekolah. VIREON hadir
              sebagai solusi yang sederhana, andal, dan tidak memerlukan keahlian
              teknis khusus.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-5 py-3 text-[14px] font-semibold text-white rounded-[10px] transition-all duration-150 active:scale-[0.98] min-h-[44px]"
              style={{
                background: "hsl(161 52% 26%)",
                boxShadow: "0 1px 3px rgba(0,0,0,0.2), 0 0 0 1px hsl(161 52% 20% / 0.5)",
              }}
            >
              Coba Sekarang
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>

          {/* Right — benefit cards */}
          <div className="space-y-3.5">
            {points.map(({ icon: Icon, title, desc }, i) => (
              <motion.div
                key={title}
                {...(reduced
                  ? {}
                  : {
                      ...fadeUpView(i * 0.1),
                      whileHover: { x: 3, transition: { duration: 0.18 } },
                    })}
                className="group flex items-start gap-4 p-5 bg-white rounded-2xl border border-slate-200/70 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.07)] hover:border-[hsl(161_52%_36%/0.25)] transition-all duration-200"
              >
                <div
                  className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center mt-0.5"
                  style={{
                    background: "hsl(161 52% 26% / 0.08)",
                    border: "1px solid hsl(161 52% 36% / 0.2)",
                  }}
                >
                  <Icon
                    className="w-[18px] h-[18px]"
                    strokeWidth={1.75}
                    style={{ color: "hsl(161 52% 28%)" }}
                  />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-slate-900 mb-1.5 tracking-tight">{title}</h3>
                  <p className="text-[13.5px] text-slate-500 leading-relaxed">{desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── CTA ──────────────────────────────────────────────────────────────────────

function CTASection() {
  const reduced = useReducedMotion();

  return (
    <section
      className="relative py-24 sm:py-32 overflow-hidden"
      style={{ background: "hsl(220 40% 6%)" }}
    >
      {/* Background layers */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        {/* Grid */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.03]">
          <defs>
            <pattern id="cta-grid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#cta-grid)" />
        </svg>

        {/* Left orb */}
        <div
          className="absolute -left-32 top-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
          style={{ background: "radial-gradient(circle, hsl(161 52% 36% / 0.22) 0%, transparent 60%)" }}
        />
        {/* Right orb */}
        <div
          className="absolute -right-32 top-1/2 -translate-y-1/2 w-[480px] h-[480px] rounded-full"
          style={{ background: "radial-gradient(circle, hsl(161 52% 36% / 0.14) 0%, transparent 65%)" }}
        />

        {/* Top separator */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        {/* Bottom separator */}
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          {...fadeUpView(0, reduced ?? false)}
          className="max-w-2xl mx-auto text-center"
        >
          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-[0.08em] mb-8"
            style={{
              background: "hsl(161 52% 36% / 0.14)",
              border: "1px solid hsl(161 52% 50% / 0.25)",
              color: "hsl(161 52% 65%)",
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ background: "hsl(161 52% 60%)" }}
            />
            Siap Digunakan Sekarang
          </div>

          <h2 className="text-[2.5rem] sm:text-[3rem] lg:text-[3.5rem] font-extrabold text-white tracking-[-0.03em] leading-[1.05] mb-5">
            Siap Mengubah Cara
            <br />
            Mengelola Perpustakaan?
          </h2>
          <p className="text-[15px] text-white/50 leading-relaxed mb-10 max-w-lg mx-auto">
            Tidak perlu instalasi rumit, tidak perlu konfigurasi panjang — cukup
            masuk dan mulai bekerja.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-white text-slate-900 text-[14px] font-semibold rounded-[10px] hover:bg-slate-50 active:scale-[0.98] transition-all shadow-[0_0_0_1px_rgba(255,255,255,0.1)] min-h-[44px]"
            >
              Masuk ke VIREON
              <ChevronRight className="w-4 h-4" />
            </Link>
            <button
              onClick={() => scrollTo("features")}
              className="inline-flex items-center gap-2 px-6 py-3.5 text-[14px] font-medium text-white/60 border border-white/10 rounded-[10px] hover:border-white/20 hover:text-white/80 active:scale-[0.98] transition-all min-h-[44px]"
            >
              Pelajari Fitur
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function LandingFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-14">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">

          {/* Brand */}
          <div className="md:col-span-5">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-7 h-7 rounded-lg overflow-hidden shrink-0 ring-1 ring-slate-200/70">
                <img
                  src={VIREON_LOGO}
                  alt="VIREON"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="leading-none">
                <div className="text-[13px] font-bold text-slate-900 tracking-[0.05em]">
                  VIREON
                </div>
                <div className="text-[9.5px] font-medium text-slate-400 uppercase tracking-[0.14em] mt-0.5">
                  Library System
                </div>
              </div>
            </div>
            <p className="text-[13.5px] text-slate-500 leading-relaxed max-w-[280px] mb-5">
              Sistem manajemen perpustakaan digital untuk sekolah. Sederhana,
              cepat, dan terpercaya.
            </p>
            {/* Module tags */}
            <div className="flex flex-wrap gap-1.5">
              {["Koleksi", "Anggota", "Peminjaman", "Laporan"].map((tag) => (
                <span
                  key={tag}
                  className="text-[10.5px] font-medium px-2.5 py-0.5 rounded-full"
                  style={{
                    background: "hsl(161 52% 26% / 0.07)",
                    border: "1px solid hsl(161 52% 36% / 0.18)",
                    color: "hsl(161 52% 32%)",
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Navigation links */}
          <div className="md:col-span-3">
            <h3 className="text-[11px] font-bold text-slate-900 uppercase tracking-[0.08em] mb-4">
              Navigasi
            </h3>
            <ul className="space-y-3">
              {[
                { label: "Cara Kerja", id: "how" },
                { label: "Fitur", id: "features" },
                { label: "Tentang", id: "about" },
              ].map(({ label, id }) => (
                <li key={label}>
                  <button
                    onClick={() => scrollTo(id)}
                    className="text-[13.5px] text-slate-500 hover:text-slate-900 transition-colors duration-150"
                  >
                    {label}
                  </button>
                </li>
              ))}
              <li>
                <Link
                  href="/login"
                  className="text-[13.5px] text-slate-500 hover:text-slate-900 transition-colors duration-150"
                >
                  Masuk
                </Link>
              </li>
            </ul>
          </div>

          {/* Info */}
          <div className="md:col-span-4">
            <h3 className="text-[11px] font-bold text-slate-900 uppercase tracking-[0.08em] mb-4">
              Informasi
            </h3>
            <ul className="space-y-3">
              <li>
                <p className="text-[13px] text-slate-400">Dikembangkan untuk</p>
                <p className="text-[13.5px] font-semibold text-slate-700 mt-0.5">
                  SMKN 2 Lubuk Basung
                </p>
              </li>
              <li>
                <p className="text-[13.5px] text-slate-500">Sumatera Barat, Indonesia</p>
              </li>
              <li>
                <div
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                  style={{
                    background: "hsl(161 52% 26% / 0.07)",
                    border: "1px solid hsl(161 52% 36% / 0.18)",
                  }}
                >
                  <div
                    className="w-1.5 h-1.5 rounded-full animate-pulse"
                    style={{ background: "hsl(161 52% 44%)" }}
                  />
                  <span
                    className="text-[10.5px] font-medium"
                    style={{ color: "hsl(161 52% 30%)" }}
                  >
                    Sistem Aktif
                  </span>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[12px] text-slate-400">
            &copy; {year} Vireon Library System. Hak cipta dilindungi.
          </p>
          <p className="text-[12px] text-slate-400">
            Dibangun dengan Supabase &amp; React
          </p>
        </div>
      </div>
    </footer>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  // Force light mode on landing; restore on unmount
  useEffect(() => {
    const root = document.documentElement;
    const wasDark = root.classList.contains("dark");
    root.classList.remove("dark");
    return () => {
      if (wasDark) root.classList.add("dark");
    };
  }, []);

  return (
    <div className="relative min-h-screen bg-white text-slate-900 overflow-x-hidden">
      <LandingNav />
      <main>
        <HeroSection />
        <MarqueeTicker />
        <StatsSection />
        <HowItWorksSection />
        <FeaturesSection />
        <AboutSection />
        <CTASection />
      </main>
      <LandingFooter />
    </div>
  );
}
