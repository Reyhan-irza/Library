

import { Link } from "wouter";
import {
  motion,
  useReducedMotion,
  AnimatePresence,
  useScroll,
  useMotionValueEvent,
  useTransform,
  useMotionValue,
  useSpring,
  useInView,
  useAnimation,
} from "framer-motion";
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
  ArrowUp,
  Instagram,
  Mail,
  MessageCircle,
  Github,
  LayoutDashboard,
  BookMarked,
  Clock,
  Activity,
} from "lucide-react";
import VIREON_LOGO from "@/assets/logo";
import { useLandingStats } from "@/hooks/api";
import { CustomCursor } from "@/components/custom-cursor";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  return n.toLocaleString("id-ID");
}

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

// ─── Easing constants ─────────────────────────────────────────────────────────

const E_OUT  = [0.16, 1, 0.3, 1] as const;   // expo-out — fast start, long tail
const E_CIRC = [0, 0.55, 0.45, 1] as const;  // circ-out — sudden deceleration

// ─── Animation factory helpers ────────────────────────────────────────────────

/** Mount-time: fade + rise */
function fadeUp(delay = 0, reduced = false) {
  if (reduced) return {};
  return {
    initial: { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.55, delay, ease: E_OUT },
  };
}

/** Mount-time: blur focus-pull + rise — cinematic feel */
function fadeBlurUp(delay = 0, reduced = false) {
  if (reduced) return {};
  return {
    initial: { opacity: 0, y: 28, filter: "blur(10px)" },
    animate: { opacity: 1, y: 0, filter: "blur(0px)" },
    transition: { duration: 0.72, delay, ease: E_OUT },
  };
}

/** Scroll-triggered: fade + rise */
function fadeUpView(delay = 0, reduced = false) {
  if (reduced) return {};
  return {
    initial: { opacity: 0, y: 24 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-56px" },
    transition: { duration: 0.58, delay, ease: E_OUT },
  };
}

/** Scroll-triggered: slide from left */
function fadeLeftView(delay = 0, reduced = false) {
  if (reduced) return {};
  return {
    initial: { opacity: 0, x: -48, rotate: -1 },
    whileInView: { opacity: 1, x: 0, rotate: 0 },
    viewport: { once: true, margin: "-56px" },
    transition: { duration: 0.65, delay, ease: E_OUT },
  };
}

/** Scroll-triggered: slide from right */
function fadeRightView(delay = 0, reduced = false) {
  if (reduced) return {};
  return {
    initial: { opacity: 0, x: 48, rotate: 1 },
    whileInView: { opacity: 1, x: 0, rotate: 0 },
    viewport: { once: true, margin: "-56px" },
    transition: { duration: 0.65, delay, ease: E_OUT },
  };
}

/** Scroll-triggered: scale-in from slightly small */
function scaleView(delay = 0, reduced = false) {
  if (reduced) return {};
  return {
    initial: { opacity: 0, scale: 0.88 },
    whileInView: { opacity: 1, scale: 1 },
    viewport: { once: true, margin: "-56px" },
    transition: { duration: 0.6, delay, ease: E_CIRC },
  };
}

// ─── Scroll direction ─────────────────────────────────────────────────────────
// A small shared signal for directional UI. It avoids a global scroll listener
// per component and only updates React state when the user changes direction.

function useScrollIntent(threshold = 0) {
  const { scrollY } = useScroll();
  const [direction, setDirection] = useState<"up" | "down">("down");
  const [pastThreshold, setPastThreshold] = useState(false);
  const lastY = useRef(0);

  useMotionValueEvent(scrollY, "change", (latest) => {
    const delta = latest - lastY.current;
    if (Math.abs(delta) >= 1.5) {
      setDirection(delta < 0 ? "up" : "down");
      lastY.current = latest;
    }
    setPastThreshold(latest > threshold);
  });

  return { direction, pastThreshold };
}

// ─── Count-up hook ────────────────────────────────────────────────────────────

function useCountUp(target: number, active: boolean, duration = 1.8) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active) return;
    if (target === 0) { setValue(0); return; }
    let start = 0;
    const step = (ts: number) => {
      if (!start) start = ts;
      const elapsed = ts - start;
      const progress = Math.min(elapsed / (duration * 1000), 1);
      // easeOutQuart
      const eased = 1 - Math.pow(1 - progress, 4);
      setValue(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    const id = requestAnimationFrame(step);
    return () => cancelAnimationFrame(id);
  }, [target, active, duration]);
  return value;
}

// ─── 3D tilt hook ─────────────────────────────────────────────────────────────

function useCardTilt(intensity = 6, reduced = false) {
  const nx = useMotionValue(0);
  const ny = useMotionValue(0);
  const rotX = useSpring(useTransform(ny, [-0.5, 0.5], [intensity, -intensity]), { stiffness: 260, damping: 26 });
  const rotY = useSpring(useTransform(nx, [-0.5, 0.5], [-intensity, intensity]), { stiffness: 260, damping: 26 });

  const onMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (reduced) return;
    const r = e.currentTarget.getBoundingClientRect();
    nx.set((e.clientX - r.left) / r.width - 0.5);
    ny.set((e.clientY - r.top) / r.height - 0.5);
  }, [nx, ny, reduced]);

  const onLeave = useCallback(() => {
    nx.set(0);
    ny.set(0);
  }, [nx, ny]);

  return { rotateX: rotX, rotateY: rotY, onMouseMove: onMove, onMouseLeave: onLeave };
}

// ─── Static data ──────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: BookOpen, num: "01", title: "Manajemen Koleksi",
    desc: "Tambah, edit, dan lacak seluruh koleksi buku dengan mudah. Lengkap dengan kategori, rak, ISBN, dan informasi pengarang.",
    span: "lg:col-span-2", accent: true,
  },
  {
    icon: Users, num: "02", title: "Data Anggota",
    desc: "Kelola data anggota dalam satu tempat. Pantau riwayat peminjaman dan status setiap pembaca dengan cepat.",
    span: "lg:col-span-1", accent: false,
  },
  {
    icon: ArrowLeftRight, num: "03", title: "Peminjaman & Pengembalian",
    desc: "Catat peminjaman dan pengembalian tanpa ribet. Status dan pengingat tetap jelas untuk semua orang.",
    span: "lg:col-span-1", accent: false,
  },
  {
    icon: BarChart3, num: "04", title: "Laporan & Statistik",
    desc: "Lihat apa yang sedang ramai, cek tren peminjaman, dan temukan insight tanpa harus bongkar data satu-satu.",
    span: "lg:col-span-2", accent: false,
  },
  {
    icon: Search, num: "05", title: "Pencarian Cepat",
    desc: "Temukan buku, anggota, atau transaksi dalam hitungan detik dengan sistem pencarian yang responsif dan akurat.",
    span: "lg:col-span-1", accent: false,
  },
  {
    icon: ShieldCheck, num: "06", title: "Keamanan Terjamin",
    desc: "Data tetap aman dengan akses berbasis peran dan perlindungan berlapis, jadi semua orang bisa fokus ke hal yang penting.",
    span: "lg:col-span-1", accent: false,
  },
] as const;

