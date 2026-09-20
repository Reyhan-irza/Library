import { AnimatePresence, motion, useReducedMotion, type Transition } from "framer-motion";
import { useEffect, useState, useRef } from "react";

export type PrivacyBookState = "idle" | "email" | "password-hidden" | "password-visible";

export interface PrivacyBookProps {
  state: PrivacyBookState;
  className?: string;
  /** Normalized caret position from -1 (start) to 1 (end). */
  typingProgress?: number;
  /** Lets the mascot react to the result of the login attempt. */
  hasError?: boolean;
  isSubmitting?: boolean;
}

export function PrivacyBook({
  state,
  className = "",
  typingProgress = 0,
  hasError = false,
  isSubmitting = false,
}: PrivacyBookProps) {
  const reduced = useReducedMotion() ?? true;
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isBlinking, setIsBlinking] = useState(false);
  const expression = hasError
    ? "error"
    : isSubmitting
      ? "busy"
      : state === "email"
        ? "curious"
          : state === "password-hidden"
            ? "delighted"
            : state === "password-visible"
              ? "shy"
            : "calm";

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

  useEffect(() => {
    if (reduced) {
      setIsBlinking(false);
      return;
    }

    let blinkTimer: number | undefined;
    let openTimer: number | undefined;

    const scheduleBlink = () => {
      blinkTimer = window.setTimeout(() => {
        setIsBlinking(true);
        openTimer = window.setTimeout(() => {
          setIsBlinking(false);
          scheduleBlink();
        }, 115);
      }, 2800 + Math.random() * 2400);
    };

    scheduleBlink();

    return () => {
      if (blinkTimer) window.clearTimeout(blinkTimer);
      if (openTimer) window.clearTimeout(openTimer);
    };
  }, [reduced]);

  // Eases
  const springConfig: Transition = reduced
    ? { duration: 0 }
    : { type: "spring", stiffness: 270, damping: 18, mass: 0.65 };

  const smoothEase: Transition = reduced
    ? { duration: 0 }
    : { duration: 0.22, ease: [0.22, 1, 0.36, 1] };

  const eyeTransition: Transition = reduced
    ? { duration: 0 }
    : { type: "spring", stiffness: 340, damping: 19, mass: 0.45 };

  // Rotations for 3D pages based on privacy context
  const getLeftRotateY = () => {
    if (state === "password-hidden") return 12; // Open wide when the password is hidden
    if (state === "password-visible") return 87; // Fold inward to shield the visible password
    return 25; // Default reading angle
  };

  const getRightRotateY = () => {
    if (state === "password-hidden") return -12;
    if (state === "password-visible") return -87;
    return -25;
  };

  const getRotateX = () => {
    if (state === "email") return 22; // Tilt down to look at email field
    if (state === "password-visible") return 0;
    return 8;
  };

  const getBookTranslateY = () => {
    if (state === "email") return 4;
    if (state === "password-visible") return -2; // Lift up defensively while shielding visible text
    return 0;
  };

  // Eyes (bookmarks) mapping
  // While typing, the caret is the focus target. Do not blend mouse tracking
  // into this state or the mascot looks at the visitor instead of the text.
  const eyeX = state === "email" ? 0 : mousePos.x * 5;
  const eyeY = state === "password-hidden" ? -1 : mousePos.y * 5;
  const eyeScale = state === "password-hidden" ? 1.15 : 1;
  // Map the normalized caret progress (-1 at the start, 1 at the end)
  // directly to the gaze target.
  const typingCursorX = Math.max(-5.5, Math.min(5.5, typingProgress * 5.5));
  const caretX = state === "email" ? typingCursorX : Math.max(-3.5, Math.min(3.5, typingProgress * 3.5));
  const focused = state !== "idle";
  const eyeOffsetX = eyeX + caretX;
  const emailLookY = Math.max(-1.5, Math.min(2.5, typingProgress * 1.4));
  const eyeOffsetY = state === "email" ? emailLookY : state === "password-hidden" ? 1 : eyeY;
  const eyeBodyX = state === "email" ? 0 : eyeOffsetX * 0.34;
  const eyeBodyY = state === "email" ? 0 : eyeOffsetY * 0.25;
  const pupilX = state === "email"
    ? Math.max(-5.5, Math.min(5.5, typingCursorX * 0.95))
    : eyeOffsetX * 0.34;
  const pupilY = state === "email"
    ? Math.max(-1.5, Math.min(1.8, emailLookY * 0.65))
    : eyeOffsetY * 0.42;
  const eyeScaleWithExpression =
    expression === "error" ? 0.9 : expression === "busy" ? 0.92 : eyeScale;
  const eyeLidScaleY = isBlinking
    ? 0.08
    : expression === "shy"
      ? 0.72
      : expression === "busy"
        ? 0.9
        : expression === "error"
          ? 0.86
          : 1;
  const pageRotateX = expression === "error" ? [0, -1.5, 1.5, -1, 0] : getRotateX();
  const pageTranslateY = expression === "busy" ? -1 : getBookTranslateY();

  // React cast needed for non-standard WebKit style props in some TS versions
  type CSSPropertiesWithWebKit = React.CSSProperties & {
    WebkitTransformStyle?: "preserve-3d" | "flat";
    WebkitBackfaceVisibility?: "visible" | "hidden";
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-[112px] h-[80px] select-none ${className}`}
      style={{ perspective: "1000px" }}
      aria-hidden="true"
    >
      <AnimatePresence>
        {(expression === "delighted" || expression === "busy") && (
          <motion.div
            key={expression}
            initial={{ opacity: 0, scale: 0.4, rotate: -12 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 280, damping: 14 }}
            className="pointer-events-none absolute -right-1 -top-1 z-20 text-[13px] font-black text-amber-400"
          >
            {expression === "busy" ? "· · ·" : "✦"}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ground shadow and a restrained open-book glow give the mascot physical
          presence without adding visual noise to the form. */}
      <motion.div
        className="pointer-events-none absolute bottom-[-2px] left-1/2 z-0 h-2 w-[68px] -translate-x-1/2 rounded-full bg-emerald-950/25 blur-[5px]"
        animate={{
          opacity: expression === "busy" ? 0.12 : expression === "shy" ? 0.3 : 0.22,
          scaleX: expression === "shy" ? 0.72 : expression === "delighted" ? 1.08 : 1,
        }}
        transition={smoothEase}
      />
      <motion.div
        className="pointer-events-none absolute left-1/2 top-[9px] z-0 h-[62px] w-[70px] -translate-x-1/2 rounded-full bg-emerald-300/10 blur-[14px]"
        animate={{
          opacity: state === "password-hidden" ? 0.85 : expression === "busy" ? 0.18 : 0.35,
          scale: state === "password-hidden" ? 1.06 : 0.9,
        }}
        transition={smoothEase}
      />

      <motion.div
        className="relative z-10 w-full h-full flex justify-center"
        animate={{
          rotateX: pageRotateX,
          y: pageTranslateY,
          scale: expression === "busy" ? 0.98 : 1,
          rotateZ: expression === "calm" ? [0, -0.55, 0.45, 0] : 0,
        }}
        transition={{
          rotateX: smoothEase,
          y: smoothEase,
          scale: smoothEase,
          rotateZ: reduced ? { duration: 0 } : { duration: 3.8, repeat: Infinity, ease: "easeInOut" },
        }}
        style={{ transformStyle: "preserve-3d", WebkitTransformStyle: "preserve-3d" } as CSSPropertiesWithWebKit}
      >
        {/* Book Cover */}
        <div className="absolute inset-0 flex justify-center" style={{ transformStyle: "preserve-3d", WebkitTransformStyle: "preserve-3d", transform: "translateZ(-4px)" } as CSSPropertiesWithWebKit}>
          <motion.div
            className="relative w-[58px] h-[84px] -mt-[2px] rounded-l-md border border-emerald-950/60 origin-right shadow-sm"
            style={{
              background: "linear-gradient(145deg, hsl(161 58% 42%) 0%, hsl(161 52% 29%) 58%, hsl(161 55% 21%) 100%)",
              boxShadow: "inset 3px 0 0 hsl(161 70% 58% / 0.18), 0 7px 12px hsl(161 52% 18% / 0.22)",
            }}
            animate={{ rotateY: getLeftRotateY() + 4 }}
            transition={springConfig}
          >
            <span className="absolute inset-y-3 right-2 w-px bg-white/15" />
            <span className="absolute bottom-2 left-3 h-px w-7 bg-white/15" />
          </motion.div>
          <motion.div
            className="relative w-[58px] h-[84px] -mt-[2px] rounded-r-md border border-emerald-950/60 origin-left shadow-sm"
            style={{
              background: "linear-gradient(215deg, hsl(161 58% 42%) 0%, hsl(161 52% 29%) 58%, hsl(161 55% 21%) 100%)",
              boxShadow: "inset -3px 0 0 hsl(161 70% 58% / 0.18), 0 7px 12px hsl(161 52% 18% / 0.22)",
            }}
            animate={{ rotateY: getRightRotateY() - 4 }}
            transition={springConfig}
          >
            <span className="absolute inset-y-3 left-2 w-px bg-white/15" />
            <span className="absolute bottom-2 right-3 h-px w-7 bg-white/15" />
          </motion.div>
        </div>

        {/* Paper block (creates physical page thickness) */}
        <div className="absolute inset-0 flex justify-center pointer-events-none" style={{ transformStyle: "preserve-3d", WebkitTransformStyle: "preserve-3d", transform: "translateZ(-2px)" } as CSSPropertiesWithWebKit}>
           <motion.div
             className="w-[54px] h-[78px] border-y border-l border-slate-300 rounded-l-sm mt-[1px] mr-[1px] origin-right"
             style={{ background: "linear-gradient(90deg, #cbd5e1 0%, #f8fafc 16%, #e2e8f0 100%)", boxShadow: "inset 5px 0 8px rgb(255 255 255 / 0.7)" }}
             animate={{ rotateY: getLeftRotateY() + 1.5 }}
             transition={springConfig}
           />
           <motion.div
             className="w-[54px] h-[78px] border-y border-r border-slate-300 rounded-r-sm mt-[1px] ml-[1px] origin-left"
             style={{ background: "linear-gradient(270deg, #cbd5e1 0%, #f8fafc 16%, #e2e8f0 100%)", boxShadow: "inset -5px 0 8px rgb(255 255 255 / 0.7)" }}
             animate={{ rotateY: getRightRotateY() - 1.5 }}
             transition={springConfig}
           />
        </div>

        {/* Top Pages (Main visual) */}
        <div className="absolute inset-0 flex justify-center" style={{ transformStyle: "preserve-3d", WebkitTransformStyle: "preserve-3d" } as CSSPropertiesWithWebKit}>
          <motion.div
             className="w-[54px] h-[78px] mt-[1px] border-y border-l border-slate-200 rounded-l-sm origin-right relative overflow-hidden flex flex-col items-end pt-3 pr-3"
            animate={{ rotateY: getLeftRotateY() }}
            transition={springConfig}
             style={{
               backfaceVisibility: "hidden",
               WebkitBackfaceVisibility: "hidden",
               background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 72%, #e2e8f0 100%)",
               boxShadow: "inset -7px 0 13px rgb(15 23 42 / 0.05), 0 2px 3px rgb(15 23 42 / 0.1)",
             } as CSSPropertiesWithWebKit}
          >
             <span
               className="pointer-events-none absolute left-0 top-0 h-3.5 w-3.5 bg-slate-100/90"
               style={{ clipPath: "polygon(0 0, 100% 0, 0 100%)" }}
             />
             <span className="pointer-events-none absolute bottom-2 left-3 h-px w-8 bg-slate-300/60" />
             <span className="pointer-events-none absolute bottom-4 left-5 h-px w-5 bg-slate-200/80" />
            <motion.div
              className="absolute top-[7px] right-[9px] h-1 w-3 rounded-full bg-slate-700/75 origin-right"
              animate={{
                 x: state === "email" ? typingCursorX * 0.2 : 0,
                rotate: expression === "curious" ? -18 : expression === "shy" ? 12 : expression === "error" ? 10 : -4,
                scaleX: expression === "busy" ? 0.75 : 1,
              }}
              transition={eyeTransition}
            />
            {/* Left Eye / Bookmark */}
            <motion.div
               className="relative w-3.5 h-3.5 rounded-full shadow-[inset_2px_2px_0_rgba(255,255,255,0.22),0_1px_2px_rgba(15,23,42,0.24)]"
               style={{ background: "radial-gradient(circle at 34% 28%, #ffffff 0 11%, #64748b 12% 28%, #1e293b 48%, #0f172a 100%)" }}
               animate={{
                 x: eyeBodyX,
                 y: eyeBodyY,
                 scale: eyeScaleWithExpression,
                 scaleY: eyeLidScaleY,
                 rotate: expression === "busy" ? -8 : expression === "error" ? -5 : 0,
               }}
              transition={eyeTransition}
            >
               <motion.span
                 className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-950 shadow-[0_0_0_1px_rgba(15,23,42,0.16)]"
                 animate={{ x: pupilX, y: pupilY }}
                 transition={eyeTransition}
               />
              <motion.span
                className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-white/75"
                animate={{ opacity: focused ? 0.95 : 0.65 }}
                transition={{ duration: 0.2 }}
              />
            </motion.div>
            <motion.div
              className="h-1 rounded-full bg-slate-100"
              animate={{ width: focused ? 30 : 28, opacity: focused ? 0.9 : 0.65 }}
              transition={{ duration: 0.25 }}
            />
            <motion.div
              className="h-1 rounded-full bg-slate-100"
              animate={{ width: focused ? 38 : 36, opacity: focused ? 0.8 : 0.55 }}
              transition={{ duration: 0.25, delay: 0.02 }}
            />
            <div className="h-1 w-5 rounded-full bg-slate-100/70" />
          </motion.div>

          <motion.div
             className="w-[54px] h-[78px] mt-[1px] border-y border-r border-slate-200 rounded-r-sm origin-left relative overflow-hidden flex flex-col items-start pt-3 pl-3"
            animate={{ rotateY: getRightRotateY() }}
            transition={springConfig}
             style={{
               backfaceVisibility: "hidden",
               WebkitBackfaceVisibility: "hidden",
               background: "linear-gradient(225deg, #ffffff 0%, #f8fafc 72%, #e2e8f0 100%)",
               boxShadow: "inset 7px 0 13px rgb(15 23 42 / 0.05), 0 2px 3px rgb(15 23 42 / 0.1)",
             } as CSSPropertiesWithWebKit}
          >
             <span
               className="pointer-events-none absolute right-0 top-0 h-3.5 w-3.5 bg-slate-100/90"
               style={{ clipPath: "polygon(0 0, 100% 0, 100% 100%)" }}
             />
             <span className="pointer-events-none absolute bottom-2 right-3 h-px w-8 bg-slate-300/60" />
             <span className="pointer-events-none absolute bottom-4 right-5 h-px w-5 bg-slate-200/80" />
            <motion.div
              className="absolute top-[7px] left-[9px] h-1 w-3 rounded-full bg-slate-700/75 origin-left"
              animate={{
                 x: state === "email" ? typingCursorX * 0.2 : 0,
                rotate: expression === "curious" ? 18 : expression === "shy" ? -12 : expression === "error" ? -10 : 4,
                scaleX: expression === "busy" ? 0.75 : 1,
              }}
              transition={eyeTransition}
            />
            {/* Right Eye / Bookmark */}
            <motion.div
               className="relative w-3.5 h-3.5 rounded-full shadow-[inset_-2px_2px_0_rgba(255,255,255,0.22),0_1px_2px_rgba(15,23,42,0.24)]"
               style={{ background: "radial-gradient(circle at 34% 28%, #ffffff 0 11%, #64748b 12% 28%, #1e293b 48%, #0f172a 100%)" }}
               animate={{
                 x: eyeBodyX,
                 y: eyeBodyY,
                 scale: eyeScaleWithExpression,
                 scaleY: eyeLidScaleY,
                 rotate: expression === "busy" ? 8 : expression === "error" ? 5 : 0,
               }}
              transition={eyeTransition}
            >
               <motion.span
                 className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-950 shadow-[0_0_0_1px_rgba(15,23,42,0.16)]"
                 animate={{ x: pupilX, y: pupilY }}
                 transition={eyeTransition}
               />
              <motion.span
                className="absolute -left-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-white/75"
                animate={{ opacity: focused ? 0.95 : 0.65 }}
                transition={{ duration: 0.2 }}
              />
            </motion.div>
            <motion.div
              className="h-1 rounded-full bg-slate-100"
              animate={{ width: focused ? 38 : 36, opacity: focused ? 0.9 : 0.65 }}
              transition={{ duration: 0.25 }}
            />
            <motion.div
              className="h-1 rounded-full bg-slate-100"
              animate={{ width: focused ? 22 : 20, opacity: focused ? 0.8 : 0.55 }}
              transition={{ duration: 0.25, delay: 0.02 }}
            />
            <div className="h-1 w-8 rounded-full bg-slate-100/70" />
          </motion.div>
        </div>

      </motion.div>

      {/* Privacy cue: make the closed-book state communicate protection,
          not only a changed facial expression. */}
      <AnimatePresence>
        {state === "password-visible" && (
          <motion.div
            key="privacy-lock"
            initial={{ opacity: 0, scale: 0.65, y: -4, rotate: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.65, y: -3, rotate: 8 }}
            transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 330, damping: 17 }}
            className="pointer-events-none absolute -right-1 top-1 z-30 flex h-6 w-6 items-end justify-center"
            aria-hidden="true"
          >
            <span className="absolute top-0 h-3 w-3.5 rounded-t-full border-[2px] border-emerald-800/85 border-b-0" />
            <span className="relative mb-0.5 block h-3.5 w-5 rounded-[4px] border border-emerald-950/50 bg-emerald-700 shadow-[0_2px_4px_rgba(15,23,42,0.2)]">
              <span className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-100/90" />
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Keep the expression above the 3D page layers. The pages use
          overflow-hidden, so putting the mouth inside them makes it disappear. */}
      <motion.div
        className="pointer-events-none absolute left-1/2 top-[57px] z-30 flex -translate-x-1/2 items-center justify-center"
        animate={{
          y: getBookTranslateY() + (expression === "curious" ? 1 : expression === "shy" ? 2 : expression === "busy" ? -1 : 0),
          scale: expression === "error" ? 0.98 : expression === "delighted" ? 1.05 : 1,
        }}
        transition={smoothEase}
      >
        <motion.span
          className="absolute -left-[28px] h-2.5 w-4 rounded-full bg-rose-300/80 blur-[0.2px]"
          animate={{
            opacity: expression === "calm" || expression === "shy" ? 0.65 : 1,
            scaleX: expression === "error" ? 1.25 : 1,
          }}
          transition={smoothEase}
        />
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={expression}
            initial={{ opacity: 0, scale: 0.55, y: 2 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.55, y: -1 }}
            transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 18 }}
            className={`drop-shadow-[0_1px_1px_rgba(15,23,42,0.16)] ${
              expression === "delighted"
                ? "h-3.5 w-6 rounded-b-full border-x-2 border-b-[3px] border-slate-700 bg-rose-100/70"
                : expression === "curious"
                  ? "h-4 w-4 rounded-full border-[2.5px] border-slate-700 bg-white/50"
                  : expression === "shy"
                    ? "h-2 w-5 rounded-t-full border-t-[3px] border-slate-700/90"
                    : expression === "error"
                      ? "h-2.5 w-6 rounded-t-full border-t-[3px] border-slate-700"
                      : expression === "busy"
                        ? "h-2 w-5 rounded-full bg-slate-700/85"
                        : "h-2.5 w-5 rounded-b-full border-b-[3px] border-slate-700/90"
            }`}
          />
        </AnimatePresence>
        <motion.span
          className="absolute -right-[28px] h-2.5 w-4 rounded-full bg-rose-300/80 blur-[0.2px]"
          animate={{
            opacity: expression === "calm" || expression === "shy" ? 0.65 : 1,
            scaleX: expression === "error" ? 1.25 : 1,
          }}
          transition={smoothEase}
        />
      </motion.div>

      <AnimatePresence>
        {expression === "error" && (
          <motion.div
            key="error-spark"
            initial={{ opacity: 0, scale: 0.6, y: 3 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 260, damping: 16 }}
            className="pointer-events-none absolute -left-1 top-1 z-20 text-[11px] font-black text-rose-400"
          >
            !
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
