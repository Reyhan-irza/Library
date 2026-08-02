/**
 * VIREON — Landing Page
 *
 * Light-mode only. Every section is a named component for maintainability.
 * Live statistics are fetched directly from Supabase (graceful 0-fallback
 * when accessed by unauthenticated visitors).
 */

import { Link } from "wouter";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import type { TargetAndTransition, Transition } from "framer-motion";
import { useEffect, useState, useCallback } from "react";
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
  FileText,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import VIREON_LOGO from "@/assets/logo";
import { useLandingStats } from "@/hooks/api";

// ─── Helpers ────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  return n.toLocaleString("id-ID");
}

function scrollTo(id: string) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

// ─── Animation helpers ───────────────────────────────────────────────────────

interface Anim {
  initial?: TargetAndTransition;
  animate?: TargetAndTransition;
  whileInView?: TargetAndTransition;
  whileHover?: TargetAndTransition;
  viewport?: { once?: boolean; margin?: string; amount?: number | "some" | "all" };
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

function fadeUpInView(delay = 0): Anim {
  return {
    initial: { opacity: 0, y: 24 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-40px" },
    transition: { duration: 0.55, delay, ease: EASE },
  };
}

// ─── Static data ─────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: BookOpen,
    num: "01",
    title: "Manajemen Koleksi",
    desc: "Tambah, edit, dan lacak seluruh koleksi buku dengan mudah. Lengkap dengan kategori, rak, ISBN, dan informasi pengarang.",
  },
  {
    icon: Users,
    num: "02",
    title: "Data Anggota",
    desc: "Kelola data siswa dan anggota perpustakaan dalam satu tempat. Pantau riwayat peminjaman dan status denda setiap anggota.",
  },
  {
    icon: ArrowLeftRight,
    num: "03",
    title: "Peminjaman & Pengembalian",
    desc: "Catat setiap transaksi dengan cepat dan akurat. Sistem otomatis menghitung denda keterlambatan sesuai kebijakan sekolah.",
  },
  {
    icon: BarChart3,
    num: "04",
    title: "Laporan & Statistik",
    desc: "Pantau aktivitas perpustakaan melalui laporan lengkap dan visualisasi tren peminjaman bulanan yang mudah dibaca.",
  },
  {
    icon: Search,
    num: "05",
    title: "Pencarian Cepat",
    desc: "Temukan buku, anggota, atau transaksi dalam hitungan detik dengan sistem pencarian yang responsif dan akurat.",
  },
  {
    icon: ShieldCheck,
    num: "06",
    title: "Keamanan Terjamin",
    desc: "Data perpustakaan tersimpan aman dengan enkripsi end-to-end dan sistem kontrol akses berlapis berbasis peran.",
  },
] as const;

const BENEFITS = [
  {
    icon: Zap,
    title: "Efisiensi Tinggi",
    desc: "Alur kerja yang dirancang untuk kecepatan. Kurangi tugas berulang dan selesaikan pekerjaan dengan lebih sedikit langkah.",
  },
  {
    icon: Layers,
    title: "Terintegrasi Penuh",
    desc: "Semua modul saling terhubung. Perubahan data di satu tempat langsung tercermin di seluruh sistem secara otomatis.",
  },
  {
    icon: RefreshCw,
    title: "Data Selalu Akurat",
    desc: "Sinkronisasi real-time memastikan informasi yang Anda lihat selalu mencerminkan kondisi perpustakaan terkini.",
  },
] as const;