const HOW_STEPS = [
  {
    icon: Database, num: "01", title: "Daftarkan Koleksi",
    desc: "Input buku, kategori, dan rak dengan form yang intuitif. ISBN dan data pengarang tersimpan secara terstruktur.",
  },
  {
    icon: ArrowLeftRight, num: "02", title: "Catat Transaksi",
    desc: "Proses peminjaman dan pengembalian dalam hitungan detik. Denda terlambat terhitung secara otomatis.",
  },
  {
    icon: TrendingUp, num: "03", title: "Pantau & Evaluasi",
    desc: "Lihat laporan lengkap dan grafik statistik untuk mengambil keputusan berbasis data yang akurat.",
  },
] as const;

const MARQUEE_ITEMS = [
  "Manajemen Koleksi", "Peminjaman Otomatis", "Laporan Real-time",
  "Pencarian Instan", "Kontrol Akses", "Sinkronisasi Data",
  "Manajemen Anggota", "Statistik Bulanan", "Enkripsi Data",
  "Antarmuka Intuitif", "Denda Otomatis",
];

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Sk({ w = "w-12", h = "h-5" }: { w?: string; h?: string }) {
  return <div className={`${w} ${h} rounded bg-slate-200 animate-pulse`} aria-hidden="true" />;
}

// ─── Navigation ───────────────────────────────────────────────────────────────

