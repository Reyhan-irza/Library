import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, ChevronRight, Command, CornerDownLeft } from "lucide-react";

const items = [
  { label: "Cara Kerja", id: "how", index: "01", note: "Mulai dengan ritme yang lebih ringan" },
  { label: "Fitur", id: "features", index: "02", note: "Semua yang perlu, tanpa kebisingan" },
  { label: "Tentang", id: "about", index: "03", note: "Dibuat untuk ruang baca yang tumbuh" },
];

const ease = [0.16, 1, 0.3, 1] as const;

function MenuMark({ open }: { open: boolean }) {
  return (
    <span className="relative flex h-5 w-7 items-center justify-center" aria-hidden="true">
      <motion.span
        className="absolute h-px w-7 origin-center bg-current"
        animate={open ? { rotate: 45, y: 0 } : { rotate: 0, y: -4 }}
        transition={{ duration: 0.52, ease }}
      />
      <motion.span
        className="absolute h-px w-5 origin-center bg-current"
        animate={open ? { rotate: -45, y: 0, width: 28 } : { rotate: 0, y: 4, width: 20 }}
        transition={{ duration: 0.52, ease }}
      />
      <motion.span
        className="absolute -right-1 top-1/2 h-1 w-1 -translate-y-1/2 rounded-full bg-[#54d8b2]"
        animate={open ? { opacity: 0, scale: 0 } : { opacity: 1, scale: 1 }}
        transition={{ duration: 0.28, ease }}
      />
    </span>
  );
}

