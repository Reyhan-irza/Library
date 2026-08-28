import { useEffect } from "react";

export default function AnimatedBackground() {
  // Mouse-reactive glow — desktop (pointer: fine) only
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    const handler = (e: MouseEvent) => {
      document.documentElement.style.setProperty("--mx", `${(e.clientX / window.innerWidth) * 100}%`);
      document.documentElement.style.setProperty("--my", `${(e.clientY / window.innerHeight) * 100}%`);
    };

    window.addEventListener("mousemove", handler, { passive: true });
    return () => window.removeEventListener("mousemove", handler);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
      {/* Restrained editorial atmosphere: broad planes, not animated blobs. */}
      <div
        className="absolute -top-40 -left-32 w-[620px] h-[620px] rounded-full opacity-[0.08] dark:opacity-[0.05]"
        style={{ background: "radial-gradient(circle, hsl(163 45% 31% / 0.6) 0%, transparent 68%)" }}
      />
      <div
        className="absolute top-1/3 -right-40 w-[500px] h-[500px] rounded-full opacity-[0.06] dark:opacity-[0.04]"
        style={{ background: "radial-gradient(circle, hsl(188 41% 31% / 0.5) 0%, transparent 70%)" }}
      />
      <div
        className="absolute -bottom-32 left-1/3 w-[450px] h-[450px] rounded-full opacity-[0.04] dark:opacity-[0.03]"
        style={{ background: "radial-gradient(circle, hsl(34 48% 55% / 0.45) 0%, transparent 70%)" }}
      />
      {/* Mouse-reactive glow (desktop only) */}
      <div className="mouse-glow hidden md:block" />
    </div>
  );
}
