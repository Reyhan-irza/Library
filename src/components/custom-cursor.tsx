/**
 * CustomCursor — Premium two-layer cursor for the VIREON landing page.
 *
 * Layer 1 · Dot   — exact mouse position tracker (brand emerald, ~7 px)
 * Layer 2 · Ring  — spring-lagged follower that morphs by interaction context
 * Layer 3 · Ripple— brief expanding ring on every click
 *
 * Context states
 *  default  → restrained 36 px ring outline
 *  hover    → 58 px ring, emerald tint (over links / buttons)
 *  click    → ring contracts; ripple expands and fades
 *
 * Only activates on fine-pointer (mouse/trackpad) devices.
 * Fully disabled when prefers-reduced-motion is set.
 */

import { useEffect, useState, useCallback, useRef } from "react";
import { motion, useMotionValue, useSpring, useReducedMotion, AnimatePresence } from "framer-motion";

// ─── Types ─────────────────────────────────────────────────────────────────────

type CursorState = "default" | "hover" | "click";

interface Ripple {
  id: number;
  x: number;
  y: number;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const EM    = "hsl(161 52% 40%)";       // brand emerald — ring border + dot
const EM_BG = "hsl(161 52% 44% / 0.12)";

// Spring for the ring: feels smooth, slightly sluggish, clearly separate from dot
const RING_SPRING = { stiffness: 140, damping: 17, mass: 0.65 } as const;

// ─── Hook: pointer device detection ───────────────────────────────────────────

function useIsPointerDevice() {
  const [ok, setOk] = useState(false);
  useEffect(() => {
    setOk(window.matchMedia("(hover: hover) and (pointer: fine)").matches);
  }, []);
  return ok;
}

// ─── Main component ───────────────────────────────────────────────────────────

export function CustomCursor() {
  const reduced   = useReducedMotion();
  const isPointer = useIsPointerDevice();

  const [visible, setVisible] = useState(false);
  const [state,   setState]   = useState<CursorState>("default");
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const rippleId = useRef(0);

  // ── Raw mouse position (dot follows this exactly) ──────────────────────────
  const mx = useMotionValue(-400);
  const my = useMotionValue(-400);

  // ── Smoothed position (ring follows with lag) ──────────────────────────────
  const rx = useSpring(mx, RING_SPRING);
  const ry = useSpring(my, RING_SPRING);

  // ── Context detection ──────────────────────────────────────────────────────
  const onMove = useCallback(
    (e: MouseEvent) => {
      mx.set(e.clientX);
      my.set(e.clientY);
      setVisible(true);

      const el = e.target as Element | null;
      if (!el) return;

      if (
        el.closest(
          'a, button, [role="button"], label, select, input[type="checkbox"], input[type="radio"], [tabindex]:not([tabindex="-1"])'
        )
      ) {
        setState("hover");
      } else {
        setState("default");
      }
    },
    [mx, my]
  );

  const onLeave = useCallback(() => setVisible(false), []);
  const onEnter = useCallback(() => setVisible(true), []);

  const onDown = useCallback((e: MouseEvent) => {
    setState("click");
    // Spawn a ripple at click position
    const id = ++rippleId.current;
    setRipples((prev) => [...prev.slice(-4), { id, x: e.clientX, y: e.clientY }]);
  }, []);

  const onUp = useCallback(() => setState("default"), []);

  useEffect(() => {
    if (!isPointer || reduced) return;
    window.addEventListener("mousemove",   onMove,  { passive: true });
    window.addEventListener("mousedown",   onDown);
    window.addEventListener("mouseup",     onUp);
    document.addEventListener("mouseleave", onLeave);
    document.addEventListener("mouseenter", onEnter);
    return () => {
      window.removeEventListener("mousemove",   onMove);
      window.removeEventListener("mousedown",   onDown);
      window.removeEventListener("mouseup",     onUp);
      document.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("mouseenter", onEnter);
    };
  }, [isPointer, reduced, onMove, onDown, onUp, onLeave, onEnter]);

  if (!isPointer || reduced) return null;

  // ── Shape targets per state ────────────────────────────────────────────────
  const ringTarget = {
    default: { width: 36, height: 36, borderRadius: 18, opacity: visible ? 0.80 : 0, background: "rgba(0,0,0,0)" },
    hover:   { width: 58, height: 58, borderRadius: 29, opacity: visible ? 1    : 0, background: EM_BG },
    click:   { width: 22, height: 22, borderRadius: 11, opacity: visible ? 1    : 0, background: EM_BG },
  }[state];

  const dotTarget = {
    default: { width: 7,  height: 7,  borderRadius: 4, opacity: visible ? 1    : 0 },
    hover:   { width: 4,  height: 4,  borderRadius: 2, opacity: visible ? 0.55 : 0 },
    click:   { width: 11, height: 11, borderRadius: 6, opacity: visible ? 1    : 0 },
  }[state];

  return (
    <>
      {/* ── Click ripples ───────────────────────────────────────────────────── */}
      <AnimatePresence>
        {ripples.map(({ id, x, y }) => (
          <motion.div
            key={id}
            className="fixed pointer-events-none select-none z-[9996] rounded-full"
            style={{
              top: y,
              left: x,
              translateX: "-50%",
              translateY: "-50%",
              border: `1px solid ${EM}`,
            }}
            initial={{ width: 4, height: 4, opacity: 0.75 }}
            animate={{ width: 88, height: 88, opacity: 0 }}
            exit={{}}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            onAnimationComplete={() =>
              setRipples((prev) => prev.filter((r) => r.id !== id))
            }
          />
        ))}
      </AnimatePresence>

      {/* ── Ring (spring lag — separate from dot) ─────────────────────────── */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none select-none z-[9998]"
        style={{
          x: rx,
          y: ry,
          translateX: "-50%",
          translateY: "-50%",
          border: `1px solid ${EM}`,
          boxShadow: `0 4px 18px hsl(161 52% 30% / 0.14)`,
        }}
        animate={ringTarget}
        transition={{ type: "spring", stiffness: 280, damping: 24 }}
      />

      {/* ── Dot (follows exactly, snappy spring for instant feel) ─────────── */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none select-none z-[9999]"
        style={{
          x: mx,
          y: my,
          translateX: "-50%",
          translateY: "-50%",
          background: EM,
        }}
        animate={dotTarget}
        transition={{ type: "spring", stiffness: 580, damping: 30 }}
      />
    </>
  );
}
