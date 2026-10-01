

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
} from "framer-motion";
import { useEffect, useRef, useState, useCallback } from "react";
import {
  BookOpen,
  Users,
  ArrowLeftRight,
  BarChart3,
  Search,
  ShieldCheck,
  RefreshCw,
  ChevronRight,
  CheckCircle2,
  Database,
  TrendingUp,
  ArrowRight,
  ArrowUp,
  Instagram,
  Mail,
  MessageCircle,
  Github,
  BookMarked,
  Sparkles,
} from "lucide-react";
import VIREON_LOGO, { VIREON_WORDMARK } from "@/assets/logo";
import { useLandingStats, usePublicCatalog } from "@/hooks/api";
import "@/components/landing-marquee.css";
import {
  LandingMobileMenu,
  MobileMenuMark,
} from "@/components/landing-mobile-menu";
import {
  useGsapAmbientScroll,
  useGsapHeroChoreography,
  useGsapLandingScroll,
  useGsapMagnetic,
  useGsapNavChoreography,
  useGsapProductReveal,
} from "@/hooks/use-gsap-motion";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  return n.toLocaleString("id-ID");
}

function scrollTo(id: string) {
  const target = document.getElementById(id);
  if (!target) return;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const navOffset = 72;
  const top = target.getBoundingClientRect().top + window.scrollY - navOffset;

  window.scrollTo({ top, behavior: reduced ? "auto" : "smooth" });
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
    initial: false,
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-56px" },
    transition: { duration: 0.58, delay, ease: E_OUT },
  };
}

/** Scroll-triggered: slide from left */
function fadeLeftView(delay = 0, reduced = false) {
  if (reduced) return {};
  return {
    initial: false,
    whileInView: { opacity: 1, x: 0, rotate: 0 },
    viewport: { once: true, margin: "-56px" },
    transition: { duration: 0.65, delay, ease: E_OUT },
  };
}

/** Scroll-triggered: slide from right */
function fadeRightView(delay = 0, reduced = false) {
  if (reduced) return {};
  return {
    initial: false,
    whileInView: { opacity: 1, x: 0, rotate: 0 },
    viewport: { once: true, margin: "-56px" },
    transition: { duration: 0.65, delay, ease: E_OUT },
  };
}

/** Scroll-triggered: scale-in from slightly small */
function scaleView(delay = 0, reduced = false) {
  if (reduced) return {};
  return {
    initial: false,
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

function useCountUp(target: number, active: boolean, duration = 1.8, reduced = false) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active) return;
    if (target === 0) { setValue(0); return; }
    if (reduced) {
      setValue(target);
      return;
    }

    let start = 0;
    let frame = 0;
    const step = (ts: number) => {
      if (!start) start = ts;
      const elapsed = ts - start;
      const progress = Math.min(elapsed / (duration * 1000), 1);
      // easeOutQuart
      const eased = 1 - Math.pow(1 - progress, 4);
      setValue(Math.round(eased * target));
      if (progress < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target, active, duration, reduced]);
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
    icon: BookOpen, num: "01", title: "Koleksi",
    desc: "Tambah dan sunting data buku, kategori, rak, ISBN, serta pengarang dari satu daftar katalog.",
    span: "lg:col-span-2", accent: true,
  },
  {
    icon: Users, num: "02", title: "Anggota",
    desc: "Simpan data anggota dan buka riwayat peminjamannya saat diperlukan.",
    span: "lg:col-span-1", accent: false,
  },
  {
    icon: ArrowLeftRight, num: "03", title: "Peminjaman & pengembalian",
    desc: "Catat transaksi dan ubah statusnya sampai buku kembali ke inventaris.",
    span: "lg:col-span-1", accent: false,
  },
  {
    icon: BarChart3, num: "04", title: "Laporan",
    desc: "Tinjau ringkasan transaksi dan kondisi koleksi dari data yang tersimpan.",
    span: "lg:col-span-2", accent: false,
  },
  {
    icon: Search, num: "05", title: "Pencarian",
    desc: "Cari buku dan anggota dari katalog tanpa berpindah ke ruang kerja lain.",
    span: "lg:col-span-1", accent: false,
  },
  {
    icon: ShieldCheck, num: "06", title: "Akses",
    desc: "Masuk ke ruang kerja sesuai akun yang telah dibuat untuk mengelola perpustakaan.",
    span: "lg:col-span-1", accent: false,
  },
] as const;

const HOW_STEPS = [
  {
    icon: Database, num: "01", title: "Daftarkan Koleksi",
    desc: "Metadata buku masuk ke katalog: judul, pengarang, ISBN, kategori, dan rak.",
  },
  {
    icon: ArrowLeftRight, num: "02", title: "Catat Transaksi",
    desc: "Peminjaman dicatat bersama anggota dan buku yang dipilih, lalu statusnya dapat ditinjau.",
  },
  {
    icon: TrendingUp, num: "03", title: "Pantau & Evaluasi",
    desc: "Saat pengembalian selesai, riwayat transaksi dan ketersediaan koleksi ikut diperbarui.",
  },
] as const;

const MARQUEE_ITEMS = [
  "Koleksi", "Anggota", "Peminjaman", "Pengembalian",
  "Inventaris", "Pencarian", "Laporan",
];

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Sk({ w = "w-12", h = "h-5" }: { w?: string; h?: string }) {
  return <div className={`${w} ${h} rounded bg-slate-200 animate-pulse`} aria-hidden="true" />;
}

// ─── Navigation ───────────────────────────────────────────────────────────────

