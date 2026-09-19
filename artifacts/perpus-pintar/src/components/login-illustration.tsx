import { motion, useReducedMotion, type Transition } from "framer-motion";
import { useEffect, useState, useRef } from "react";

export type PrivacyBookState = "idle" | "email" | "password-hidden" | "password-visible";

export interface PrivacyBookProps {
  state: PrivacyBookState;
  className?: string;
}

export function PrivacyBook({ state, className = "" }: PrivacyBookProps) {
  const reduced = useReducedMotion() ?? true;
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (reduced || !window.matchMedia("(pointer: fine)").matches) return;

    let rafId: number | null = null;
    const handleMouseMove = (e: MouseEvent) => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        // Bound tracking strictly so it never looks broken
        const maxTrack = 1;
        const x = Math.max(-maxTrack, Math.min(maxTrack, (e.clientX - cx) / (window.innerWidth / 3)));
        const y = Math.max(-maxTrack, Math.min(maxTrack, (e.clientY - cy) / (window.innerHeight / 3)));
        setMousePos({ x, y });
      });
    };

    if (state === "idle" || state === "password-visible") {
      window.addEventListener("mousemove", handleMouseMove);
    } else {
      setMousePos({ x: 0, y: 0 });
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [state, reduced]);

  // Eases
  const springConfig: Transition = reduced
    ? { duration: 0 }
    : { type: "spring", stiffness: 120, damping: 15 };

  const smoothEase: Transition = reduced
    ? { duration: 0 }
    : { duration: 0.5, ease: [0.22, 1, 0.36, 1] };

  const eyeTransition: Transition = reduced
    ? { duration: 0 }
    : { type: "spring", stiffness: 150, damping: 12 };

  // Rotations for 3D pages based on privacy context
  const getLeftRotateY = () => {
    if (state === "password-hidden") return 87; // Fold inward to shield
    if (state === "password-visible") return 12; // Open wide
    return 25; // Default reading angle
  };

  const getRightRotateY = () => {
    if (state === "password-hidden") return -87;
    if (state === "password-visible") return -12;
    return -25;
  };

  const getRotateX = () => {
    if (state === "email") return 22; // Tilt down to look at email field
    if (state === "password-hidden") return 0;
    return 8;
  };

  const getBookTranslateY = () => {
    if (state === "email") return 4;
    if (state === "password-hidden") return -2; // Lift up defensively
    return 0;
  };

  // Eyes (bookmarks) mapping
  const eyeX = mousePos.x * 5;
  const eyeY = state === "email" ? 14 : state === "password-visible" ? -1 : mousePos.y * 5;
  const eyeScale = state === "password-visible" ? 1.15 : 1;

  // React cast needed for non-standard WebKit style props in some TS versions
  type CSSPropertiesWithWebKit = React.CSSProperties & {
    WebkitTransformStyle?: "preserve-3d" | "flat";
    WebkitBackfaceVisibility?: "visible" | "hidden";
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-[112px] h-[80px] ${className}`}
      style={{ perspective: "1000px" }}
      aria-hidden="true"
    >
      <motion.div
        className="w-full h-full flex justify-center relative"
        animate={{ rotateX: getRotateX(), y: getBookTranslateY() }}
        transition={smoothEase}
        style={{ transformStyle: "preserve-3d", WebkitTransformStyle: "preserve-3d" } as CSSPropertiesWithWebKit}
      >
        {/* Book Cover */}
        <div className="absolute inset-0 flex justify-center" style={{ transformStyle: "preserve-3d", WebkitTransformStyle: "preserve-3d", transform: "translateZ(-4px)" } as CSSPropertiesWithWebKit}>
          <motion.div
            className="w-[58px] h-[84px] -mt-[2px] rounded-l-md border border-emerald-900/60 origin-right shadow-sm"
            style={{ background: "hsl(161 52% 28%)" }}
            animate={{ rotateY: getLeftRotateY() + 4 }}
            transition={springConfig}
          />
          <motion.div
            className="w-[58px] h-[84px] -mt-[2px] rounded-r-md border border-emerald-900/60 origin-left shadow-sm"
            style={{ background: "hsl(161 52% 28%)" }}
            animate={{ rotateY: getRightRotateY() - 4 }}
            transition={springConfig}
          />
        </div>

        {/* Paper block (creates physical page thickness) */}
        <div className="absolute inset-0 flex justify-center pointer-events-none" style={{ transformStyle: "preserve-3d", WebkitTransformStyle: "preserve-3d", transform: "translateZ(-2px)" } as CSSPropertiesWithWebKit}>
           <motion.div
             className="w-[54px] h-[78px] bg-slate-200 border-y border-l border-slate-300 rounded-l-sm mt-[1px] mr-[1px] origin-right"
             animate={{ rotateY: getLeftRotateY() + 1.5 }}
             transition={springConfig}
           />
           <motion.div
             className="w-[54px] h-[78px] bg-slate-200 border-y border-r border-slate-300 rounded-r-sm mt-[1px] ml-[1px] origin-left"
             animate={{ rotateY: getRightRotateY() - 1.5 }}
             transition={springConfig}
           />
        </div>

        {/* Top Pages (Main visual) */}
        <div className="absolute inset-0 flex justify-center" style={{ transformStyle: "preserve-3d", WebkitTransformStyle: "preserve-3d" } as CSSPropertiesWithWebKit}>
          <motion.div
            className="w-[54px] h-[78px] bg-[#fdfdfc] mt-[1px] border-y border-l border-slate-200 rounded-l-sm origin-right relative overflow-hidden flex flex-col items-end pt-3 pr-3"
            animate={{ rotateY: getLeftRotateY() }}
            transition={springConfig}
            style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", boxShadow: "inset -6px 0 12px rgba(0,0,0,0.02)" } as CSSPropertiesWithWebKit}
          >
            {/* Left Eye / Bookmark */}
            <motion.div
              className="w-3.5 h-3.5 bg-slate-700 rounded-full"
              animate={{ x: eyeX, y: eyeY, scale: eyeScale }}
              transition={eyeTransition}
            />
            <div className="w-7 h-1 bg-slate-100 rounded-full mt-5 mb-1.5" />
            <div className="w-9 h-1 bg-slate-100 rounded-full mb-1.5" />
            <div className="w-5 h-1 bg-slate-100 rounded-full" />
          </motion.div>

          <motion.div
            className="w-[54px] h-[78px] bg-[#fdfdfc] mt-[1px] border-y border-r border-slate-200 rounded-r-sm origin-left relative overflow-hidden flex flex-col items-start pt-3 pl-3"
            animate={{ rotateY: getRightRotateY() }}
            transition={springConfig}
            style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", boxShadow: "inset 6px 0 12px rgba(0,0,0,0.02)" } as CSSPropertiesWithWebKit}
          >
            {/* Right Eye / Bookmark */}
            <motion.div
              className="w-3.5 h-3.5 bg-slate-700 rounded-full"
              animate={{ x: eyeX, y: eyeY, scale: eyeScale }}
              transition={eyeTransition}
            />
            <div className="w-9 h-1 bg-slate-100 rounded-full mt-5 mb-1.5" />
            <div className="w-5 h-1 bg-slate-100 rounded-full mb-1.5" />
            <div className="w-8 h-1 bg-slate-100 rounded-full" />
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