function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const { direction } = useScrollIntent(72);
  const navVisible = !scrolled || direction === "up" || mobileOpen;

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
      <motion.header
        initial={reduced ? {} : { y: -20, opacity: 0 }}
        animate={{ y: navVisible ? 0 : -72, opacity: navVisible ? 1 : 0 }}
        transition={{ duration: reduced ? 0 : 0.36, delay: 0.05, ease: E_OUT }}
        className={`fixed top-0 inset-x-0 z-50 transition-[background-color,border-color,box-shadow] duration-300 ${
          !navVisible ? "pointer-events-none" : ""
        } ${
          scrolled
            ? "bg-white/[0.97] backdrop-blur-xl border-b border-slate-200/70 shadow-[0_1px_0_0_rgba(0,0,0,0.04),0_4px_16px_-2px_rgba(0,0,0,0.04)]"
            : "bg-transparent"
        }`}
      >
        <motion.div className="absolute inset-x-0 bottom-0 h-[2px] origin-left" style={{ scaleX: reduced ? 1 : scrollYProgress, background: "hsl(163 45% 42%)" }} aria-hidden="true" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[60px] flex items-center justify-between">
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 shrink-0">
              <img src={VIREON_LOGO} alt="VIREON" className="w-full h-full object-contain" loading="eager" decoding="sync" />
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

          <nav className="hidden md:flex items-center gap-0.5" aria-label="Navigasi utama">
            {[{ label: "Cara Kerja", id: "how" }, { label: "Fitur", id: "features" }, { label: "Tentang", id: "about" }].map(({ label, id }) => (
              <button key={id} onClick={() => handleScroll(id)} className={navItem}>{label}</button>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-2">
            <Link href="/login" className={navItem}>Masuk</Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[hsl(161_52%_38%)] hover:bg-[hsl(161_52%_44%)] text-white text-[13.5px] font-semibold rounded-lg transition-all duration-150 active:scale-[0.98] shadow-[0_1px_3px_rgba(0,0,0,0.25)]"
            >
              Mulai Sekarang
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <button
            onClick={() => setMobileOpen((v) => !v)}
            className={`md:hidden p-2 rounded-lg transition-colors ${scrolled ? "text-slate-500 hover:text-slate-900 hover:bg-slate-50" : "text-white/80 hover:text-white hover:bg-white/10"}`}
            aria-label={mobileOpen ? "Tutup menu" : "Buka menu"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </motion.header>

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
              {[{ label: "Cara Kerja", id: "how" }, { label: "Fitur", id: "features" }, { label: "Tentang", id: "about" }].map(({ label, id }) => (
                <button
                  key={id}
                  onClick={() => handleScroll(id)}
                  className="text-left text-[15px] font-medium text-slate-700 px-3 py-3.5 rounded-xl hover:bg-slate-50 transition-colors min-h-[44px] flex items-center"
                >
                  {label}
                </button>
              ))}
              <div className="border-t border-slate-100 mt-1 pt-3 flex flex-col gap-2">
                <Link href="/login" onClick={() => setMobileOpen(false)} className="text-[15px] font-medium text-slate-700 px-3 py-3.5 rounded-xl hover:bg-slate-50 transition-colors min-h-[44px] flex items-center">
                  Masuk
                </Link>
                <Link href="/login" onClick={() => setMobileOpen(false)} className="flex items-center justify-center gap-1.5 text-[15px] font-semibold bg-[hsl(161_52%_26%)] text-white px-4 py-3.5 rounded-xl hover:bg-[hsl(161_52%_22%)] transition-all min-h-[44px]">
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

// ─── Scroll-up dock ────────────────────────────────────────────────────────────
// Unlike a permanently visible back-to-top button, this dock responds to the
// user's upward intent. It enters from the edge, carries page progress in its
// ring, and stays compact enough not to compete with content on mobile.

function ScrollUpDock() {
  const reduced = useReducedMotion();
  const { direction, pastThreshold } = useScrollIntent(280);
  const { scrollYProgress } = useScroll();
  const visible = pastThreshold && direction === "up";
  const progress = useTransform(scrollYProgress, [0, 1], [0, 1]);

  const goTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
  }, [reduced]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 18, scale: 0.92 }}
          animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
          exit={reduced ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.96 }}
          transition={{ duration: reduced ? 0 : 0.32, ease: E_OUT }}
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40"
        >
          <button
            type="button"
            onClick={goTop}
            aria-label="Kembali ke atas"
            className="group flex items-center gap-2.5 rounded-full border border-slate-200/80 bg-white/90 py-2 pl-2 pr-3 text-slate-700 shadow-[0_12px_34px_-12px_rgba(15,23,42,0.32),0_2px_8px_rgba(15,23,42,0.06)] backdrop-blur-xl transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:border-[hsl(161_52%_38%/0.35)] hover:shadow-[0_16px_38px_-12px_rgba(15,23,42,0.35),0_3px_10px_rgba(15,23,42,0.08)] active:translate-y-0"
          >
            <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-slate-50 text-[hsl(161_52%_32%)]">
              <svg className="absolute inset-0 h-8 w-8 -rotate-90" viewBox="0 0 36 36" aria-hidden="true">
                <circle cx="18" cy="18" r="16" fill="none" stroke="currentColor" strokeOpacity="0.12" strokeWidth="1.5" />
                <motion.circle
                  cx="18"
                  cy="18"
                  r="16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  pathLength={1}
                  style={{ pathLength: progress }}
                />
              </svg>
              <motion.span
                animate={reduced ? {} : { y: [1, -2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                aria-hidden="true"
              >
                <ArrowUp className="h-3.5 w-3.5" strokeWidth={2.2} />
              </motion.span>
            </span>
            <span className="hidden text-[12px] font-semibold tracking-[-0.01em] sm:inline">Kembali ke atas</span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Dashboard Preview ────────────────────────────────────────────────────────

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
  const chartBars = [22, 38, 29, 52, 44, 60, 47];
  const maxBar = Math.max(...chartBars);

  return (
    <div
      className="w-full rounded-2xl overflow-hidden border border-slate-200/80"
      style={{ boxShadow: "0 0 0 1px rgba(0,0,0,0.04), 0 24px 64px -12px rgba(0,0,0,0.14), 0 8px 24px -8px rgba(0,0,0,0.08)" }}
    >
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
      <div className="flex" style={{ background: "#fafafa" }}>
        <div className="w-[108px] shrink-0 border-r border-slate-200/60 bg-white flex flex-col py-3">
          <div className="flex items-center gap-1.5 px-3 mb-3">
            <div className="w-5 h-5 rounded-[5px] flex items-center justify-center shrink-0" style={{ background: "hsl(161 52% 26%)" }}>
              <BookOpen className="w-2.5 h-2.5 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-[10px] font-extrabold tracking-[0.06em] text-slate-900">VIREON</span>
          </div>
          <div className="flex flex-col gap-0.5 px-1.5">
            {navItems.map(({ icon: Icon, label, active }) => (
              <div key={label} className={`flex items-center gap-1.5 px-2 py-1.5 rounded-[6px] ${active ? "bg-[hsl(161_52%_26%/0.10)] text-[hsl(161_52%_26%)]" : "text-slate-400"}`}>
                <Icon className="w-2.5 h-2.5 shrink-0" strokeWidth={active ? 2.25 : 1.75} />
                <span className="text-[9px] font-medium leading-none">{label}</span>
              </div>
            ))}
          </div>
          <div className="mt-auto px-2.5 pt-2 border-t border-slate-100 mx-2">
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shrink-0" />
              <div>
                <div className="text-[8px] font-semibold text-slate-700 leading-none">Admin</div>
                <div className="text-[7px] text-slate-400 mt-0.5 leading-none">Tim koleksi</div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex-1 min-w-0 p-3.5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[12px] font-bold text-slate-900 leading-tight">Dashboard</p>
              <p className="text-[9.5px] text-slate-400 mt-0.5">Ruang koleksi Vireon</p>
            </div>
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold" style={{ background: "hsl(161 52% 26% / 0.08)", border: "1px solid hsl(161 52% 26% / 0.2)", color: "hsl(161 52% 26%)" }}>
              <div className="w-1 h-1 rounded-full bg-current animate-pulse" />
              Live
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2 mb-3">
            {cards.map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className="bg-white rounded-lg border border-slate-100 p-2 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                <div className={`w-5 h-5 rounded-[5px] ${bg} flex items-center justify-center mb-1.5`}>
                  <Icon className={`w-2.5 h-2.5 ${color}`} strokeWidth={2} />
                </div>
                {loading ? <div className="h-3.5 w-8 bg-slate-200 rounded animate-pulse mb-0.5" /> : (
                  <p className="text-[13px] font-extrabold text-slate-900 tabular-nums leading-none">{fmt(value ?? 0)}</p>
                )}
                <p className="text-[8px] text-slate-400 font-medium mt-0.5 leading-tight">{label}</p>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-lg border border-slate-100 p-2.5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[9.5px] font-semibold text-slate-700">Tren Peminjaman</p>
              <span className="text-[8px] text-slate-400">7 bulan terakhir</span>
            </div>
            <div className="flex items-end gap-1 h-9">
              {chartBars.map((h, i) => (
                <div key={i} className="flex-1 rounded-sm transition-all" style={{ height: `${(h / maxBar) * 100}%`, background: i === chartBars.length - 1 ? "hsl(161 52% 30%)" : "hsl(161 52% 30% / 0.25)" }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
// Word-by-word blur-focus reveal on headline. Each word materialises
// from a blurred haze and rises into position — 0.08 s apart.

function HeroSection() {
  const { data: stats, isLoading } = useLandingStats();
  const reduced = useReducedMotion();
  const { scrollY } = useScroll();
  const bgY = useTransform(scrollY, [0, 700], ["0%", "18%"]);
  // Parallax out: content rises as user scrolls
  const contentY = useTransform(scrollY, [0, 600], ["0px", "-40px"]);
  const contentOpacity = useTransform(scrollY, [0, 500], [1, 0.4]);
  const previewY = useTransform(scrollY, [0, 720], ["0px", "46px"]);

  const wordAnim = (delay: number) =>
    reduced
      ? {}
      : {
          initial: { opacity: 0, y: 32, filter: "blur(10px)" },
          animate: { opacity: 1, y: 0, filter: "blur(0px)" },
          transition: { duration: 0.75, delay, ease: E_OUT },
        };

  return (
    <section className="relative min-h-[92vh] flex items-center pt-[60px] overflow-hidden">
      {/* Library bg with parallax */}
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

      {/* Overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "linear-gradient(135deg, hsl(161 62% 5% / 0.91) 0%, hsl(161 48% 9% / 0.82) 55%, hsl(161 38% 8% / 0.86) 100%)" }}
        aria-hidden="true"
      />
      <div
        className="absolute inset-x-0 top-0 h-36 pointer-events-none"
        style={{ background: "linear-gradient(to bottom, hsl(161 62% 4% / 0.55), transparent)" }}
        aria-hidden="true"
      />

      {/* Content scrolls out smoothly */}
      <motion.div
        className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-16 lg:py-24"
        style={reduced ? {} : { y: contentY, opacity: contentOpacity }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-[5fr_7fr] gap-12 lg:gap-16 items-center">

          {/* Left — copy */}
          <div className="max-w-lg">
            {/* Badge */}
            <motion.div {...fadeUp(0, reduced ?? false)}>
              <div
                className="inline-flex items-center gap-2 text-[11.5px] font-semibold px-3 py-1.5 rounded-full mb-7"
                style={{ background: "hsl(161 52% 68% / 0.13)", border: "1px solid hsl(161 52% 68% / 0.30)", color: "hsl(161 52% 78%)" }}
              >
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "hsl(161 52% 65%)" }} aria-hidden="true" />
                Ruang Baca Digital
              </div>
            </motion.div>

            {/* Headline — word-by-word blur-reveal */}
            <h1
              className="text-[2.75rem] sm:text-5xl lg:text-[3.25rem] xl:text-[3.75rem] font-extrabold text-white leading-[1.1] tracking-[-0.03em]"
              aria-label="Bikin perpustakaan terasa lebih hidup"
            >
              <span className="block">
                {["Kelola", "Perpustakaan"].map((w, i) => (
                  <motion.span
                    key={w}
                    {...wordAnim(0.05 + i * 0.09)}
                    className="inline-block"
                    style={{ marginRight: "0.22em" }}
                  >
                    {w}
                  </motion.span>
                ))}
              </span>
              <span className="block">
                {["lebih", "efisien"].map((w, i) => (
                  <motion.span
                    key={w}
                    {...wordAnim(0.23 + i * 0.09)}
                    className="inline-block"
                    style={{ marginRight: "0.22em" }}
                  >
                    {w}
                  </motion.span>
                ))}
              </span>
              <span className="block mt-1">
                <motion.span
                  {...wordAnim(0.41)}
                  className="inline-block"
                  style={{
                    background: "linear-gradient(135deg, hsl(161 68% 58%) 0%, hsl(150 80% 70%) 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  Lebih Mudah
                </motion.span>
              </span>
            </h1>

          {/* Sub — blur-fade */}
            <motion.p
              {...fadeBlurUp(0.5, reduced ?? false)}
              className="mt-6 text-[1.0625rem] text-white/62 leading-[1.65] max-w-[420px]"
            >
              VIREON merapikan semua yang terjadi di ruang baca — dari menemukan
              buku sampai menutup transaksi — biar lebih banyak waktu buat membaca.
            </motion.p>

            {/* CTAs — spring scale-in */}
            <motion.div
              initial={reduced ? {} : { opacity: 0, scale: 0.93, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 120, damping: 14, delay: 0.62 }}
              className="mt-8 flex flex-wrap items-center gap-3"
            >
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-5 py-3 text-[14px] font-semibold text-white rounded-[10px] transition-all duration-150 active:scale-[0.98] min-h-[44px]"
                style={{
                  background: "hsl(161 52% 38%)",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.35), 0 0 0 1px hsl(161 52% 55% / 0.35)",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "hsl(161 52% 44%)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "hsl(161 52% 38%)"; }}
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

            {/* Trust signals — staggered slide from left */}
            <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2">
              {["Tidak perlu instalasi", "Data aman & terenkripsi", "Pembaruan otomatis"].map((item, i) => (
                <motion.div
                  key={item}
                  initial={reduced ? {} : { opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.45, delay: 0.72 + i * 0.1, ease: E_OUT }}
                  className="flex items-center gap-1.5 text-[12.5px] text-white/48"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" style={{ color: "hsl(161 52% 62%)" }} />
                  {item}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Right — dashboard preview with floating bob */}
          <motion.div
            initial={reduced ? {} : { opacity: 0, x: 28, scale: 0.97 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.14, ease: E_OUT }}
            className="relative w-full"
          >
            {/* Ambient glow */}
            <div
              className="absolute -inset-12 pointer-events-none"
              style={{ background: "radial-gradient(ellipse 75% 65% at 50% 50%, hsl(161 52% 55% / 0.18) 0%, transparent 70%)" }}
              aria-hidden="true"
            />

            {/* Top chip */}
            <motion.div
              initial={reduced ? {} : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.58, ease: E_OUT }}
              className="absolute -top-4 right-6 z-10 flex items-center gap-2 bg-white border border-slate-200/80 rounded-full px-3 py-1.5 shadow-[0_6px_20px_rgba(0,0,0,0.14),0_1px_3px_rgba(0,0,0,0.08)]"
              aria-hidden="true"
            >
              <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "hsl(161 52% 44%)" }} />
              <span className="text-[11.5px] font-semibold text-slate-700">Sistem Aktif</span>
            </motion.div>

            {/* Bottom chip */}
            <motion.div
              initial={reduced ? {} : { opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.68, ease: E_OUT }}
              className="absolute -bottom-4 left-6 z-10 flex items-center gap-2 bg-white border border-slate-200/80 rounded-full px-3 py-1.5 shadow-[0_6px_20px_rgba(0,0,0,0.14),0_1px_3px_rgba(0,0,0,0.08)]"
              aria-hidden="true"
            >
              <Clock className="w-3 h-3" style={{ color: "hsl(161 52% 44%)" }} />
              <span className="text-[11.5px] font-semibold text-slate-700">Diperbarui real-time</span>
            </motion.div>

            {/* Subtle perpetual float */}
            <motion.div style={reduced ? {} : { y: previewY }}>
              <DashboardPreview stats={stats} loading={isLoading} />
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      {/* Bottom fade */}
      <div
        className="absolute inset-x-0 bottom-0 h-36 pointer-events-none"
        style={{ background: "linear-gradient(to bottom, transparent, #fbfaf6)" }}
        aria-hidden="true"
      />
    </section>
  );
}

// ─── Marquee Ticker ───────────────────────────────────────────────────────────
// Pauses on hover using AnimationControls

function MarqueeTicker() {
  const doubled = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS];
  const reduced = useReducedMotion();
  const controls = useAnimation();

  useEffect(() => {
    if (reduced) return;
    controls.start({ x: ["0%", "-50%"], transition: { duration: 28, repeat: Infinity, ease: "linear" } });
  }, [controls, reduced]);

  return (
    <div
      className="relative py-3.5 overflow-hidden border-y border-slate-200/60"
      style={{ background: "hsl(161 52% 26%)" }}
      aria-hidden="true"
      onMouseEnter={() => !reduced && controls.stop()}
      onMouseLeave={() => !reduced && controls.start({ x: ["0%", "-50%"], transition: { duration: 28, repeat: Infinity, ease: "linear" } })}
    >
      <div className="absolute left-0 top-0 bottom-0 w-24 z-10 pointer-events-none" style={{ background: "linear-gradient(to right, hsl(161 52% 26%), transparent)" }} />
      <div className="absolute right-0 top-0 bottom-0 w-24 z-10 pointer-events-none" style={{ background: "linear-gradient(to left, hsl(161 52% 26%), transparent)" }} />

      <motion.div animate={controls} className="flex items-center whitespace-nowrap">
        {doubled.map((item, i) => (
          <div key={i} className="flex items-center gap-5 px-5">
            <span className="text-[11.5px] font-semibold text-white/70 tracking-[0.06em] uppercase">{item}</span>
            <div className="w-[3px] h-[3px] rounded-full shrink-0" style={{ background: "rgba(255,255,255,0.35)" }} />
          </div>
        ))}
      </motion.div>
    </div>
  );
}

// ─── Stats ────────────────────────────────────────────────────────────────────
// Each card enters from a unique direction; numbers count up when visible.

function AnimatedStatCard({
  label, value, icon: Icon, index, isLoading, reduced,
}: {
  label: string;
  value: number | undefined;
  icon: React.ElementType;
  index: number;
  isLoading: boolean;
  reduced: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const count = useCountUp(value ?? 0, isInView && !isLoading);

  // Four distinctly different entrance styles
  const entries = [
    { initial: { x: -60, opacity: 0, rotate: -2, scale: 0.95 } },
    { initial: { y: 60, opacity: 0, scale: 0.9 } },
    { initial: { x: 60, opacity: 0, rotate: 2, scale: 0.95 } },
    { initial: { y: -40, opacity: 0, scale: 0.88, rotate: 1 } },
  ];

  return (
    <motion.div
      ref={ref}
      initial={reduced ? {} : entries[index % 4].initial}
      animate={isInView ? { x: 0, y: 0, opacity: 1, rotate: 0, scale: 1 } : {}}
      transition={{ duration: 0.72, delay: index * 0.1, ease: E_OUT }}
      className="group relative py-9 px-6 lg:px-8"
    >
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
        style={{ background: "hsl(161 52% 26% / 0.025)" }}
      />
      <div className="relative">
        <Icon className="w-4 h-4 mb-3" strokeWidth={1.75} style={{ color: "hsl(161 52% 38%)" }} />
        {isLoading ? (
          <Sk w="w-16" h="h-8" />
        ) : (
          <p className="text-[2rem] font-extrabold text-slate-900 tabular-nums tracking-tight leading-none">
            {fmt(count)}
            {(value ?? 0) > 0 && (
              <span className="text-base font-bold ml-0.5" style={{ color: "hsl(161 52% 38%)" }}>+</span>
            )}
          </p>
        )}
        <p className="mt-2 text-[13px] text-slate-500 font-medium">{label}</p>
      </div>
    </motion.div>
  );
}

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
          {items.map(({ label, value, icon }, i) => (
            <AnimatedStatCard
              key={label}
              label={label}
              value={value}
              icon={icon}
              index={i}
              isLoading={isLoading}
              reduced={reduced ?? false}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── How It Works ─────────────────────────────────────────────────────────────
// Connector line draws in; each step enters from left/bottom/right.

function HowItWorksSection() {
  const reduced = useReducedMotion();

  // Entry directions: step 0 from left, 1 from below, 2 from right
  const stepEntries = [
    { initial: { x: -52, opacity: 0, rotate: -1.5 }, transition: { duration: 0.68, delay: 0.14, ease: E_OUT } },
    { initial: { y: 52, opacity: 0, scale: 0.94 },   transition: { duration: 0.68, delay: 0.28, ease: E_OUT } },
    { initial: { x: 52, opacity: 0, rotate: 1.5 },   transition: { duration: 0.68, delay: 0.42, ease: E_OUT } },
  ];

  return (
    <section id="how" className="relative py-24 sm:py-32 overflow-hidden" style={{ background: "#f8f9fa" }}>
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <svg className="absolute inset-0 w-full h-full opacity-[0.022]">
          <defs>
            <pattern id="how-grid" x="0" y="0" width="48" height="48" patternUnits="userSpaceOnUse">
              <path d="M 48 0 L 0 0 0 48" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-slate-900" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#how-grid)" />
        </svg>
        <div className="absolute top-0 right-0 w-[500px] h-[500px]" style={{ background: "radial-gradient(ellipse at 100% 0%, hsl(161 52% 30% / 0.06) 0%, transparent 60%)" }} />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with label reveal */}
        <motion.div {...fadeUpView(0, reduced ?? false)} className="max-w-xl mb-16">
          <motion.p
            initial={reduced ? {} : { clipPath: "inset(0 100% 0 0)", opacity: 0 }}
            whileInView={{ clipPath: "inset(0 0% 0 0)", opacity: 1 }}
            viewport={{ once: true, margin: "-56px" }}
            transition={{ duration: 0.6, ease: E_OUT }}
            className="text-[11.5px] font-bold uppercase tracking-[0.1em] mb-3"
            style={{ color: "hsl(161 52% 32%)" }}
          >
            Cara Kerja
          </motion.p>
          <h2 className="text-[2rem] sm:text-[2.5rem] font-extrabold text-slate-900 tracking-[-0.025em] leading-[1.1]">
            Mulai Digunakan dalam
            <br />
            Tiga Langkah
          </h2>
          <p className="mt-4 text-[15px] text-slate-500 leading-relaxed">
            Tidak perlu jadi ahli teknologi. VIREON terasa jelas sejak pertama
            dibuka, baik untuk tim perpustakaan maupun pembaca.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 relative">
          {/* Connector: line draws in left → right */}
          <motion.div
            initial={reduced ? {} : { scaleX: 0, opacity: 0 }}
            whileInView={{ scaleX: 1, opacity: 1 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 1.4, delay: 0.5, ease: E_OUT }}
            style={{ transformOrigin: "left center" }}
            className="hidden md:block absolute top-[26px] left-[calc(33.33%_-_12px)] right-[calc(33.33%_-_12px)] h-[1px]"
            aria-hidden="true"
          >
            <div
              className="w-full h-full"
              style={{ background: "linear-gradient(to right, transparent, hsl(161 52% 36% / 0.35) 25%, hsl(161 52% 36% / 0.35) 75%, transparent)" }}
            />
          </motion.div>

          {HOW_STEPS.map(({ icon: Icon, num, title, desc }, i) => (
            <motion.div
              key={title}
              initial={reduced ? {} : stepEntries[i].initial}
              whileInView={reduced ? {} : { x: 0, y: 0, opacity: 1, rotate: 0, scale: 1 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={reduced ? {} : stepEntries[i].transition}
              className="flex flex-col"
            >
              <div className="flex items-center gap-4 mb-5">
                {/* Icon box with rotate-in */}
                <motion.div
                  initial={reduced ? {} : { rotateY: -90, opacity: 0 }}
                  whileInView={reduced ? {} : { rotateY: 0, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.55, delay: 0.5 + i * 0.14, ease: E_OUT }}
                  className="w-[52px] h-[52px] rounded-2xl flex items-center justify-center shrink-0 relative"
                  style={{
                    background: "white",
                    border: "1.5px solid hsl(161 52% 36% / 0.25)",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 0 0 4px hsl(161 52% 36% / 0.06)",
                  }}
                >
                  <Icon className="w-5 h-5" strokeWidth={1.75} style={{ color: "hsl(161 52% 30%)" }} />
                  <div
                    className="absolute -top-2 -right-2 w-[18px] h-[18px] rounded-full flex items-center justify-center"
                    style={{ background: "hsl(161 52% 26%)" }}
                  >
                    <span className="text-[9px] font-bold text-white">{i + 1}</span>
                  </div>
                </motion.div>
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

        {/* CTA */}
        <motion.div {...fadeUpView(0.36, reduced ?? false)} className="mt-16 flex justify-start">
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
// Each bento card has a unique entrance direction + 3D mouse-tilt on hover.

function FeatureCard({
  feature, index, reduced,
}: {
  feature: typeof FEATURES[number];
  index: number;
  reduced: boolean;
}) {
  const tilt = useCardTilt(5, reduced);
  const Icon = feature.icon;
  const isWide = feature.span === "lg:col-span-2";

  // Unique entry per card — no two the same
  const entries = [
    { initial: { x: -60, opacity: 0, rotate: -2 } },   // 0: left + tilt
    { initial: { y: -50, opacity: 0, scale: 0.9 } },   // 1: top + scale
    { initial: { x: 60, opacity: 0, rotate: 2 } },     // 2: right + tilt
    { initial: { y: 60, opacity: 0, rotate: -1.5 } },  // 3: bottom + tilt
    { initial: { x: -50, opacity: 0, scale: 0.92 } },  // 4: left + scale
    { initial: { x: 50, opacity: 0, scale: 0.92 } },   // 5: right + scale
  ];

  const entry = entries[index % entries.length];

  return (
    <motion.div
      initial={reduced ? {} : entry.initial}
      whileInView={reduced ? {} : { x: 0, y: 0, opacity: 1, rotate: 0, scale: 1 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={reduced ? {} : { duration: 0.68, delay: index * 0.07, ease: E_OUT }}
      onMouseMove={tilt.onMouseMove}
      onMouseLeave={tilt.onMouseLeave}
      className={`group relative rounded-2xl p-6 border overflow-hidden cursor-default ${
        feature.accent
          ? "border-transparent"
          : "border-slate-200/70 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
      } hover:shadow-[0_12px_36px_rgba(0,0,0,0.1)] hover:border-[hsl(161_52%_36%/0.3)] transition-all duration-300 ${feature.span}`}
      style={{
        ...(feature.accent
          ? { background: "linear-gradient(140deg, hsl(161 52% 26% / 0.06) 0%, hsl(161 52% 26% / 0.02) 100%)", border: "1px solid hsl(161 52% 36% / 0.18)" }
          : {}),
        ...(reduced ? {} : { rotateX: tilt.rotateX, rotateY: tilt.rotateY }),
      }}
    >
      {/* Top accent line on hover */}
      <div
        className="absolute inset-x-0 top-0 h-[1.5px] opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        style={{ background: "linear-gradient(to right, transparent, hsl(161 52% 36% / 0.6) 40%, hsl(161 52% 36% / 0.6) 60%, transparent)" }}
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
        style={{ background: "hsl(161 52% 26% / 0.09)", border: "1px solid hsl(161 52% 36% / 0.18)" }}
      >
        <Icon className="w-[18px] h-[18px]" strokeWidth={1.75} style={{ color: "hsl(161 52% 28%)" }} />
      </div>

      <h3 className="text-[15px] font-bold text-slate-900 mb-2 tracking-tight">{feature.title}</h3>
      <p className="text-[13.5px] text-slate-500 leading-relaxed">{feature.desc}</p>

      {isWide && (
        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-1.5">
          <span className="text-[12px] font-semibold" style={{ color: "hsl(161 52% 30%)" }}>Lihat demo</span>
          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform duration-150" style={{ color: "hsl(161 52% 30%)" }} />
        </div>
      )}
    </motion.div>
  );
}

function FeaturesSection() {
  const reduced = useReducedMotion();

  return (
    <section id="features" className="relative py-24 sm:py-32 bg-[#fbfaf6] overflow-hidden">
      <div
        className="absolute -top-24 left-1/2 -translate-x-1/2 w-[800px] h-[600px] pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 50% 0%, hsl(161 52% 30% / 0.05) 0%, transparent 60%)" }}
        aria-hidden="true"
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div {...fadeUpView(0, reduced ?? false)} className="max-w-xl mb-14">
          <motion.p
            initial={reduced ? {} : { clipPath: "inset(0 100% 0 0)", opacity: 0 }}
            whileInView={{ clipPath: "inset(0 0% 0 0)", opacity: 1 }}
            viewport={{ once: true, margin: "-56px" }}
            transition={{ duration: 0.6, ease: E_OUT }}
            className="text-[11.5px] font-bold uppercase tracking-[0.1em] mb-3"
            style={{ color: "hsl(161 52% 32%)" }}
          >
            Fitur Lengkap
          </motion.p>
          <h2 className="text-[2rem] sm:text-[2.5rem] font-extrabold text-slate-900 tracking-[-0.025em] leading-[1.1]">
            Semua yang Dibutuhkan
            <br />
            dalam Satu Ruang
          </h2>
          <p className="mt-4 text-[15px] text-slate-500 leading-relaxed">
            Kelola perpustakaan jadi lebih mudah. Koleksi, peminjaman, anggota, sampai laporan, semuanya lebih rapi dalam satu sistem.
          </p>
        </motion.div>

        {/* Bento grid — each card has unique entrance + 3D hover tilt */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
          {FEATURES.map((feature, i) => (
            <FeatureCard key={feature.title} feature={feature} index={i} reduced={reduced ?? false} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── About / Benefits ─────────────────────────────────────────────────────────
// Left text slides from left, right cards stagger from right.
// Background radial has subtle scroll-driven parallax.

function AboutSection() {
  const reduced = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  // Background radial drifts leftward as you scroll
  const bgX = useTransform(scrollYProgress, [0, 1], ["0%", "-12%"]);

  const points = [
    {
      icon: Zap, title: "Dirancang untuk Kecepatan",
      desc: "Alur kerja yang meminimalkan langkah. Dari input buku hingga cetak laporan — semua dalam hitungan detik.",
    },
    {
      icon: Layers, title: "Terintegrasi Penuh",
      desc: "Semua modul terhubung. Perubahan di satu bagian langsung tercermin di seluruh sistem secara otomatis.",
    },
    {
      icon: RefreshCw, title: "Data Selalu Terkini",
      desc: "Semua perubahan langsung ikut tersinkron, jadi info yang kamu lihat selalu terasa up to date.",
    },
  ];

  return (
    <section
      ref={sectionRef}
      id="about"
      className="relative py-24 sm:py-32 overflow-hidden"
      style={{ background: "#f8f9fa" }}
    >
      {/* Top border accent */}
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: "linear-gradient(to right, transparent, hsl(161 52% 36% / 0.25) 40%, hsl(161 52% 36% / 0.25) 60%, transparent)" }}
        aria-hidden="true"
      />

      {/* Parallax radial blob */}
      <motion.div
        className="absolute -left-32 top-1/2 -translate-y-1/2 w-[500px] h-[500px] pointer-events-none"
        style={{ x: reduced ? undefined : bgX, background: "radial-gradient(circle, hsl(161 52% 30% / 0.06) 0%, transparent 65%)" }}
        aria-hidden="true"
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">

          {/* Left — text, slides from left */}
          <motion.div {...fadeLeftView(0, reduced ?? false)}>
            <motion.p
              initial={reduced ? {} : { clipPath: "inset(0 100% 0 0)", opacity: 0 }}
              whileInView={{ clipPath: "inset(0 0% 0 0)", opacity: 1 }}
              viewport={{ once: true, margin: "-56px" }}
              transition={{ duration: 0.55, ease: E_OUT }}
              className="text-[11.5px] font-bold uppercase tracking-[0.1em] mb-3"
              style={{ color: "hsl(161 52% 32%)" }}
            >
              Mengapa VIREON
            </motion.p>
            <h2 className="text-[2rem] sm:text-[2.5rem] font-extrabold text-slate-900 tracking-[-0.025em] leading-[1.1] mb-5">
              Dirancang untuk
              <br />
              Kemudahan Sehari-hari
            </h2>
            <p className="text-[15px] text-slate-500 leading-relaxed mb-8">
              Ruang baca yang rapi bikin orang lebih gampang menemukan bacaan
              berikutnya. VIREON bantu tim bergerak cepat tanpa bikin proses
              terasa ribet.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-5 py-3 text-[14px] font-semibold text-white rounded-[10px] transition-all duration-150 active:scale-[0.98] min-h-[44px]"
              style={{ background: "hsl(161 52% 26%)", boxShadow: "0 1px 3px rgba(0,0,0,0.2), 0 0 0 1px hsl(161 52% 20% / 0.5)" }}
            >
              Coba Sekarang
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>

          {/* Right — benefit cards, stagger from right */}
          <div className="space-y-3.5">
            {points.map(({ icon: Icon, title, desc }, i) => (
              <motion.div
                key={title}
                initial={reduced ? {} : { x: 56, opacity: 0, scale: 0.96 }}
                whileInView={reduced ? {} : { x: 0, opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={reduced ? {} : { duration: 0.62, delay: i * 0.12, ease: E_OUT }}
                whileHover={reduced ? {} : { x: 4, transition: { duration: 0.18 } }}
                className="group flex items-start gap-4 p-5 bg-white rounded-2xl border border-slate-200/70 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_6px_24px_rgba(0,0,0,0.08)] hover:border-[hsl(161_52%_36%/0.25)] transition-all duration-200"
              >
                <div
                  className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center mt-0.5"
                  style={{ background: "hsl(161 52% 26% / 0.08)", border: "1px solid hsl(161 52% 36% / 0.2)" }}
                >
                  <Icon className="w-[18px] h-[18px]" strokeWidth={1.75} style={{ color: "hsl(161 52% 28%)" }} />
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
// Word-split headline with variants + staggerChildren.
// Background orbs drift on scroll via parallax.

const ctaWordVariants = {
  hidden: { opacity: 0, y: 32, filter: "blur(8px)" },
  visible: {
    opacity: 1, y: 0, filter: "blur(0px)",
    transition: { duration: 0.7, ease: E_OUT },
  },
};

const ctaContainerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

function CTASection() {
  const reduced = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start end", "end start"] });

  // Orbs drift on scroll — left moves left, right moves right
  const orbLeftX  = useTransform(scrollYProgress, [0, 1], ["-10%", "10%"]);
  const orbRightX = useTransform(scrollYProgress, [0, 1], ["10%", "-10%"]);
  const orbScale  = useTransform(scrollYProgress, [0, 0.5, 1], [0.85, 1.15, 0.9]);

  // Grid rotates very subtly
  const gridRot = useTransform(scrollYProgress, [0, 1], ["0deg", "1.5deg"]);

  return (
    <section
      ref={sectionRef}
      className="relative py-24 sm:py-32 overflow-hidden"
      style={{ background: "hsl(220 40% 6%)" }}
    >
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <motion.svg
          className="absolute inset-0 w-full h-full opacity-[0.03]"
          style={reduced ? {} : { rotate: gridRot }}
        >
          <defs>
            <pattern id="cta-grid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#cta-grid)" />
        </motion.svg>

        {/* Left orb — parallax drift */}
        <motion.div
          className="absolute -left-32 top-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
          style={{
            background: "radial-gradient(circle, hsl(161 52% 36% / 0.22) 0%, transparent 60%)",
            ...(reduced ? {} : { x: orbLeftX, scale: orbScale }),
          }}
        />
        {/* Right orb */}
        <motion.div
          className="absolute -right-32 top-1/2 -translate-y-1/2 w-[480px] h-[480px] rounded-full"
          style={{
            background: "radial-gradient(circle, hsl(161 52% 36% / 0.14) 0%, transparent 65%)",
            ...(reduced ? {} : { x: orbRightX, scale: orbScale }),
          }}
        />

        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center">
          {/* Badge — scale in */}
          <motion.div {...scaleView(0, reduced ?? false)} className="inline-block mb-8">
            <div
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-[0.08em]"
              style={{ background: "hsl(161 52% 36% / 0.14)", border: "1px solid hsl(161 52% 50% / 0.25)", color: "hsl(161 52% 65%)" }}
            >
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "hsl(161 52% 60%)" }} />
              Siap Digunakan Sekarang
            </div>
          </motion.div>

          {/* Headline — word-split with variants + stagger */}
          <motion.h2
            variants={reduced ? {} : ctaContainerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="text-[2.5rem] sm:text-[3rem] lg:text-[3.5rem] font-extrabold text-white tracking-[-0.03em] leading-[1.05] mb-5"
            aria-label="Siap Mengubah Cara Mengelola Perpustakaan?"
          >
            <span className="block">
              {["Siap", "Mengubah", "Cara"].map((w) => (
                <motion.span key={w} variants={reduced ? {} : ctaWordVariants} className="inline-block mr-[0.2em]">{w}</motion.span>
              ))}
            </span>
            <span className="block">
              {["Mengelola", "Perpustakaan?"].map((w) => (
                <motion.span key={w} variants={reduced ? {} : ctaWordVariants} className="inline-block mr-[0.2em]">{w}</motion.span>
              ))}
            </span>
          </motion.h2>

          {/* Sub — blur fade */}
          <motion.p {...fadeUpView(0.2, reduced ?? false)} className="text-[15px] text-white/50 leading-relaxed mb-10 max-w-lg mx-auto">
            Tidak perlu instalasi rumit, tidak perlu konfigurasi panjang — cukup
            masuk dan mulai bekerja.
          </motion.p>

          {/* Buttons — spring entrance */}
          <motion.div
            initial={reduced ? {} : { opacity: 0, scale: 0.9, y: 16 }}
            whileInView={reduced ? {} : { opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true }}
            transition={reduced ? {} : { type: "spring", stiffness: 100, damping: 14, delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-3"
          >
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
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
// Three columns stagger in with brief delay

function LandingFooter() {
  const year = new Date().getFullYear();
  const reduced = useReducedMotion();

  return (
    <footer className="bg-white border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-14">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">

          {/* Brand */}
          <motion.div
            {...fadeLeftView(0, reduced ?? false)}
            className="md:col-span-5"
          >
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 shrink-0">
                <img
                  src={VIREON_LOGO}
                  alt="VIREON"
                  className="w-full h-full object-contain"
                  loading="eager"
                  fetchPriority="high"
                  decoding="sync"
                />
              </div>
              <div className="leading-none">
                <div className="text-[13px] font-bold text-slate-900 tracking-[0.05em]">VIREON</div>
                <div className="text-[9.5px] font-medium text-slate-400 uppercase tracking-[0.14em] mt-0.5">Library System</div>
              </div>
            </div>
            <p className="text-[13.5px] text-slate-500 leading-relaxed max-w-[280px] mb-5">
              Sistem manajemen perpustakaan digital yang ringan, cepat, dan mudah disukai.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {["Koleksi", "Anggota", "Peminjaman", "Laporan"].map((tag, i) => (
                <motion.span
                  key={tag}
                  initial={reduced ? {} : { opacity: 0, scale: 0.8 }}
                  whileInView={reduced ? {} : { opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={reduced ? {} : { duration: 0.35, delay: 0.1 + i * 0.07, ease: E_OUT }}
                  className="text-[10.5px] font-medium px-2.5 py-0.5 rounded-full"
                  style={{ background: "hsl(161 52% 26% / 0.07)", border: "1px solid hsl(161 52% 36% / 0.18)", color: "hsl(161 52% 32%)" }}
                >
                  {tag}
                </motion.span>
              ))}
            </div>
          </motion.div>

          {/* Nav */}
          <motion.div {...fadeUpView(0.1, reduced ?? false)} className="md:col-span-3">
            <h3 className="text-[11px] font-bold text-slate-900 uppercase tracking-[0.08em] mb-4">Navigasi</h3>
            <ul className="space-y-3">
              {[{ label: "Cara Kerja", id: "how" }, { label: "Fitur", id: "features" }, { label: "Tentang", id: "about" }].map(({ label, id }) => (
                <li key={label}>
                  <button onClick={() => scrollTo(id)} className="text-[13.5px] text-slate-500 hover:text-slate-900 transition-colors duration-150">{label}</button>
                </li>
              ))}
              <li>
                <Link href="/login" className="text-[13.5px] text-slate-500 hover:text-slate-900 transition-colors duration-150">Masuk</Link>
              </li>
            </ul>
          </motion.div>

          {/* Info + contact */}
          <motion.div {...fadeRightView(0.18, reduced ?? false)} className="md:col-span-4">
            <h3 className="text-[11px] font-bold text-slate-900 uppercase tracking-[0.08em] mb-4">Informasi</h3>
            <ul className="space-y-3">
              <li>
                <p className="text-[13px] text-slate-400">Dikembangkan oleh</p>
                <p className="text-[13.5px] font-semibold text-slate-700 mt-0.5">REYHAN IRZA</p>
              </li>
              <li><p className="text-[13.5px] text-slate-500">Dibuat untuk ruang baca yang terus tumbuh.</p></li>
              <li>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: "hsl(161 52% 26% / 0.07)", border: "1px solid hsl(161 52% 36% / 0.18)" }}>
                  <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "hsl(161 52% 44%)" }} />
                  <span className="text-[10.5px] font-medium" style={{ color: "hsl(161 52% 30%)" }}>Sistem Aktif</span>
                </div>
              </li>
            </ul>

            <div className="mt-7 pt-6 border-t border-slate-100">
              <p className="text-[11px] font-bold text-slate-900 uppercase tracking-[0.08em] mb-2">Kerja sama &amp; feedback</p>
              <p className="text-[13px] text-slate-500 leading-relaxed max-w-[250px] mb-3.5">
                Punya ide, pertanyaan, atau ingin berkolaborasi? Hubungi kami.
              </p>
              <div className="flex items-center gap-2.5">
                <a
                  href="https://wa.me/6281385242876"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Hubungi melalui WhatsApp"
                  title="WhatsApp"
                  className="group inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/80 bg-white text-slate-500 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-600 hover:shadow-[0_6px_16px_rgba(16,185,129,0.14)] focus-visible:outline-none"
                >
                  <MessageCircle className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
                  <span className="sr-only">WhatsApp</span>
                </a>
                <a
                  href="https://instagram.com/irzalvano_"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Kunjungi Instagram @irzalvano_"
                  title="Instagram"
                  className="group inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/80 bg-white text-slate-500 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:border-fuchsia-200 hover:bg-fuchsia-50 hover:text-fuchsia-600 hover:shadow-[0_6px_16px_rgba(217,70,239,0.14)] focus-visible:outline-none"
                >
                  <Instagram className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
                  <span className="sr-only">Instagram @irzalvano_</span>
                </a>
                <a
                  href="mailto:irzanour@gmail.com"
                  aria-label="Kirim email ke irzanour@gmail.com"
                  title="Email"
                  className="group inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/80 bg-white text-slate-500 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:border-sky-200 hover:bg-sky-50 hover:text-sky-600 hover:shadow-[0_6px_16px_rgba(14,165,233,0.14)] focus-visible:outline-none"
                >
                  <Mail className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
                  <span className="sr-only">Email irzanour@gmail.com</span>
                </a>
                <a
                  href="https://github.com/Reyhan-irza"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Kunjungi GitHub Reyhan Irza"
                  title="GitHub"
                  className="group inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/80 bg-white text-slate-500 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900 hover:shadow-[0_6px_16px_rgba(15,23,42,0.12)] focus-visible:outline-none"
                >
                  <Github className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
                  <span className="sr-only">GitHub Reyhan Irza</span>
                </a>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[12px] text-slate-400">&copy; {year} Vireon Library. Dibuat untuk ruang baca yang terus tumbuh.</p>
          <p className="text-[12px] text-slate-400">Dirancang dan dikembangkan oleh <span className="font-mono tracking-[0.08em] text-slate-600">REYHAN IRZA</span></p>
        </div>
      </div>
    </footer>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  useEffect(() => {
    const root = document.documentElement;
    const wasDark = root.classList.contains("dark");
    root.classList.remove("dark");
    return () => {
      if (wasDark) root.classList.add("dark");
    };
  }, []);

  return (
    <div className="vireon-cursor-active relative min-h-screen bg-[#fbfaf6] text-slate-900 overflow-x-hidden">
      <CustomCursor />
      <LandingNav />
      <ScrollUpDock />
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