function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const mobileToggleRef = useRef<HTMLButtonElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const { direction } = useScrollIntent(72);
  const navVisible = !scrolled || direction === "up" || mobileOpen;
  const navOnDark = mobileOpen;
  useGsapNavChoreography(headerRef);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 16);
    handler();
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    const desktopQuery = window.matchMedia("(min-width: 768px)");
    const closeOnDesktop = (event: MediaQueryListEvent | MediaQueryList) => {
      if (event.matches) setMobileOpen(false);
    };

    closeOnDesktop(desktopQuery);
    desktopQuery.addEventListener("change", closeOnDesktop);
    return () => desktopQuery.removeEventListener("change", closeOnDesktop);
  }, []);

  const closeMobileMenu = useCallback(() => setMobileOpen(false), []);

  const handleScroll = useCallback((id: string) => {
    setMobileOpen(false);
    window.setTimeout(() => scrollTo(id), 80);
  }, []);

  const navItem = "text-[13.5px] font-medium text-[#53655e] hover:text-[#24352f] px-3.5 py-2 transition-colors duration-150";

  return (
    <>
      <motion.div
        className="fixed inset-x-0 top-0 z-[60] h-[2px] origin-left bg-[hsl(163_45%_42%)]"
        style={{ scaleX: scrollYProgress }}
        aria-hidden="true"
      />
      <motion.header
        ref={headerRef}
        initial={reduced ? {} : { y: -20, opacity: 0 }}
        animate={{ y: navVisible ? 0 : -72, opacity: navVisible ? 1 : 0 }}
        transition={{ duration: reduced ? 0 : 0.36, delay: 0.05, ease: E_OUT }}
        className={`landing-nav fixed top-0 inset-x-0 z-50 ${
          !navVisible ? "pointer-events-none" : ""
          } ${
           mobileOpen
            ? "bg-[#071f1d]/95 backdrop-blur-xl border-b border-white/10 shadow-[0_12px_40px_rgba(1,14,12,0.28)]"
            : scrolled
             ? "border-b border-[#27453b]/15 bg-[#f5f3ed]/95 shadow-[0_1px_0_0_rgba(0,0,0,0.03),0_4px_16px_-2px_rgba(0,0,0,0.04)]"
            : "bg-transparent"
         }`}
        data-scrolled={scrolled}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[60px] flex items-center justify-between">
          <div data-gsap-nav-brand className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 shrink-0">
              <img src={VIREON_LOGO} alt="VIREON" className="w-full h-full object-contain" loading="eager" decoding="sync" />
            </div>
            <div className="leading-none">
              <span className={`text-[13px] font-bold tracking-[0.05em] transition-colors duration-300 ${navOnDark ? "text-white" : "text-slate-900"}`}>
                VIREON
              </span>
              <span className={`hidden sm:block text-[9.5px] font-medium uppercase tracking-[0.14em] mt-0.5 transition-colors duration-300 ${navOnDark ? "text-white/50" : "text-slate-400"}`}>
                Library System
              </span>
            </div>
          </div>

          <nav data-gsap-nav-links className="hidden md:flex items-center gap-0.5" aria-label="Navigasi utama">
            {[{ label: "Cara Kerja", id: "how" }, { label: "Fitur", id: "features" }, { label: "Tentang", id: "about" }].map(({ label, id }) => (
              <button key={id} onClick={() => handleScroll(id)} className={navItem}>{label}</button>
            ))}
            <Link href="/catalog" className={navItem}>Katalog</Link>
          </nav>

          <div data-gsap-nav-actions className="hidden md:flex items-center gap-2">
            <Link href="/catalog" className={navItem}>Jelajahi Koleksi</Link>
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
            ref={mobileToggleRef}
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className={`group flex h-11 w-11 items-center justify-center rounded-full border backdrop-blur-xl transition-colors md:hidden ${
              navOnDark
                ? "border-white/15 bg-white/[0.06] text-white/85 hover:border-[#54d8b2]/60 hover:bg-[#54d8b2]/10"
                : "border-slate-200/80 bg-white/80 text-slate-600 hover:border-emerald-200 hover:bg-emerald-50 hover:text-slate-900"
            } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#54d8b2] focus-visible:ring-offset-2 ${
              navOnDark ? "focus-visible:ring-offset-[#071f1d]" : "focus-visible:ring-offset-white"
            }`}
            aria-label={mobileOpen ? "Tutup menu" : "Buka menu"}
            aria-expanded={mobileOpen}
            aria-controls="vireon-mobile-menu"
            data-testid="button-mobile-menu-toggle"
          >
            <MobileMenuMark open={mobileOpen} />
          </button>
        </div>
      </motion.header>

      <LandingMobileMenu
        open={mobileOpen}
        onClose={closeMobileMenu}
        onNavigate={handleScroll}
        toggleRef={mobileToggleRef}
      />
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

// ─── Library illustration ─────────────────────────────────────────────────────
// A warm editorial visual keeps the hero focused on the reading experience,
// while the surrounding chips communicate the product's real capabilities.

function LibraryIllustration({ reduced }: { reduced: boolean }) {
  const featureChips = [
    { icon: BookOpen, label: "Koleksi tertata", className: "left-0 top-16 sm:left-2 sm:top-20" },
    { icon: ArrowLeftRight, label: "Peminjaman tercatat", className: "right-0 top-8 sm:right-2 sm:top-12" },
    { icon: BarChart3, label: "Laporan terukur", className: "right-2 bottom-20 sm:right-5 sm:bottom-24" },
  ];

  return (
    <div
      className="relative min-h-[360px] w-full overflow-visible sm:min-h-[430px]"
      role="img"
      aria-label="Ilustrasi buku terbuka dalam ruang baca digital VIREON"
      data-testid="illustration-hero-book"
    >
      <div
        className="absolute inset-4 rounded-[32px] border border-white/15 bg-[radial-gradient(circle_at_50%_38%,rgba(81,199,164,0.24),transparent_42%),linear-gradient(145deg,rgba(8,41,35,0.92),rgba(12,65,54,0.72))] shadow-[0_30px_90px_-34px_rgba(0,0,0,0.8)]"
        aria-hidden="true"
      />
      <div
        className="absolute inset-4 rounded-[32px] opacity-30"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.10) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.10) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          maskImage: "linear-gradient(to bottom, transparent, black 25%, black 75%, transparent)",
        }}
        aria-hidden="true"
      />

      <div className="absolute left-8 top-9 flex items-center gap-2 text-white/65 sm:left-12 sm:top-12" aria-hidden="true">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/15 bg-white/10">
          <Sparkles className="h-3.5 w-3.5 text-emerald-200" />
        </span>
        <span className="text-[9px] font-bold uppercase tracking-[0.2em]">Ruang baca yang lebih hidup</span>
      </div>

      <div className="absolute inset-x-0 bottom-10 top-20 flex items-center justify-center sm:bottom-14 sm:top-24" aria-hidden="true">
        <motion.div
          animate={reduced ? {} : { y: [0, -8, 0], rotate: [-1, 0.5, -1] }}
          transition={reduced ? undefined : { duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="relative h-[210px] w-[min(78vw,370px)] sm:h-[250px] sm:w-[410px]"
        >
          <div className="absolute bottom-0 left-1/2 h-8 w-[74%] -translate-x-1/2 rounded-full bg-black/25 blur-xl" />
          <div className="absolute left-[7%] top-[17%] h-[73%] w-[45%] -rotate-[10deg] rounded-[22px_7px_10px_24px] border border-[#d8cdbb] bg-[#f7f0e5] shadow-[inset_-12px_0_18px_rgba(148,112,67,0.10),-16px_18px_30px_rgba(0,0,0,0.22)]">
            <div className="absolute inset-x-5 top-8 space-y-3 opacity-40">
              <div className="h-1.5 w-3/4 rounded-full bg-[#96a89c]" />
              <div className="h-1.5 w-full rounded-full bg-[#b8c2b7]" />
              <div className="h-1.5 w-5/6 rounded-full bg-[#b8c2b7]" />
              <div className="mt-7 h-12 rounded-lg bg-[#d9e8dc]" />
            </div>
            <div className="absolute bottom-7 left-5 h-1 w-10 rounded-full bg-[#1e7e6a]/55" />
          </div>
          <div className="absolute right-[7%] top-[17%] h-[73%] w-[45%] rotate-[10deg] rounded-[7px_22px_24px_10px] border border-[#d8cdbb] bg-[#fcf7ed] shadow-[inset_12px_0_18px_rgba(148,112,67,0.08),16px_18px_30px_rgba(0,0,0,0.22)]">
            <div className="absolute inset-x-5 top-8 space-y-3 opacity-40">
              <div className="h-1.5 w-2/3 rounded-full bg-[#96a89c]" />
              <div className="h-1.5 w-full rounded-full bg-[#b8c2b7]" />
              <div className="h-1.5 w-4/5 rounded-full bg-[#b8c2b7]" />
              <div className="mt-7 h-12 rounded-lg bg-[#d9e8dc]" />
            </div>
            <div className="absolute bottom-7 right-5 h-1 w-10 rounded-full bg-[#1e7e6a]/55" />
          </div>
          <div className="absolute left-1/2 top-[16%] h-[76%] w-4 -translate-x-1/2 rounded-full bg-gradient-to-r from-[#b8a88e] via-[#f0e5d3] to-[#9f8d73] shadow-[0_10px_14px_rgba(0,0,0,0.16)]" />
          <div className="absolute left-1/2 top-[11%] h-10 w-5 -translate-x-1/2 rounded-b-full bg-[#d4b27d] shadow-[0_4px_8px_rgba(0,0,0,0.18)]" />
          <div className="absolute left-1/2 top-[3%] h-5 w-2 -translate-x-1/2 rounded-full bg-[#efcc91]" />
          <div className="absolute left-1/2 top-[25%] h-24 w-1 -translate-x-1/2 bg-[#3e8b74]/25" />
        </motion.div>
      </div>

      {featureChips.map(({ icon: Icon, label, className }, index) => (
        <motion.div
          key={label}
          initial={reduced ? {} : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reduced ? { duration: 0 } : { delay: 0.45 + index * 0.12, duration: 0.5, ease: E_OUT }}
          className={`absolute z-10 flex items-center gap-2 rounded-full border border-white/15 bg-[#f8fbf7]/95 px-3 py-2 text-[10px] font-bold text-[#174b40] shadow-[0_12px_28px_-10px_rgba(0,0,0,0.6)] backdrop-blur-md sm:px-3.5 sm:py-2.5 sm:text-[11px] ${className}`}
          aria-hidden="true"
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#d7eee4] text-[#14725f]">
            <Icon className="h-3 w-3" />
          </span>
          {label}
        </motion.div>
      ))}

      <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full border border-white/15 bg-black/20 px-3 py-1.5 text-[9px] font-medium text-white/60 backdrop-blur-sm sm:bottom-5" aria-hidden="true">
        <CheckCircle2 className="h-3 w-3 text-emerald-300" />
        Satu ruang untuk seluruh aktivitas baca
      </div>
    </div>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
// Word-by-word blur-focus reveal on headline. Each word materialises
// from a blurred haze and rises into position — 0.08 s apart.

function HeroSection() {
  const reduced = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const ambientRef = useRef<HTMLDivElement>(null);
  const primaryCtaRef = useGsapMagnetic<HTMLDivElement>();
  const { scrollY } = useScroll();
  const bgY = useTransform(scrollY, [0, 700], ["0%", "18%"]);
  // Parallax out: content rises as user scrolls
  const contentY = useTransform(scrollY, [0, 600], ["0px", "-40px"]);
  const contentOpacity = useTransform(scrollY, [0, 500], [1, 0.4]);
  const previewY = useTransform(scrollY, [0, 720], ["0px", "46px"]);

  useGsapAmbientScroll(sectionRef, ambientRef);

  const wordAnim = (delay: number) =>
    reduced
      ? {}
      : {
          initial: { opacity: 0, y: 32, filter: "blur(10px)" },
          animate: { opacity: 1, y: 0, filter: "blur(0px)" },
          transition: { duration: 0.75, delay, ease: E_OUT },
        };

  return (
    <section
      ref={sectionRef}
      className="relative min-h-[92vh] flex items-center pt-[60px] overflow-hidden"
    >
      {/* Editorial framing keeps the hero from feeling like a plain photo block. */}
      <div className="absolute inset-0 pointer-events-none select-none" aria-hidden="true">
        <div className="absolute -right-28 top-24 h-[420px] w-[420px] rounded-full border border-emerald-100/10" />
        <div className="absolute -right-16 top-36 h-[300px] w-[300px] rounded-full border border-emerald-100/[0.08]" />
        <div className="absolute left-0 top-1/2 h-px w-[18%] bg-gradient-to-r from-transparent to-emerald-100/20" />
        <div className="absolute right-0 top-1/2 h-px w-[16%] bg-gradient-to-l from-transparent to-emerald-100/20" />
        <div className="absolute bottom-10 left-5 hidden items-center gap-3 text-[9px] font-semibold uppercase tracking-[0.28em] text-emerald-100/35 lg:flex">
          <span className="h-px w-8 bg-emerald-100/30" />
          VIREON / LIBRARY SYSTEM
        </div>
      </div>

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
              className="font-editorial text-[3.2rem] sm:text-6xl lg:text-[4.3rem] xl:text-[5rem] text-white leading-[0.94]"
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
                   style={{ color: "hsl(161 68% 70%)" }}
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
              <div ref={primaryCtaRef} className="inline-flex will-change-transform">
                <Link
                  href="/login"
                  data-testid="link-hero-login"
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-[10px] px-5 py-3 text-[14px] font-semibold text-white transition-[background-color,box-shadow] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-2 focus-visible:ring-offset-emerald-950"
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
              </div>
              <button
                onClick={() => scrollTo("how")}
                data-testid="button-hero-how"
                className="inline-flex items-center gap-2 px-5 py-3 text-[14px] font-medium text-white/80 bg-white/10 border border-white/20 rounded-[10px] hover:bg-white/16 hover:border-white/32 hover:text-white transition-all duration-150 active:scale-[0.98] min-h-[44px] backdrop-blur-sm"
              >
                Lihat Cara Kerja
              </button>
            </motion.div>

            {/* Trust signals — staggered slide from left */}
            <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2">
              {["Koleksi dan anggota", "Alur peminjaman", "Laporan perpustakaan"].map((item, i) => (
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

          {/* Right — editorial book illustration with subtle scroll depth */}
          <motion.div
            initial={reduced ? {} : { opacity: 0, x: 28, scale: 0.97 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.14, ease: E_OUT }}
            className="relative w-full"
          >
            {/* Ambient glow */}
            <div
              ref={ambientRef}
              className="absolute -inset-12 pointer-events-none"
              style={{ background: "radial-gradient(ellipse 75% 65% at 50% 50%, hsl(161 52% 55% / 0.18) 0%, transparent 70%)" }}
              aria-hidden="true"
            />

            {/* Subtle perpetual float */}
            <motion.div style={reduced ? {} : { y: previewY }}>
              <LibraryIllustration reduced={reduced ?? false} />
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

function LandingHeroEditorial() {
  const heroRef = useRef<HTMLElement>(null);
  const primaryCtaRef = useGsapMagnetic<HTMLDivElement>();
  const { data: stats, isLoading: statsLoading } = useLandingStats();
  useGsapHeroChoreography(heroRef);

  return (
    <section
      ref={heroRef}
      data-gsap="hero"
      className="landing-hero relative flex min-h-[640px] items-center overflow-hidden pt-[60px] lg:min-h-[700px]"
    >
      <div data-gsap="hero-grid" className="landing-paper-grid pointer-events-none absolute inset-0 opacity-50" aria-hidden="true" />
      <div className="relative mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20 lg:px-8 lg:py-24">
        <div data-gsap="hero-copy" className="max-w-xl">
          <p data-gsap="hero-kicker" className="landing-kicker mb-6">Sistem manajemen perpustakaan</p>
          <h1 data-gsap="hero-title" className="landing-display max-w-[620px] text-[3rem] leading-[0.96] text-[#24352f] sm:text-[4.25rem] lg:text-[4.8rem]">
            <span className="block overflow-hidden"><span data-gsap="hero-title-line">Kelola</span></span>
            <span className="block overflow-hidden"><span data-gsap="hero-title-line">perpustakaan</span></span>
            <span className="block overflow-hidden"><span data-gsap="hero-title-line">dengan lebih</span></span>
            <span className="block overflow-hidden"><span data-gsap="hero-title-line">jelas.</span></span>
          </h1>
          <p data-gsap="hero-description" className="mt-7 max-w-[470px] text-[1.02rem] leading-[1.7] text-[#53645d] sm:text-[1.08rem]">
             VIREON merapikan katalog, anggota, peminjaman, pengembalian, dan laporan dalam satu ruang kerja.
          </p>
          <div data-gsap="hero-actions" className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3">
            <div ref={primaryCtaRef} className="inline-flex will-change-transform">
              <Link
                href="/login"
                data-testid="link-hero-login"
                className="inline-flex min-h-[46px] items-center gap-2 bg-[#285b4c] px-5 py-3 text-[14px] font-semibold text-[#fbfaf6] transition-colors hover:bg-[#1f493d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#285b4c] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f5f3ed]"
              >
                Masuk ke Sistem
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <button
              onClick={() => scrollTo("how")}
              data-testid="button-hero-how"
              className="landing-outline-link inline-flex min-h-[46px] items-center gap-2 border-b px-0 py-3 text-[14px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#285b4c] focus-visible:ring-offset-2"
            >
              Lihat Cara Kerja
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          <div data-gsap="hero-proof" className="mt-10 grid max-w-[470px] grid-cols-1 gap-2 border-t border-[#27453b]/15 pt-5 text-[12px] text-[#68736d] sm:grid-cols-3 sm:gap-5">
            {["Koleksi terpusat", "Transaksi tercatat", "Laporan terukur"].map((item) => (
              <div key={item} className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#285b4c]" aria-hidden="true" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div data-gsap="hero-visual" className="relative mx-auto w-full max-w-[620px]">
          <div data-gsap-hero-tilt className="landing-hero-visual relative overflow-hidden p-5 sm:p-7">
            <div data-gsap="hero-panel-head" className="relative z-10 flex items-center justify-between border-b border-[#27453b]/15 pb-4">
              <div>
                <p className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-[#285b4c]">VIREON / Library system</p>
                <h2 className="mt-2 text-[19px] font-semibold tracking-[-0.03em] text-[#24352f] sm:text-[22px]">Ringkasan perpustakaan</h2>
              </div>
              <BookOpen className="h-5 w-5 text-[#285b4c]" strokeWidth={1.6} aria-hidden="true" />
            </div>
            <div data-gsap="hero-panel-body" className="relative z-10 mt-6 grid grid-cols-[1.2fr_0.8fr] gap-6">
              <div className="space-y-4">
                <div data-gsap="hero-status" className="border-l-2 border-[#285b4c] pl-4">
                  <p className="text-[12px] text-[#68736d]">Total koleksi buku</p>
                  <p className="mt-1 text-[30px] font-semibold tabular-nums tracking-[-0.06em] text-[#24352f]">
                    {stats ? fmt(stats.totalBooks) : statsLoading ? "…" : "—"}
                  </p>
                  <p className="mt-1 text-[10px] text-[#68736d]">judul tercatat di VIREON</p>
                </div>
                <div className="space-y-3 border-t border-[#27453b]/15 pt-4">
                  {[
                    ["Koleksi", "Kelola buku dan kategori"],
                    ["Anggota", "Pantau data pembaca"],
                    ["Peminjaman", "Catat setiap transaksi"],
                  ].map(([label, desc]) => (
                    <div data-gsap="hero-row" key={label} className="flex items-center justify-between gap-3 border-b border-[#27453b]/10 pb-3 last:border-0 last:pb-0">
                      <span className="text-[12px] font-semibold text-[#24352f]">{label}</span>
                      <span className="text-right text-[10px] leading-4 text-[#68736d]">{desc}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="hidden border-l border-[#27453b]/15 pl-6 sm:block">
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#68736d]">Alur kerja</p>
                <div className="mt-5 space-y-5">
                  {["Daftarkan koleksi", "Catat transaksi", "Pantau laporan"].map((label, index) => (
                    <div data-gsap="hero-row" key={label} className="flex items-start gap-3">
                      <span className="font-mono text-[10px] text-[#285b4c]">0{index + 1}</span>
                      <span className="text-[12px] leading-4 text-[#24352f]">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div data-gsap="hero-panel-foot" className="relative z-10 mt-7 flex items-center justify-between border-t border-[#27453b]/15 pt-4">
              <span className="text-[10px] text-[#68736d]">Satu ruang untuk seluruh aktivitas baca</span>
               <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#285b4c]">WORKSPACE</span>
            </div>
          </div>
          <div className="absolute -bottom-5 -left-5 hidden h-20 w-20 border-b border-l border-[#285b4c]/35 sm:block" aria-hidden="true" />
          <div className="absolute -right-5 -top-5 hidden h-20 w-20 border-r border-t border-[#285b4c]/35 sm:block" aria-hidden="true" />
        </div>
      </div>
    </section>
  );
}

// ─── Marquee Ticker ───────────────────────────────────────────────────────────
// A content-width duplicated track loops seamlessly; hover pauses in place.

function MarqueeTicker() {
  return (
    <div
      className="vireon-marquee relative overflow-hidden border-y border-[#27453b]/20 py-3.5"
      aria-label="Ruang lingkup VIREON"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
        <span className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-[#b8d0c4]">Lingkup sistem</span>
        <div className="vireon-marquee-track flex min-w-0 flex-1 items-center justify-end gap-x-6 overflow-hidden" data-gsap-marquee data-testid="landing-marquee-track">
          {MARQUEE_ITEMS.map((item) => (
            <span key={item} className="shrink-0 text-[11px] font-medium text-[#e2eee7]/80">
              {item}
              <span className="ml-6 text-[#a5c8b6]/50" aria-hidden="true">/</span>
            </span>
          ))}
        </div>
      </div>
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
  const hasValue = value !== undefined;
  const isZero = !isLoading && value === 0;
  const count = useCountUp(value ?? 0, isInView && !isLoading && hasValue, 1.2, reduced);

  // Keep one restrained entrance pattern for every stat card.
  return (
    <motion.div
      ref={ref}
      initial={false}
      animate={isInView ? { x: 0, y: 0, opacity: 1, rotate: 0, scale: 1 } : {}}
      transition={{ duration: 0.72, delay: index * 0.1, ease: E_OUT }}
      whileHover={reduced ? {} : { y: -1, transition: { duration: 0.2, ease: E_OUT } }}
      className="group relative px-5 py-8 transition-colors duration-200 hover:bg-[#285b4c]/[0.025] lg:px-8"
      role="group"
      aria-label={`${label}: ${isLoading ? "memuat" : hasValue ? fmt(value) : "belum tersedia"}`}
      data-testid={`stat-landing-${index}`}
    >
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
        style={{ background: "hsl(161 52% 26% / 0.025)" }}
      />
      <div className="relative">
        <div className="mb-3 flex items-center justify-between">
          <span className={`relative flex h-7 w-7 items-center justify-center rounded-lg transition-[background-color,transform] duration-200 group-hover:scale-105 ${
            isZero ? "bg-slate-100" : "bg-emerald-50"
          }`}>
            <Icon className="h-4 w-4" strokeWidth={1.75} style={{ color: "hsl(161 52% 38%)" }} />
            {isZero && (
              <span
                className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full border-2 border-white bg-slate-300 transition-colors duration-200 group-hover:bg-[hsl(161_52%_44%)]"
                aria-hidden="true"
              />
            )}
          </span>
        </div>
        {isLoading ? (
          <Sk w="w-16" h="h-8" />
        ) : (
          <div className="flex flex-wrap items-end gap-x-2 gap-y-1">
            <p
              className={`text-[2rem] font-extrabold tabular-nums tracking-tight leading-none transition-colors duration-200 ${
                isZero ? "text-slate-700 group-hover:text-[hsl(161_52%_30%)]" : "text-slate-900"
              }`}
              data-testid={`text-landing-stat-value-${index}`}
            >
              {hasValue ? fmt(count) : "—"}
            </p>
            {isZero && (
              <span className="mb-0.5 inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white/80 px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.08em] text-slate-400 transition-[border-color,color] duration-200 group-hover:border-emerald-200 group-hover:text-emerald-700">
                Siap diisi
              </span>
            )}
          </div>
        )}
        <p className="mt-2 text-[13px] text-slate-500 font-medium">{label}</p>
        {isZero && (
          <div
            className="mt-3 h-px w-8 origin-left scale-x-50 bg-slate-200 transition-[transform,background-color] duration-300 group-hover:scale-x-100 group-hover:bg-emerald-300"
            aria-hidden="true"
          />
        )}
      </div>
    </motion.div>
  );
}

function StatsSection() {
  const { data: stats, isLoading, isError, isFetching, refetch } = useLandingStats();
  const reduced = useReducedMotion();

  const items = [
    { label: "Total Koleksi Buku", value: stats?.totalBooks, icon: BookMarked },
    { label: "Anggota Terdaftar", value: stats?.totalMembers, icon: Users },
    { label: "Total Peminjaman", value: stats?.totalBorrowings, icon: ArrowLeftRight },
    { label: "Judul Buku Tersedia", value: stats?.availableBooks, icon: CheckCircle2 },
  ];

  return (
    <section className="landing-stats border-b border-slate-100" aria-label="Statistik perpustakaan">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between border-b border-[#27453b]/10 py-4">
          <p className="landing-section-label">Gambaran ruang baca</p>
          <p className="hidden text-[11px] text-[#68736d] sm:block">Data yang tersedia di sistem saat ini</p>
        </div>
        <div className="landing-stat-grid grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 divide-slate-100">
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
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-6 py-3 lg:px-8">
          <p className="flex items-center gap-2 text-[11px] text-slate-500" role="status" aria-live="polite">
            <span
              className={`h-1.5 w-1.5 shrink-0 rounded-full ${isError ? "bg-amber-400" : stats ? "bg-emerald-500" : "bg-slate-300"}`}
              aria-hidden="true"
            />
            {isLoading
              ? "Mengambil total perpustakaan…"
              : isError
                ? stats
                  ? "Menampilkan data terakhir. Pembaruan belum berhasil."
                  : "Total perpustakaan belum dapat dimuat."
                : "Data asli perpustakaan · diperbarui otomatis"}
          </p>
          {isError && (
            <button
              type="button"
              onClick={() => void refetch()}
              disabled={isFetching}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-emerald-800 transition-colors hover:bg-emerald-50 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              {isFetching ? "Memuat…" : "Coba lagi"}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

// ─── How It Works ─────────────────────────────────────────────────────────────
// Connector line draws in; each step enters from left/bottom/right.

function HowItWorksSection() {
  const reduced = useReducedMotion();

  return (
    <section
      id="how"
      data-gsap-section
      data-gsap-pinned-workflow
      className="landing-workflow-section relative scroll-mt-20 overflow-hidden border-y border-[#27453b]/12 bg-[#eef1eb] py-20 sm:py-28"
    >
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:gap-16">
          <motion.div {...fadeUpView(0, reduced ?? false)} className="max-w-md">
            <p className="landing-section-label mb-4">Alur kerja</p>
            <h2 data-gsap-reveal className="text-[2rem] font-semibold leading-[1.05] tracking-[-0.055em] text-[#24352f] sm:text-[2.75rem]">
              Dari katalog sampai buku kembali.
            </h2>
            <p className="mt-5 text-[15px] leading-7 text-[#68736d]">
              Setiap langkah meninggalkan catatan yang bisa dibaca kembali oleh tim perpustakaan.
            </p>
            <div className="mt-8 flex items-center gap-3 border-t border-[#27453b]/15 pt-4 text-[11px] text-[#68736d]">
              <span className="h-2 w-2 rounded-full bg-[#285b4c]" aria-hidden="true" />
              Alur katalog dan sirkulasi dalam satu sistem
            </div>
          </motion.div>

          <div className="min-w-0">
            <div data-gsap-workflow-viewport className="landing-workflow-viewport">
              <div data-gsap-workflow-track className="landing-workflow-track">
                {HOW_STEPS.map(({ icon: Icon, num, title, desc }, i) => (
                  <article
                    key={title}
                    data-gsap-workflow-panel
                    className="landing-workflow-panel relative flex min-w-0 flex-col justify-between border-y border-[#27453b]/15 bg-[#fbfaf6] p-5 sm:p-7 lg:p-9"
                  >
                    <div className="flex items-center justify-between gap-4 border-b border-[#27453b]/12 pb-4">
                      <span className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-[#68736d]">
                        VIREON / PROCESS {num}
                      </span>
                      <span className="flex h-9 w-9 items-center justify-center border border-[#285b4c]/20 text-[#285b4c]">
                        <Icon className="h-4 w-4" strokeWidth={1.6} aria-hidden="true" />
                      </span>
                    </div>

                    <div className="py-8">
                      <p className="font-mono text-[11px] tracking-[0.16em] text-[#285b4c]">
                        CHAPTER {num} / 03
                      </p>
                      <h3 className="mt-4 max-w-md text-[1.8rem] font-semibold leading-[1.02] tracking-[-0.055em] text-[#24352f] sm:text-[2.35rem]">
                        {title}
                      </h3>
                      <p className="mt-4 max-w-md text-[14px] leading-6 text-[#68736d]">
                        {desc}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#27453b]/15 pt-4 text-[11px]">
                      {i === 0 && (
                        <>
                          <span className="font-semibold text-[#24352f]">Judul · pengarang · ISBN</span>
                          <span className="text-[#68736d]">Data katalog</span>
                        </>
                      )}
                      {i === 1 && (
                        <>
                          <span className="font-semibold text-[#24352f]">Anggota · tanggal · buku</span>
                          <span className="border-l-2 border-[#b5d6bb] pl-2 text-[#68736d]">Transaksi</span>
                        </>
                      )}
                      {i === 2 && (
                        <>
                          <span className="font-semibold text-[#24352f]">Status kembali · stok</span>
                          <span className="border-l-2 border-[#285b4c] pl-2 text-[#285b4c]">Riwayat</span>
                        </>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <div className="mt-5 flex items-center gap-4">
              <div className="landing-workflow-progress-track relative h-px flex-1 bg-[#285b4c]/20">
                <span data-gsap-workflow-progress className="landing-workflow-progress-fill absolute inset-0 origin-left bg-[#285b4c]" />
              </div>
              <span className="shrink-0 font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-[#68736d]">
                Scroll untuk menelusuri
              </span>
            </div>
          </div>
        </div>
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
  const Icon = feature.icon;
  const isWide = feature.span === "lg:col-span-2";

  return (
    <motion.div
      initial={false}
      whileInView={reduced ? {} : { x: 0, y: 0, opacity: 1, rotate: 0, scale: 1 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={reduced ? {} : { duration: 0.68, delay: index * 0.07, ease: E_OUT }}
      className={`group relative rounded-[3px] p-6 border overflow-hidden cursor-default ${
        feature.accent
          ? "border-transparent"
          : "border-slate-200/70 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
      } hover:shadow-[0_8px_24px_rgba(31,52,44,0.07)] hover:border-[hsl(161_52%_36%/0.3)] transition-[border-color,box-shadow] duration-200 ${feature.span}`}
      style={{
        ...(feature.accent
          ? { background: "hsl(161 52% 26% / 0.045)", border: "1px solid hsl(161 52% 36% / 0.18)" }
          : {}),
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
        className="w-10 h-10 rounded-sm flex items-center justify-center mb-5 shrink-0"
        style={{ background: "hsl(161 52% 26% / 0.09)", border: "1px solid hsl(161 52% 36% / 0.18)" }}
      >
        <Icon className="w-[18px] h-[18px]" strokeWidth={1.75} style={{ color: "hsl(161 52% 28%)" }} />
      </div>

      <h3 className="text-[15px] font-bold text-slate-900 mb-2 tracking-tight">{feature.title}</h3>
      <p className="text-[13.5px] text-slate-500 leading-relaxed">{feature.desc}</p>

      {isWide && (
        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-1.5">
          <CheckCircle2 className="h-3.5 w-3.5" style={{ color: "hsl(161 52% 30%)" }} aria-hidden="true" />
          <span className="text-[12px] font-semibold" style={{ color: "hsl(161 52% 30%)" }}>
            Tersedia di VIREON
          </span>
        </div>
      )}
    </motion.div>
  );
}

function PublicCatalogRows() {
  const listRef = useRef<HTMLDivElement>(null);
  const { data: books, isLoading, isError } = usePublicCatalog("", null, false);
  const visibleBooks = books?.slice(0, 3) ?? [];
  useGsapProductReveal(listRef, visibleBooks.length);

  if (isLoading) {
    return (
      <div className="space-y-3 px-3 py-4" role="status" aria-live="polite">
        <span className="sr-only">Memuat katalog publik</span>
        {[0, 1, 2].map((item) => (
          <div key={item} className="flex items-center gap-3" aria-hidden="true">
            <span className="h-10 w-8 shrink-0 animate-pulse bg-white/10" />
            <span className="h-3 w-2/3 animate-pulse bg-white/10" />
          </div>
        ))}
      </div>
    );
  }

  if (isError || visibleBooks.length === 0) {
    return (
      <p className="px-3 py-5 text-[11px] leading-5 text-white/65" role="status">
        {isError ? "Katalog publik sementara tidak dapat dimuat." : "Belum ada buku yang ditampilkan di katalog publik."}
        {" "}
        <Link href="/catalog" className="font-semibold text-[#b5d6bb] underline underline-offset-2">
          Buka katalog
        </Link>
      </p>
    );
  }

  return (
    <div ref={listRef}>
      {visibleBooks.map((book) => (
        <div
          key={book.id}
          data-gsap-product-row
          className="grid grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-3 border-b border-white/10 px-3 py-3 last:border-b-0"
        >
          <span
            data-gsap-product-cover
            className="flex h-11 w-8 shrink-0 items-center justify-center overflow-hidden border border-white/15 bg-white/10 text-[#b5d6bb]"
          >
            {book.coverUrl ? (
              <img
                src={book.coverUrl}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover"
              />
            ) : (
              <BookOpen className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
            )}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[11px] font-semibold text-white/90" title={book.title}>
              {book.title}
            </span>
            <span className="mt-1 block truncate text-[10px] text-white/55" title={book.author}>
              {book.author}{book.categoryName ? ` · ${book.categoryName}` : ""}
            </span>
          </span>
          <span className="text-right">
            <span className="block font-mono text-[12px] font-semibold tabular-nums text-white/90">
              {fmt(book.availableCopies)}
            </span>
            <span className="block text-[9px] text-white/50">eksemplar</span>
          </span>
        </div>
      ))}
    </div>
  );
}

function FeaturesSection() {
  const reduced = useReducedMotion();

  return (
    <section id="features" data-gsap-section className="relative scroll-mt-20 overflow-hidden bg-[#fbfaf6] py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 flex flex-col justify-between gap-5 border-b border-[#27453b]/15 pb-6 sm:flex-row sm:items-end">
          <motion.div {...fadeUpView(0, reduced ?? false)} className="max-w-xl">
            <p className="landing-section-label mb-4">Ruang kerja</p>
            <h2 data-gsap-reveal className="text-[2rem] font-semibold leading-[1.08] tracking-[-0.055em] text-[#24352f] sm:text-[2.75rem]">
              Modul yang mengikuti pekerjaan sehari-hari.
            </h2>
          </motion.div>
          <p className="max-w-xs text-[14px] leading-6 text-[#68736d]">
            Bukan kumpulan fitur terpisah. Ini adalah daftar kerja yang menyambung dari buku ke transaksi.
          </p>
        </div>

        <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
          <motion.div {...fadeLeftView(0, reduced ?? false)} className="border border-[#27453b]/18 bg-[#173d34] p-5 text-[#eff7ef] sm:p-7">
            <div className="flex items-start justify-between gap-6 border-b border-white/15 pb-5">
              <div>
                <p className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-[#b5d6bb]">01 / Koleksi</p>
                <h3
                  data-testid="landing-catalog-heading"
                  className="landing-catalog-heading mt-3 text-[22px] font-semibold tracking-[-0.04em]"
                >
                  Katalog buku
                </h3>
                <p className="mt-2 max-w-sm text-[13px] leading-5 text-white/60">
                  Metadata yang dibutuhkan untuk menemukan dan mengelola setiap buku tetap terlihat dalam satu daftar.
                </p>
              </div>
              <BookOpen className="mt-1 h-5 w-5 shrink-0 text-[#b5d6bb]" strokeWidth={1.5} aria-hidden="true" />
            </div>
            <div data-gsap-products className="mt-6 overflow-hidden border border-white/15">
              <div className="grid grid-cols-[1.35fr_0.8fr_0.7fr] gap-3 border-b border-white/15 bg-white/[0.05] px-3 py-2 font-mono text-[9px] uppercase tracking-[0.1em] text-white/45">
                <span className="col-span-2">Buku dalam katalog</span><span className="text-right">Tersedia</span>
              </div>
              <PublicCatalogRows />
            </div>
            <div className="mt-5 flex items-center gap-2 text-[11px] text-[#b5d6bb]">
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
              Data katalog publik yang tersedia saat ini
            </div>
          </motion.div>

          <motion.div {...fadeRightView(0.08, reduced ?? false)}>
            <div className="divide-y divide-[#27453b]/15 border-y border-[#27453b]/15" data-gsap-depth="7" data-gsap-lateral="-2">
              {FEATURES.slice(1).map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex min-h-[102px] items-start gap-4 py-5">
                  <Icon className="mt-1 h-4 w-4 shrink-0 text-[#285b4c]" strokeWidth={1.7} aria-hidden="true" />
                  <div className="min-w-0">
                    <h3 className="text-[15px] font-semibold tracking-[-0.02em] text-[#24352f]">{title}</h3>
                    <p className="mt-1.5 max-w-md text-[13px] leading-5 text-[#68736d]">{desc}</p>
                  </div>
                  <ArrowRight className="ml-auto mt-1 hidden h-4 w-4 shrink-0 text-[#285b4c]/45 sm:block" aria-hidden="true" />
                </div>
              ))}
            </div>
          </motion.div>
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

  return (
    <section
      id="about"
      data-gsap-section
      className="relative scroll-mt-20 overflow-hidden bg-[#eef1eb] py-20 sm:py-28"
    >
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-24">
          <motion.div {...fadeLeftView(0, reduced ?? false)} className="max-w-md">
            <p className="landing-section-label mb-4">Operasional</p>
            <h2 data-gsap-reveal className="text-[2rem] font-semibold leading-[1.08] tracking-[-0.055em] text-[#24352f] sm:text-[2.75rem]">
              Dibuat untuk pekerjaan yang benar-benar terjadi di perpustakaan.
            </h2>
            <p className="mt-5 text-[15px] leading-7 text-[#68736d]">
              Lihat catatan sirkulasi dan inventaris sebagai bagian dari pekerjaan, bukan dekorasi di dashboard.
            </p>
            <Link
              href="/login"
              className="mt-8 inline-flex min-h-[44px] items-center gap-2 bg-[#285b4c] px-5 py-3 text-[14px] font-semibold text-[#fbfaf6] transition-colors hover:bg-[#1f493d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#285b4c] focus-visible:ring-offset-2 focus-visible:ring-offset-[#eef1eb]"
            >
              Masuk ke Sistem
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </motion.div>

          <motion.div {...fadeRightView(0.08, reduced ?? false)}>
            <div className="border-y border-[#27453b]/18" aria-label="Contoh catatan operasional VIREON" data-gsap-focus>
              <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#27453b]/15 py-5">
                <div>
                  <p className="landing-kicker mb-2">Data operasional</p>
                  <h3 className="text-[17px] font-semibold tracking-[-0.03em] text-[#24352f]">Sirkulasi &amp; inventaris</h3>
                </div>
                <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#68736d]">Bidang pencatatan</span>
              </div>
              <div className="divide-y divide-[#27453b]/15">
                {[
                  { icon: ArrowLeftRight, label: "Peminjaman", detail: "Anggota, tanggal pinjam, dan tenggat pengembalian", status: "TRANSAKSI" },
                  { icon: BookOpen, label: "Katalog", detail: "Judul, pengarang, kategori, ISBN, dan rak", status: "INVENTARIS" },
                  { icon: CheckCircle2, label: "Pengembalian", detail: "Tanggal kembali, status, dan ketersediaan stok", status: "PEMBARUAN" },
                ].map(({ icon: Icon, label, detail, status }, i) => (
                  <div key={label} className="grid grid-cols-[20px_1fr_auto] items-start gap-4 py-5">
                    <Icon className="mt-0.5 h-4 w-4 text-[#285b4c]" strokeWidth={1.7} aria-hidden="true" />
                    <div className="min-w-0">
                      <p className="text-[14px] font-semibold text-[#24352f]">{label}</p>
                      <p className="mt-1 text-[12.5px] leading-5 text-[#68736d]">{detail}</p>
                    </div>
                    <span className={`border-l-2 pl-2 font-mono text-[9px] uppercase tracking-[0.08em] ${i === 2 ? "border-[#285b4c] text-[#285b4c]" : "border-[#b5d6bb] text-[#68736d]"}`}>
                      {status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ─── CTA ──────────────────────────────────────────────────────────────────────
// Word-split headline with variants + staggerChildren.
// Background orbs drift on scroll via parallax.

function CTASection() {
  const primaryCtaRef = useGsapMagnetic<HTMLDivElement>();

  return (
    <section
      data-gsap-section
      className="landing-cta relative overflow-hidden border-t border-[#b5d6bb]/15 py-20 sm:py-28"
      style={{ background: "#285b4c" }}
    >
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-10 lg:flex-row lg:items-end">
          <div data-gsap-cta-copy className="max-w-2xl">
            <p className="mb-4 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#b5d6bb]">Ruang kerja VIREON</p>
            <h2 className="text-[2.35rem] font-semibold leading-[1.04] tracking-[-0.05em] text-left text-[#f5f3ed] sm:text-[3.4rem]">
              Kelola perpustakaan tanpa kehilangan jejak.
            </h2>
            <p className="mt-5 max-w-xl text-[15px] leading-7 text-white/85">
              Katalog, sirkulasi, dan laporan berada di tempat yang sama — siap dipakai oleh tim perpustakaan.
            </p>
          </div>
          <div
            data-gsap-cta-actions
            className="flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row"
          >
            <div ref={primaryCtaRef} className="inline-flex will-change-transform">
              <Link
                href="/login"
                data-testid="link-cta-login"
                className="inline-flex min-h-[46px] items-center justify-center gap-2 bg-[#fbfaf6] px-6 py-3.5 text-[14px] font-semibold text-[#173d34] transition-[transform,background-color,box-shadow] hover:-translate-y-0.5 hover:bg-[#e8f3e9] hover:shadow-[0_10px_24px_rgba(4,24,19,0.2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b5d6bb] focus-visible:ring-offset-2 focus-visible:ring-offset-[#285b4c]"
              >
                Masuk ke sistem
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <button
              onClick={() => scrollTo("features")}
              data-testid="button-cta-features"
              className="inline-flex min-h-[46px] items-center justify-center gap-2 border border-white/40 px-5 py-3.5 text-[14px] font-medium text-white/90 transition-colors hover:border-white/75 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b5d6bb]"
            >
              Lihat modul
            </button>
          </div>
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
        <div className="grid grid-cols-1 gap-10 md:grid-cols-12">

          {/* Brand */}
          <motion.div
            {...fadeLeftView(0, reduced ?? false)}
            className="md:col-span-5"
          >
            <div className="flex items-center mb-4">
              <img
                src={VIREON_WORDMARK}
                alt="VIREON Library"
                className="block w-[154px] h-auto object-contain"
                style={{ filter: "none" }}
                loading="eager"
                fetchPriority="high"
                decoding="sync"
              />
            </div>
            <p className="mb-5 max-w-[300px] text-[14px] leading-relaxed text-slate-700">
              Ruang kerja untuk katalog, anggota, peminjaman, pengembalian, dan laporan perpustakaan.
            </p>
          </motion.div>

          {/* Nav */}
          <motion.div {...fadeUpView(0.1, reduced ?? false)} className="md:col-span-3">
            <h3 className="text-[11px] font-bold text-slate-900 uppercase tracking-[0.08em] mb-4">Navigasi</h3>
            <ul className="space-y-3">
              {[{ label: "Cara Kerja", id: "how" }, { label: "Fitur", id: "features" }, { label: "Tentang", id: "about" }].map(({ label, id }) => (
                <li key={label}>
                  <button onClick={() => scrollTo(id)} className="text-[13.5px] text-slate-700 hover:text-slate-900 transition-colors duration-150">{label}</button>
                </li>
              ))}
              <li>
                <Link href="/login" className="text-[13.5px] text-slate-700 hover:text-slate-900 transition-colors duration-150">Masuk</Link>
              </li>
            </ul>
          </motion.div>

          {/* Info + contact */}
          <motion.div {...fadeRightView(0.18, reduced ?? false)} className="md:col-span-4">
            <h3 className="text-[11px] font-bold text-slate-900 uppercase tracking-[0.08em] mb-4">Informasi</h3>
            <ul className="space-y-3">
              <li>
                <p className="text-[13px] text-slate-600">Dikembangkan oleh</p>
                <p className="text-[13.5px] font-semibold text-slate-700 mt-0.5">REYHAN IRZA</p>
              </li>
              <li><p className="text-[13.5px] text-slate-700">Dibuat untuk ruang baca yang terus tumbuh.</p></li>
            </ul>

            <div className="mt-7 pt-6 border-t border-slate-100">
              <p className="text-[11px] font-bold text-slate-900 uppercase tracking-[0.08em] mb-2">Kerja sama &amp; feedback</p>
              <p className="text-[13px] text-slate-700 leading-relaxed max-w-[250px] mb-3.5">
                Punya ide, pertanyaan, atau ingin berkolaborasi? Hubungi kami.
              </p>
              <div className="flex items-center gap-2.5">
                <a
                  href="https://wa.me/6281385242876"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Hubungi melalui WhatsApp"
                  title="WhatsApp"
                  className="group inline-flex h-9 w-9 items-center justify-center rounded-sm border border-slate-200/80 bg-white text-slate-500 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-600 hover:shadow-[0_6px_16px_rgba(16,185,129,0.14)] focus-visible:outline-none"
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
                  className="group inline-flex h-9 w-9 items-center justify-center rounded-sm border border-slate-200/80 bg-white text-slate-500 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:border-fuchsia-200 hover:bg-fuchsia-50 hover:text-fuchsia-600 hover:shadow-[0_6px_16px_rgba(217,70,239,0.14)] focus-visible:outline-none"
                >
                  <Instagram className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
                  <span className="sr-only">Instagram @irzalvano_</span>
                </a>
                <a
                  href="mailto:irzanour@gmail.com"
                  aria-label="Kirim email ke irzanour@gmail.com"
                  title="Email"
                  className="group inline-flex h-9 w-9 items-center justify-center rounded-sm border border-slate-200/80 bg-white text-slate-500 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:border-sky-200 hover:bg-sky-50 hover:text-sky-600 hover:shadow-[0_6px_16px_rgba(14,165,233,0.14)] focus-visible:outline-none"
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
                  className="group inline-flex h-9 w-9 items-center justify-center rounded-sm border border-slate-200/80 bg-white text-slate-500 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900 hover:shadow-[0_6px_16px_rgba(15,23,42,0.12)] focus-visible:outline-none"
                >
                  <Github className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
                  <span className="sr-only">GitHub Reyhan Irza</span>
                </a>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[12.5px] text-slate-600">&copy; {year} Vireon Library. Dibuat untuk ruang baca yang terus tumbuh.</p>
          <p className="text-[12.5px] text-slate-600">Dirancang dan dikembangkan oleh <span className="font-mono tracking-[0.08em] font-semibold text-slate-800">REYHAN IRZA</span></p>
        </div>
      </div>
    </footer>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const landingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = document.documentElement;
    const wasDark = root.classList.contains("dark");
    root.classList.remove("dark");
    return () => {
      if (wasDark) root.classList.add("dark");
    };
  }, []);

  useGsapLandingScroll(landingRef);

  return (
    <div ref={landingRef} className="landing-shell relative min-h-screen overflow-x-hidden">
      <LandingNav />
      <ScrollUpDock />
      <main>
        <LandingHeroEditorial />
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