const HOW_STEPS = [
  {
    icon: Database,
    num: "01",
    title: "Daftarkan Koleksi",
    desc: "Input buku, kategori, dan rak dengan form yang mudah. ISBN dan data pengarang tersimpan secara terstruktur.",
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
  "Backup Aman",
];

// ─── Navigation ───────────────────────────────────────────────────────────────

function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 12);
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

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white/96 backdrop-blur-md border-b border-slate-200/80 shadow-[0_1px_12px_rgba(0,0,0,0.06)]"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 ring-1 ring-slate-200/80">
              <img
                src={VIREON_LOGO}
                alt="Vireon Logo"
                className="w-full h-full object-cover"
                loading="eager"
                decoding="sync"
              />
            </div>
            <div className="flex flex-col leading-none gap-0.5">
              <span className="text-[13px] font-bold text-slate-900 tracking-[0.06em]">VIREON</span>
              <span className="text-[9px] font-medium text-slate-400 uppercase tracking-[0.12em]">
                Library System
              </span>
            </div>
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
            <button
              onClick={() => handleScroll("how")}
              className="text-[13.5px] font-medium text-slate-600 hover:text-slate-900 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Cara Kerja
            </button>
            <button
              onClick={() => handleScroll("features")}
              className="text-[13.5px] font-medium text-slate-600 hover:text-slate-900 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Fitur
            </button>
            <button
              onClick={() => handleScroll("about")}
              className="text-[13.5px] font-medium text-slate-600 hover:text-slate-900 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Tentang
            </button>
          </nav>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-2">
            <Link
              href="/login"
              className="text-[13.5px] font-medium text-slate-600 hover:text-slate-900 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Masuk
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-[13.5px] font-semibold bg-primary text-white px-4 py-2 rounded-lg hover:opacity-90 active:scale-[0.98] transition-all"
            >
              Mulai Sekarang
              <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            aria-label={mobileOpen ? "Tutup menu" : "Buka menu"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? (
              <X className="w-5 h-5" aria-hidden="true" />
            ) : (
              <Menu className="w-5 h-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </header>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="fixed top-16 left-0 right-0 z-40 bg-white border-b border-slate-200 shadow-lg md:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
          >
            <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col gap-1">
              <button
                onClick={() => handleScroll("how")}
                className="text-left text-sm font-medium text-slate-700 hover:text-slate-900 px-3 py-3 rounded-xl hover:bg-slate-50 transition-colors min-h-[44px] flex items-center"
              >
                Cara Kerja
              </button>
              <button
                onClick={() => handleScroll("features")}
                className="text-left text-sm font-medium text-slate-700 hover:text-slate-900 px-3 py-3 rounded-xl hover:bg-slate-50 transition-colors min-h-[44px] flex items-center"
              >
                Fitur
              </button>
              <button
                onClick={() => handleScroll("about")}
                className="text-left text-sm font-medium text-slate-700 hover:text-slate-900 px-3 py-3 rounded-xl hover:bg-slate-50 transition-colors min-h-[44px] flex items-center"
              >
                Tentang
              </button>
              <div className="border-t border-slate-100 mt-2 pt-2 flex flex-col gap-2">
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="text-sm font-medium text-slate-700 px-3 py-3 rounded-xl hover:bg-slate-50 transition-colors min-h-[44px] flex items-center"
                >
                  Masuk
                </Link>
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="inline-flex items-center justify-center gap-1.5 text-sm font-semibold bg-primary text-white px-4 py-3 rounded-xl hover:opacity-90 transition-all min-h-[44px]"
                >
                  Mulai Sekarang
                  <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
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

function DashboardPreview({
  stats,
  loading,
}: {
  stats:
    | {
        totalBooks: number;
        totalMembers: number;
        totalBorrowings: number;
        availableBooks: number;
      }
    | undefined;
  loading: boolean;
}) {
  const cards = [
    { label: "Total Buku", value: stats?.totalBooks },
    { label: "Anggota", value: stats?.totalMembers },
    { label: "Dipinjam", value: stats?.totalBorrowings },
    { label: "Tersedia", value: stats?.availableBooks },
  ];

  const activity = [
    "Peminjaman baru tercatat",
    "Buku berhasil dikembalikan",
    "Anggota baru terdaftar",
  ];

  return (
    <div
      className="relative rounded-2xl overflow-hidden shadow-2xl shadow-slate-900/12 border border-slate-200/80 bg-white"
      style={{ boxShadow: "0 32px 80px -12px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04)" }}
    >
      {/* Window chrome */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/80">
        <div className="flex items-center gap-1.5" aria-hidden="true">
          <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
          <div className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
          <div className="w-3 h-3 rounded-full bg-[#28C840]" />
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-white rounded-md border border-slate-200/80 shadow-sm">
          <div className="w-1.5 h-1.5 rounded-full bg-slate-300" aria-hidden="true" />
          <span className="text-[11px] text-slate-400 font-mono select-none">vireon/dashboard</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-600">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
          Admin
        </div>
      </div>

      {/* Dashboard body */}
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[13px] font-bold text-slate-900">Dashboard</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Perpustakaan SMKN 2 Lubuk Basung</p>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200/80 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
            <span className="text-[10px] font-semibold text-emerald-700">Live</span>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-2.5 mb-4">
          {cards.map(({ label, value }) => (
            <div
              key={label}
              className="p-3 bg-slate-50 rounded-xl border border-slate-100"
            >
              {loading ? (
                <div className="h-5 w-10 bg-slate-200 rounded animate-pulse mb-1" aria-hidden="true" />
              ) : (
                <p className="text-[17px] font-extrabold text-slate-900 tabular-nums">{fmt(value ?? 0)}</p>
              )}
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Activity list */}
        <div className="rounded-xl border border-slate-100 overflow-hidden">
          <div className="px-3 py-2 border-b border-slate-100 bg-slate-50/80">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Aktivitas Terbaru
            </p>
          </div>
          {activity.map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-2.5 px-3 py-2.5 border-b last:border-0 border-slate-100"
            >
              <div
                className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0"
                aria-hidden="true"
              />
              <p className="text-[11px] text-slate-600 truncate">{item}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function HeroSection() {
  const { data: stats, isLoading } = useLandingStats();
  const shouldReduce = useReducedMotion();

  const animProps = (delay: number): Anim =>
    shouldReduce ? {} : fadeUp(delay);

  return (
    <section className="relative pt-28 pb-16 sm:pt-32 sm:pb-20 lg:pt-36 lg:pb-24 overflow-hidden">
      {/* Layered background — radial green + grid dots */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div
          className="absolute top-0 left-0 right-0 h-[600px]"
          style={{
            background:
              "radial-gradient(ellipse 90% 70% at 50% -5%, hsl(161 50% 40% / 0.08) 0%, transparent 70%)",
          }}
        />
        <svg className="absolute inset-0 w-full h-full opacity-[0.022]">
          <defs>
            <pattern id="hero-dots" x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse">
              <circle cx="1.5" cy="1.5" r="1.5" fill="currentColor" className="text-slate-900" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hero-dots)" />
        </svg>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left — copy */}
          <div className="max-w-xl">
            <motion.div {...animProps(0)}>
              <div className="inline-flex items-center gap-2 bg-primary/8 text-primary text-xs font-semibold px-3 py-1.5 rounded-full mb-6 ring-1 ring-primary/20">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" aria-hidden="true" />
                SISTEM MANAJEMEN PERPUSTAKAAN
              </div>
            </motion.div>

            <motion.h1
              {...animProps(0.08)}
              className="text-4xl sm:text-5xl lg:text-[3.4rem] font-extrabold text-slate-900 leading-[1.1] tracking-tight font-sans"
            >
              Kelola Perpustakaan
              <br />
              <span className="text-primary">Sekolah</span> dengan
              <br />
              Lebih Cerdas
            </motion.h1>

            <motion.p
              {...animProps(0.16)}
              className="mt-6 text-lg text-slate-500 leading-relaxed max-w-md"
            >
              VIREON membantu pengelola perpustakaan menangani koleksi buku,
              anggota, peminjaman, dan laporan — dalam satu platform yang
              sederhana, cepat, dan terpercaya.
            </motion.p>

            <motion.div
              {...animProps(0.24)}
              className="mt-8 flex flex-wrap items-center gap-3"
            >
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-5 py-3 bg-primary text-white text-sm font-semibold rounded-xl hover:opacity-90 active:scale-[0.98] transition-all shadow-md shadow-primary/20 min-h-[44px]"
              >
                Masuk ke Sistem
                <ChevronRight className="w-4 h-4" aria-hidden="true" />
              </Link>
              <button
                onClick={() => scrollTo("how")}
                className="inline-flex items-center gap-2 px-5 py-3 text-sm font-medium text-slate-700 border border-slate-300 rounded-xl hover:bg-slate-50 hover:border-slate-400 active:scale-[0.98] transition-all min-h-[44px]"
              >
                Lihat Cara Kerja
              </button>
            </motion.div>

            {/* Trust signals */}
            <motion.div
              {...animProps(0.32)}
              className="mt-8 flex flex-wrap items-center gap-4"
            >
              {[
                "Tidak perlu instalasi",
                "Data aman & terenkripsi",
                "Pembaruan otomatis",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-1.5 text-xs text-slate-500"
                >
                  <CheckCircle2
                    className="w-3.5 h-3.5 text-primary flex-shrink-0"
                    aria-hidden="true"
                  />
                  {item}
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right — dashboard preview */}
          <motion.div
            {...(shouldReduce
              ? {}
              : {
                  initial: { opacity: 0, x: 20, scale: 0.98 },
                  animate: { opacity: 1, x: 0, scale: 1 },
                  transition: { duration: 0.65, delay: 0.15, ease: EASE },
                })}
            className="w-full"
          >
            {/* Glow behind preview */}
            <div
              className="absolute -inset-8 rounded-3xl pointer-events-none"
              style={{
                background:
                  "radial-gradient(ellipse 70% 60% at 50% 50%, hsl(161 50% 40% / 0.07) 0%, transparent 70%)",
              }}
              aria-hidden="true"
            />
            <DashboardPreview stats={stats} loading={isLoading} />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ─── Marquee Ticker ───────────────────────────────────────────────────────────

function MarqueeTicker() {
  const doubledItems = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS];

  return (
    <div className="bg-slate-900 border-y border-slate-800 py-4 overflow-hidden relative">
      {/* Left fade */}
      <div
        className="absolute left-0 top-0 bottom-0 w-20 z-10 pointer-events-none"
        style={{ background: "linear-gradient(to right, #0f172a, transparent)" }}
        aria-hidden="true"
      />
      {/* Right fade */}
      <div
        className="absolute right-0 top-0 bottom-0 w-20 z-10 pointer-events-none"
        style={{ background: "linear-gradient(to left, #0f172a, transparent)" }}
        aria-hidden="true"
      />

      <motion.div
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 32, repeat: Infinity, ease: "linear" }}
        className="flex items-center gap-0 whitespace-nowrap"
        aria-hidden="true"
      >
        {doubledItems.map((item, i) => (
          <div key={i} className="flex items-center gap-6 px-6">
            <span className="text-[12px] font-semibold text-slate-400 tracking-wide uppercase">
              {item}
            </span>
            <span
              className="w-1 h-1 rounded-full flex-shrink-0"
              style={{ background: "hsl(161 50% 45%)" }}
            />
          </div>
        ))}
      </motion.div>
    </div>
  );
}

// ─── Stats Bar ────────────────────────────────────────────────────────────────

function StatsBar() {
  const { data: stats, isLoading } = useLandingStats();
  const shouldReduce = useReducedMotion();

  const items = [
    { label: "Total Koleksi Buku", value: stats?.totalBooks, icon: BookOpen },
    { label: "Anggota Terdaftar", value: stats?.totalMembers, icon: Users },
    { label: "Total Peminjaman", value: stats?.totalBorrowings, icon: ArrowLeftRight },
    { label: "Buku Tersedia", value: stats?.availableBooks, icon: CheckCircle2 },
  ];

  return (
    <section className="bg-white border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-slate-100">
          {items.map(({ label, value, icon: Icon }, i) => (
            <motion.div
              key={label}
              {...(shouldReduce ? {} : fadeUpInView(i * 0.08))}
              className="py-10 px-6 lg:px-8 relative group"
            >
              {/* Subtle hover tint */}
              <div className="absolute inset-0 bg-primary/[0.025] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-3">
                  <Icon
                    className="w-4 h-4 text-primary/60"
                    strokeWidth={1.75}
                    aria-hidden="true"
                  />
                </div>
                {isLoading ? (
                  <div
                    className="h-8 w-16 bg-slate-200 rounded-lg animate-pulse mb-2"
                    aria-hidden="true"
                  />
                ) : (
                  <p className="text-3xl font-extrabold text-slate-900 tabular-nums tracking-tight">
                    {fmt(value ?? 0)}
                    {(value ?? 0) > 0 && (
                      <span className="text-primary ml-0.5">+</span>
                    )}
                  </p>
                )}
                <p className="mt-1.5 text-sm text-slate-500 font-medium leading-snug">{label}</p>
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
  const shouldReduce = useReducedMotion();

  return (
    <section id="how" className="relative py-20 sm:py-28 bg-slate-50 border-b border-slate-100 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <svg className="absolute inset-0 w-full h-full opacity-[0.025]">
          <defs>
            <pattern id="how-grid" x="0" y="0" width="48" height="48" patternUnits="userSpaceOnUse">
              <path d="M 48 0 L 0 0 0 48" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-slate-900" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#how-grid)" />
        </svg>
        {/* Large decorative text */}
        <div
          className="absolute -bottom-2 left-1/2 -translate-x-1/2 font-black text-slate-900/[0.025] leading-none whitespace-nowrap select-none tracking-tighter"
          style={{ fontSize: "clamp(80px, 16vw, 180px)" }}
        >
          HANZOFFICIAL
        </div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          {...(shouldReduce ? {} : fadeUpInView(0))}
          className="max-w-xl mb-16"
        >
          <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">
            Cara Kerja
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight font-sans leading-tight">
            Mulai Gunakan dalam
            <br />
            Tiga Langkah Mudah
          </h2>
          <p className="mt-4 text-base text-slate-500 leading-relaxed">
            Tidak perlu pelatihan teknis. VIREON dirancang agar langsung bisa
            digunakan oleh pengelola perpustakaan sekolah mana pun.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10">
          {/* Connecting line (desktop only) */}
          <div
            className="hidden md:block absolute top-[2.75rem] left-[calc(16.67%+1.5rem)] right-[calc(16.67%+1.5rem)] h-px pointer-events-none"
            aria-hidden="true"
            style={{
              background:
                "linear-gradient(to right, transparent, hsl(161 50% 40% / 0.3) 25%, hsl(161 50% 40% / 0.3) 75%, transparent)",
            }}
          />

          {HOW_STEPS.map(({ icon: Icon, num, title, desc }, i) => (
            <motion.div
              key={title}
              {...(shouldReduce ? {} : fadeUpInView(i * 0.12))}
              className="relative flex flex-col"
            >
              {/* Step number circle */}
              <div className="relative mb-6 flex items-center gap-4">
                <div className="w-11 h-11 rounded-2xl bg-white border-2 border-primary/20 shadow-sm flex items-center justify-center flex-shrink-0 relative">
                  <Icon
                    className="w-5 h-5 text-primary"
                    strokeWidth={1.75}
                    aria-hidden="true"
                  />
                  {/* Number badge */}
                  <div
                    className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center shadow-sm"
                  >
                    <span className="text-[9px] font-bold text-white">{i + 1}</span>
                  </div>
                </div>
                <span
                  className="text-[52px] font-black leading-none select-none"
                  style={{ color: "hsl(161 50% 40% / 0.1)", letterSpacing: "-0.05em" }}
                  aria-hidden="true"
                >
                  {num}
                </span>
              </div>
              <h3 className="text-[17px] font-bold text-slate-900 mb-2 font-sans">{title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed flex-1">{desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA nudge */}
        <motion.div
          {...(shouldReduce ? {} : fadeUpInView(0.3))}
          className="mt-14 flex justify-center"
        >
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors group"
          >
            Mulai sekarang, gratis
            <ArrowRight
              className="w-4 h-4 group-hover:translate-x-0.5 transition-transform"
              aria-hidden="true"
            />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Features ─────────────────────────────────────────────────────────────────

function FeaturesSection() {
  const shouldReduce = useReducedMotion();

  return (
    <section id="features" className="relative py-20 sm:py-28 bg-white overflow-hidden">
      {/* Subtle right-side radial */}
      <div
        className="absolute top-0 right-0 w-[600px] h-[600px] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 100% 0%, hsl(161 50% 40% / 0.05) 0%, transparent 65%)",
        }}
        aria-hidden="true"
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          {...(shouldReduce ? {} : fadeUpInView(0))}
          className="max-w-xl mb-14"
        >
          <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">
            Fitur Lengkap
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight font-sans leading-tight">
            Semua yang Anda Butuhkan
            <br />
            dalam Satu Platform
          </h2>
          <p className="mt-4 text-base text-slate-500 leading-relaxed">
            VIREON dirancang untuk menutupi seluruh siklus operasional
            perpustakaan sekolah — dari pengelolaan koleksi hingga pelaporan
            akhir tahun.
          </p>
        </motion.div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                {...(shouldReduce
                  ? {}
                  : {
                      ...fadeUpInView(i * 0.07),
                      whileHover: { y: -4, transition: { duration: 0.2 } },
                    })}
                className="group relative bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-lg hover:border-primary/25 transition-all duration-300 cursor-default overflow-hidden"
              >
                {/* Hover accent line */}
                <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-primary/0 via-primary to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Number */}
                <div
                  className="absolute top-4 right-5 text-[32px] font-black leading-none select-none transition-opacity duration-300 group-hover:opacity-60"
                  style={{ color: "hsl(161 50% 40% / 0.07)", letterSpacing: "-0.04em" }}
                  aria-hidden="true"
                >
                  {feature.num}
                </div>

                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 transition-colors duration-200 flex-shrink-0"
                  style={{ background: "hsl(161 50% 40% / 0.08)", border: "1px solid hsl(161 50% 40% / 0.15)" }}
                >
                  <Icon
                    className="w-5 h-5 text-primary"
                    strokeWidth={1.75}
                    aria-hidden="true"
                  />
                </div>
                <h3 className="text-[15px] font-semibold text-slate-900 mb-2 font-sans">
                  {feature.title}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed">{feature.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── Benefits ─────────────────────────────────────────────────────────────────

function BenefitsSection() {
  const shouldReduce = useReducedMotion();

  return (
    <section
      id="about"
      className="relative py-20 sm:py-28 overflow-hidden"
      style={{ background: "linear-gradient(160deg, hsl(161 50% 40% / 0.04) 0%, #f8fafc 40%, #f8fafc 100%)" }}
    >
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{ background: "linear-gradient(to right, transparent, hsl(161 50% 40% / 0.2) 50%, transparent)" }}
        />
        <div
          className="absolute -left-20 top-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full"
          style={{ background: "radial-gradient(circle, hsl(161 50% 40% / 0.08) 0%, transparent 70%)" }}
        />
        <div
          className="absolute -bottom-4 left-1/2 -translate-x-1/2 font-black text-slate-900/[0.025] leading-none whitespace-nowrap select-none tracking-tighter"
          style={{ fontSize: "clamp(60px, 12vw, 140px)" }}
        >
          VIREON
        </div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">

          {/* Left — text */}
          <div>
            <motion.div {...(shouldReduce ? {} : fadeUpInView(0))}>
              <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">
                Mengapa VIREON
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight font-sans leading-tight mb-5">
                Dirancang untuk
                <br />
                Kemudahan Sehari-hari
              </h2>
              <p className="text-base text-slate-500 leading-relaxed mb-8">
                Kami memahami tantangan pengelola perpustakaan sekolah. VIREON
                hadir sebagai solusi yang sederhana, andal, dan tidak memerlukan
                keahlian teknis khusus.
              </p>
            </motion.div>

            <motion.div
              {...(shouldReduce ? {} : fadeUpInView(0.1))}
            >
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-5 py-3 bg-primary text-white text-sm font-semibold rounded-xl hover:opacity-90 active:scale-[0.98] transition-all shadow-md shadow-primary/20 min-h-[44px]"
              >
                Coba Sekarang
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </motion.div>
          </div>

          {/* Right — benefit cards */}
          <div className="space-y-4">
            {BENEFITS.map(({ icon: Icon, title, desc }, i) => (
              <motion.div
                key={title}
                {...(shouldReduce
                  ? {}
                  : {
                      ...fadeUpInView(i * 0.1),
                      whileHover: { x: 4, transition: { duration: 0.2 } },
                    })}
                className="group flex items-start gap-5 p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-200"
              >
                <div
                  className="w-11 h-11 rounded-xl flex-shrink-0 flex items-center justify-center mt-0.5 group-hover:scale-105 transition-transform duration-200"
                  style={{
                    background: "linear-gradient(135deg, hsl(161 50% 40% / 0.1) 0%, hsl(161 50% 40% / 0.05) 100%)",
                    border: "1px solid hsl(161 50% 40% / 0.2)",
                  }}
                >
                  <Icon
                    className="w-5 h-5 text-primary"
                    strokeWidth={1.75}
                    aria-hidden="true"
                  />
                </div>
                <div>
                  <h3 className="text-[15px] font-semibold text-slate-900 mb-1.5 font-sans">{title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
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
  const shouldReduce = useReducedMotion();

  return (
    <section className="relative py-20 sm:py-28 bg-slate-900 overflow-hidden">
      {/* Rich background layers */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        {/* Grid */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.04]">
          <defs>
            <pattern id="cta-grid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#cta-grid)" />
        </svg>
        {/* Primary orb left */}
        <div
          className="absolute -left-24 top-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full"
          style={{ background: "radial-gradient(circle, hsl(161 50% 40% / 0.22) 0%, transparent 65%)" }}
        />
        {/* Accent orb right */}
        <div
          className="absolute -right-24 top-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full"
          style={{ background: "radial-gradient(circle, hsl(161 50% 40% / 0.14) 0%, transparent 65%)" }}
        />
        {/* Horizontal accent lines */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        {/* Large decorative text */}
        <div
          className="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 font-black text-white/[0.025] leading-none whitespace-nowrap select-none tracking-tighter"
          style={{ fontSize: "clamp(80px, 18vw, 200px)" }}
        >
          MULAI
        </div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          {...(shouldReduce ? {} : fadeUpInView(0))}
          className="max-w-2xl mx-auto text-center"
        >
          {/* Label */}
          <div
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] font-semibold uppercase tracking-wider mb-6"
            style={{
              background: "hsl(161 50% 40% / 0.15)",
              border: "1px solid hsl(161 50% 40% / 0.3)",
              color: "hsl(161 50% 65%)",
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ background: "hsl(161 50% 60%)" }}
            />
            Siap Digunakan Sekarang
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight font-sans leading-tight mb-5">
            Siap Mengubah Cara Anda
            <br />
            Mengelola Perpustakaan?
          </h2>
          <p className="text-base text-slate-400 leading-relaxed mb-8">
            Mulai gunakan VIREON hari ini. Tidak perlu instalasi rumit, tidak
            perlu konfigurasi panjang — cukup masuk dan mulai bekerja.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-white text-slate-900 text-sm font-semibold rounded-xl hover:bg-slate-100 active:scale-[0.98] transition-all shadow-sm min-h-[44px]"
            >
              Masuk ke VIREON
              <ChevronRight className="w-4 h-4" aria-hidden="true" />
            </Link>
            <button
              onClick={() => scrollTo("features")}
              className="inline-flex items-center gap-2 px-6 py-3.5 text-sm font-medium text-slate-400 border border-slate-700 rounded-xl hover:border-slate-500 hover:text-slate-300 active:scale-[0.98] transition-all min-h-[44px]"
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
  return (
    <footer className="bg-white">
      {/* Top accent line */}
      <div
        className="h-[3px] w-full"
        style={{
          background: "linear-gradient(to right, transparent, hsl(161 50% 40% / 0.6) 30%, hsl(161 50% 40%) 50%, hsl(161 50% 40% / 0.6) 70%, transparent)",
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-14">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-12">

          {/* Brand — wider column */}
          <div className="md:col-span-5">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 ring-1 ring-slate-200/80">
                <img
                  src={VIREON_LOGO}
                  alt="Vireon Logo"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="flex flex-col leading-none gap-0.5">
                <span className="text-[13px] font-bold text-slate-900 tracking-[0.06em]">VIREON</span>
                <span className="text-[9px] font-medium text-slate-400 uppercase tracking-[0.12em]">
                  Library System
                </span>
              </div>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed max-w-[260px] mb-5">
              Sistem manajemen perpustakaan modern untuk sekolah. Sederhana,
              cepat, dan terpercaya.
            </p>
            {/* Feature badges */}
            <div className="flex flex-wrap gap-2">
              {["Koleksi", "Anggota", "Peminjaman", "Laporan"].map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] font-medium px-2.5 py-1 rounded-full"
                  style={{
                    background: "hsl(161 50% 40% / 0.07)",
                    border: "1px solid hsl(161 50% 40% / 0.18)",
                    color: "hsl(161 50% 35%)",
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Product links */}
          <div className="md:col-span-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">
              Produk
            </h3>
            <ul className="space-y-3">
              {[
                { label: "Cara Kerja", action: () => scrollTo("how") },
                { label: "Fitur", action: () => scrollTo("features") },
                { label: "Tentang", action: () => scrollTo("about") },
              ].map(({ label, action }) => (
                <li key={label}>
                  <button
                    onClick={action}
                    className="text-sm text-slate-500 hover:text-slate-900 transition-colors"
                  >
                    {label}
                  </button>
                </li>
              ))}
              <li>
                <Link
                  href="/login"
                  className="text-sm text-slate-500 hover:text-slate-900 transition-colors"
                >
                  Masuk
                </Link>
              </li>
            </ul>
          </div>

          {/* Info */}
          <div className="md:col-span-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">
              Informasi
            </h3>
            <ul className="space-y-3">
              <li>
                <p className="text-sm text-slate-500">Dikembangkan untuk</p>
                <p className="text-sm font-semibold text-slate-800 mt-0.5">SMKN 2 Lubuk Basung</p>
              </li>
              <li>
                <p className="text-sm text-slate-500">Sumatera Barat, Indonesia</p>
              </li>
              <li>
                <div
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                  style={{
                    background: "hsl(161 50% 40% / 0.07)",
                    border: "1px solid hsl(161 50% 40% / 0.18)",
                  }}
                >
                  <div
                    className="w-1.5 h-1.5 rounded-full animate-pulse"
                    style={{ background: "hsl(161 50% 45%)" }}
                  />
                  <span className="text-[10px] font-medium" style={{ color: "hsl(161 50% 35%)" }}>
                    Sistem Aktif
                  </span>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-400">
            &copy; {new Date().getFullYear()} Vireon Library System. Hak cipta dilindungi.
          </p>
          <p className="text-xs text-slate-400">
            Dibangun dengan Supabase &amp; React &mdash; Replit
          </p>
        </div>
      </div>
    </footer>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  // Force light mode on the landing page; restore on unmount
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
        <StatsBar />
        <HowItWorksSection />
        <FeaturesSection />
        <BenefitsSection />
        <CTASection />
      </main>
      <LandingFooter />
    </div>
  );
}
