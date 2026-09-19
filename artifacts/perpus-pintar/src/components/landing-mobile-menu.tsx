import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowUpRight,
  ChevronRight,
  Command,
  CornerDownLeft,
  LogIn,
} from "lucide-react";
import { Link } from "wouter";

const MENU_ITEMS = [
  {
    label: "Cara Kerja",
    id: "how",
    index: "01",
    note: "Mulai dengan ritme yang lebih ringan",
  },
  {
    label: "Fitur",
    id: "features",
    index: "02",
    note: "Semua yang perlu, tanpa kebisingan",
  },
  {
    label: "Tentang",
    id: "about",
    index: "03",
    note: "Dibuat untuk ruang baca yang tumbuh",
  },
] as const;

const MENU_EASE = [0.16, 1, 0.3, 1] as const;
const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function MobileMenuMark({ open }: { open: boolean }) {
  const reduced = useReducedMotion();
  const transition = reduced ? { duration: 0 } : { duration: 0.52, ease: MENU_EASE };

  return (
    <span className="relative flex h-5 w-7 items-center justify-center" aria-hidden="true">
      <motion.span
        className="absolute h-px w-7 origin-center bg-current"
        animate={open ? { rotate: 45, y: 0 } : { rotate: 0, y: -4 }}
        transition={transition}
      />
      <motion.span
        className="absolute h-px w-5 origin-center bg-current"
        animate={open ? { rotate: -45, y: 0, width: 28 } : { rotate: 0, y: 4, width: 20 }}
        transition={transition}
      />
      <motion.span
        className="absolute -right-1 top-1/2 h-1 w-1 -translate-y-1/2 rounded-full bg-[#54d8b2]"
        animate={open ? { opacity: 0, scale: 0 } : { opacity: 1, scale: 1 }}
        transition={reduced ? { duration: 0 } : { duration: 0.28, ease: MENU_EASE }}
      />
    </span>
  );
}

interface LandingMobileMenuProps {
  open: boolean;
  onClose: () => void;
  onNavigate: (id: string) => void;
  toggleRef: RefObject<HTMLButtonElement | null>;
}