function VireonMark() {
  return (
    <div className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-[13px] bg-[linear-gradient(145deg,#5ef1c0_0%,#169477_48%,#0b302b_100%)] shadow-[0_8px_20px_rgba(34,211,167,0.2)]">
      <div className="absolute inset-[1px] rounded-[12px] border border-white/30" />
      <span className="relative -mt-0.5 font-['Sora'] text-[22px] font-extrabold leading-none tracking-[-0.12em] text-[#062b27]">V</span>
    </div>
  );
}

export function PremiumMenu() {
  const [open, setOpen] = useState(true);
  const [active, setActive] = useState("features");
  const closeRef = useRef<HTMLButtonElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  const motionProps = reduced
    ? {}
    : { initial: { opacity: 0, y: -18 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -12 } };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#071f1d] font-['DM_Sans'] text-[#f5f4ec]">
      <div
        className="absolute inset-0 opacity-90"
        style={{
          background:
            "radial-gradient(circle at 82% 18%, rgba(60, 202, 161, 0.2), transparent 34%), radial-gradient(circle at 12% 76%, rgba(29, 98, 86, 0.32), transparent 40%), linear-gradient(145deg, #0b2a27 0%, #071e1c 58%, #041412 100%)",
        }}
      />
      <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: "linear-gradient(120deg, transparent 0%, rgba(255,255,255,.5) 48%, transparent 52%)", backgroundSize: "7px 7px" }} />

      <header className="relative z-30 flex h-[78px] items-center justify-between border-b border-white/10 px-6">
        <div className="flex items-center gap-3">
          <VireonMark />
          <div className="leading-none">
            <p className="font-['Sora'] text-[13px] font-bold tracking-[0.08em] text-white">VIREON</p>
            <p className="mt-1 text-[8px] uppercase tracking-[0.22em] text-white/45">Library System</p>
          </div>
        </div>
        <button
          ref={closeRef}
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-label={open ? "Tutup menu" : "Buka menu"}
          aria-expanded={open}
          className="group flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] text-white/85 backdrop-blur-xl transition-colors hover:border-[#54d8b2]/60 hover:bg-[#54d8b2]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#54d8b2] focus-visible:ring-offset-2 focus-visible:ring-offset-[#071f1d]"
        >
          <MenuMark open={open} />
        </button>
      </header>

      <section className="relative z-10 px-6 pb-16 pt-24">
        <p className="mb-5 flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-[#78e6c3]/70">
          <span className="h-1.5 w-1.5 rounded-full bg-[#54d8b2]" />
          Ruang baca digital
        </p>
        <h1 className="max-w-[340px] font-['Sora'] text-[46px] font-semibold leading-[1.03] tracking-[-0.07em] text-white/90">
          Semua yang penting, <span className="text-[#57ddb7]">lebih dekat.</span>
        </h1>
        <p className="mt-6 max-w-[300px] text-[14px] leading-7 text-white/55">
          Sistem yang rapi untuk menjaga alur koleksi, anggota, dan peminjaman tetap terasa ringan.
        </p>
      </section>

      <AnimatePresence>
        {open && (
          <motion.div
            {...motionProps}
            transition={reduced ? undefined : { duration: 0.62, ease }}
            className="absolute inset-x-0 top-[78px] z-20 min-h-[822px] overflow-hidden border-t border-[#54d8b2]/20 bg-[#092b28]/[0.97] backdrop-blur-2xl"
            role="dialog"
            aria-modal="true"
            aria-label="Navigasi Vireon"
          >
            <div className="absolute -right-32 -top-20 h-[390px] w-[390px] rounded-full bg-[#43d0aa]/[0.13] blur-3xl" aria-hidden="true" />
            <div className="absolute -bottom-36 -left-28 h-[360px] w-[360px] rounded-full bg-[#0f7160]/20 blur-3xl" aria-hidden="true" />

            <div className="relative px-6 pb-8 pt-10">
              <div className="mb-10 flex items-end justify-between border-b border-white/10 pb-5">
                <div>
                  <p className="mb-2 font-['Space_Mono'] text-[9px] uppercase tracking-[0.2em] text-[#54d8b2]">Navigate the quiet</p>
                  <h2 className="font-['Sora'] text-[28px] font-semibold tracking-[-0.055em] text-white">Ruang untuk bergerak.</h2>
                </div>
                <div className="mb-1 flex items-center gap-1.5 text-[9px] uppercase tracking-[0.14em] text-white/35">
                  <Command className="h-3 w-3" />
                  <span>Menu</span>
                </div>
              </div>

              <nav aria-label="Navigasi mobile">
                <ul className="space-y-1">
                  {items.map((item, index) => {
                    const isActive = active === item.id;
                    return (
                      <motion.li
                        key={item.id}
                        {...(reduced ? {} : { initial: { opacity: 0, x: -22 }, animate: { opacity: 1, x: 0 } })}
                        transition={reduced ? undefined : { duration: 0.58, delay: 0.12 + index * 0.09, ease }}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setActive(item.id);
                            setOpen(false);
                          }}
                          className={`group relative flex min-h-[76px] w-full items-center gap-4 border-b border-white/[0.09] text-left transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#54d8b2] focus-visible:ring-inset ${isActive ? "text-white" : "text-white/50 hover:text-white/90"}`}
                        >
                          <span className={`font-['Space_Mono'] text-[10px] transition-colors ${isActive ? "text-[#54d8b2]" : "text-white/25"}`}>{item.index}</span>
                          <span className="flex-1">
                            <span className="block font-['Sora'] text-[27px] font-medium tracking-[-0.06em]">{item.label}</span>
                            <span className={`mt-1 block text-[11px] transition-all duration-300 ${isActive ? "translate-x-0 text-white/42 opacity-100" : "-translate-x-2 opacity-0"}`}>{item.note}</span>
                          </span>
                          <span className={`flex h-10 w-10 items-center justify-center rounded-full border transition-all duration-300 ${isActive ? "border-[#54d8b2]/40 bg-[#54d8b2]/10 text-[#54d8b2]" : "border-white/10 text-white/25 group-hover:border-white/30 group-hover:text-white/75"}`}>
                            {isActive ? <ArrowUpRight className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </span>
                          {isActive && <motion.span layoutId="active-menu-line" className="absolute bottom-[-1px] left-0 h-px w-20 bg-[#54d8b2]" transition={{ duration: 0.42, ease }} />}
                        </button>
                      </motion.li>
                    );
                  })}
                </ul>
              </nav>

              <motion.div
                {...(reduced ? {} : { initial: { opacity: 0, y: 18 }, animate: { opacity: 1, y: 0 } })}
                transition={reduced ? undefined : { duration: 0.58, delay: 0.48, ease }}
                className="mt-8"
              >
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex min-h-[58px] w-full items-center justify-between rounded-2xl bg-[#54d8b2] px-5 text-left text-[#062b27] transition-transform duration-300 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b4f7df] focus-visible:ring-offset-2 focus-visible:ring-offset-[#092b28]"
                >
                  <span>
                    <span className="block font-['Sora'] text-[14px] font-bold">Mulai Sekarang</span>
                    <span className="mt-0.5 block text-[11px] text-[#062b27]/65">Masuk ke ruang kerja Vireon</span>
                  </span>
                  <ArrowUpRight className="h-5 w-5" />
                </button>
                <div className="mt-5 flex items-center gap-2 text-[10px] text-white/35">
                  <CornerDownLeft className="h-3 w-3" />
                  <span>Tekan Escape untuk menutup</span>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="absolute left-6 top-[660px] z-10 rounded-full border border-white/15 bg-white/[0.07] px-4 py-2 text-[11px] text-white/60 backdrop-blur-xl transition-colors hover:border-[#54d8b2]/50 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#54d8b2]"
        >
          Buka menu untuk mencoba
        </button>
      )}
    </main>
  );
}