export function LandingMobileMenu({
  open,
  onClose,
  onNavigate,
  toggleRef,
}: LandingMobileMenuProps) {
  const [active, setActive] = useState("features");
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstItemRef = useRef<HTMLButtonElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    const focusFrame = window.requestAnimationFrame(() => firstItemRef.current?.focus());
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") return;

      const menuElements = dialogRef.current
        ? Array.from(dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
        : [];
      const focusable = [toggleRef.current, ...menuElements].filter(
        (element): element is HTMLElement =>
          Boolean(element && !element.hasAttribute("disabled") && element.offsetParent !== null),
      );

      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const activeElement = document.activeElement;

      if (event.shiftKey && activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.cancelAnimationFrame(focusFrame);
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      toggleRef.current?.focus();
    };
  }, [onClose, open, toggleRef]);

  const motionProps = reduced
    ? {}
    : {
        initial: { opacity: 0, y: -18 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -12 },
      };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          {...motionProps}
          ref={dialogRef}
          id="vireon-mobile-menu"
          role="dialog"
          aria-modal="true"
          aria-labelledby="vireon-mobile-menu-title"
          transition={reduced ? undefined : { duration: 0.62, ease: MENU_EASE }}
          className="fixed inset-x-0 bottom-0 top-[60px] z-40 overflow-y-auto overscroll-contain border-t border-[#54d8b2]/20 bg-[#092b28]/[0.985] text-[#f5f4ec] shadow-[0_24px_80px_rgba(1,14,12,0.58)] backdrop-blur-2xl md:hidden"
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.09]"
            style={{
              backgroundImage:
                "linear-gradient(120deg, transparent 0%, rgba(255,255,255,.46) 48%, transparent 52%)",
              backgroundSize: "7px 7px",
            }}
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -right-32 -top-20 h-[390px] w-[390px] rounded-full bg-[#43d0aa]/[0.13] blur-3xl"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -bottom-36 -left-28 h-[360px] w-[360px] rounded-full bg-[#0f7160]/20 blur-3xl"
            aria-hidden="true"
          />

          <div className="relative mx-auto flex min-h-full w-full max-w-lg flex-col px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-7 sm:px-6 sm:pt-10">
            <div className="mb-7 flex items-end justify-between border-b border-white/10 pb-5 sm:mb-10">
              <div>
                <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.2em] text-[#54d8b2]">
                  Navigate the quiet
                </p>
                <h2
                  id="vireon-mobile-menu-title"
                  className="font-heading text-[26px] font-semibold tracking-[-0.055em] text-white sm:text-[28px]"
                >
                  Ruang untuk bergerak.
                </h2>
              </div>
              <div className="mb-1 flex items-center gap-1.5 text-[9px] uppercase tracking-[0.14em] text-white/35">
                <Command className="h-3 w-3" aria-hidden="true" />
                <span>Menu</span>
              </div>
            </div>

            <nav aria-label="Navigasi mobile VIREON">
              <ul className="space-y-1">
                {MENU_ITEMS.map((item, index) => {
                  const isActive = active === item.id;
                  return (
                    <motion.li
                      key={item.id}
                      {...(reduced
                        ? {}
                        : {
                            initial: { opacity: 0, x: -22 },
                            animate: { opacity: 1, x: 0 },
                          })}
                      transition={
                        reduced
                          ? undefined
                          : {
                              duration: 0.58,
                              delay: 0.12 + index * 0.09,
                              ease: MENU_EASE,
                            }
                      }
                    >
                      <button
                        ref={index === 0 ? firstItemRef : undefined}
                        type="button"
                        onClick={() => {
                          setActive(item.id);
                          onNavigate(item.id);
                        }}
                        data-testid={`button-mobile-nav-${item.id}`}
                        className={`group relative flex min-h-[72px] w-full items-center gap-4 border-b border-white/[0.09] text-left transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#54d8b2] focus-visible:ring-inset sm:min-h-[76px] ${
                          isActive ? "text-white" : "text-white/50 hover:text-white/90"
                        }`}
                      >
                        <span
                          className={`font-mono text-[10px] transition-colors ${
                            isActive ? "text-[#54d8b2]" : "text-white/25"
                          }`}
                        >
                          {item.index}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block font-heading text-[25px] font-medium tracking-[-0.06em] sm:text-[27px]">
                            {item.label}
                          </span>
                          <span
                            className={`mt-1 block truncate text-[11px] transition-all duration-300 ${
                              isActive
                                ? "translate-x-0 text-white/45 opacity-100"
                                : "-translate-x-2 opacity-0"
                            }`}
                          >
                            {item.note}
                          </span>
                        </span>
                        <span
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-all duration-300 ${
                            isActive
                              ? "border-[#54d8b2]/40 bg-[#54d8b2]/10 text-[#54d8b2]"
                              : "border-white/10 text-white/25 group-hover:border-white/30 group-hover:text-white/75"
                          }`}
                        >
                          {isActive ? (
                            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                          ) : (
                            <ChevronRight className="h-4 w-4" aria-hidden="true" />
                          )}
                        </span>
                        {isActive && (
                          <motion.span
                            layoutId="active-mobile-menu-line"
                            className="absolute bottom-[-1px] left-0 h-px w-20 bg-[#54d8b2]"
                            transition={reduced ? { duration: 0 } : { duration: 0.42, ease: MENU_EASE }}
                            aria-hidden="true"
                          />
                        )}
                      </button>
                    </motion.li>
                  );
                })}
              </ul>
            </nav>

            <motion.div
              {...(reduced
                ? {}
                : {
                    initial: { opacity: 0, y: 18 },
                    animate: { opacity: 1, y: 0 },
                  })}
              transition={
                reduced
                  ? undefined
                  : { duration: 0.58, delay: 0.48, ease: MENU_EASE }
              }
              className="mt-7 sm:mt-8"
            >
              <Link
                href="/login"
                onClick={onClose}
                data-testid="link-mobile-menu-primary"
                className="flex min-h-[58px] w-full items-center justify-between rounded-2xl bg-[#54d8b2] px-5 text-left text-[#062b27] shadow-[0_12px_32px_rgba(14,113,93,0.3)] transition-[transform,background-color] duration-300 hover:-translate-y-0.5 hover:bg-[#64e7c1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b4f7df] focus-visible:ring-offset-2 focus-visible:ring-offset-[#092b28]"
              >
                <span>
                  <span className="block font-heading text-[14px] font-bold">Mulai Sekarang</span>
                  <span className="mt-0.5 block text-[11px] text-[#062b27]/65">
                    Masuk ke ruang kerja VIREON
                  </span>
                </span>
                <ArrowUpRight className="h-5 w-5" aria-hidden="true" />
              </Link>

              <Link
                href="/login"
                onClick={onClose}
                data-testid="link-mobile-menu-login"
                className="mt-3 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-5 text-[13px] font-semibold text-white/70 transition-colors hover:border-white/20 hover:bg-white/[0.07] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#54d8b2]"
              >
                <LogIn className="h-4 w-4" aria-hidden="true" />
                Sudah punya akun? Masuk
              </Link>

              <div className="mt-5 flex items-center gap-2 text-[10px] text-white/35">
                <CornerDownLeft className="h-3 w-3" aria-hidden="true" />
                <span>Tekan Escape untuk menutup</span>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}