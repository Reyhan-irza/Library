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
      {/* Aurora blobs */}
      <div
        className="aurora-1 absolute -top-40 -left-32 w-[600px] h-[600px] rounded-full opacity-[0.07] dark:opacity-[0.05]"
        style={{ background: "radial-gradient(circle, hsl(161 50% 40%) 0%, transparent 70%)" }}
      />
      <div
        className="aurora-2 absolute top-1/3 -right-40 w-[500px] h-[500px] rounded-full opacity-[0.06] dark:opacity-[0.04]"
        style={{ background: "radial-gradient(circle, hsl(199 89% 48%) 0%, transparent 70%)" }}
      />
      <div
        className="aurora-3 absolute -bottom-32 left-1/3 w-[450px] h-[450px] rounded-full opacity-[0.05] dark:opacity-[0.04]"
        style={{ background: "radial-gradient(circle, hsl(270 60% 60%) 0%, transparent 70%)" }}
      />
      <div
        className="aurora-1 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full opacity-[0.03] dark:opacity-[0.025]"
        style={{ background: "radial-gradient(circle, hsl(175 84% 35%) 0%, transparent 60%)", animationDelay: "-10s" }}
      />
      {/* Extra depth */}
      <div
        className="aurora-2 absolute bottom-1/4 -left-20 w-[400px] h-[400px] rounded-full opacity-[0.04] dark:opacity-[0.03]"
        style={{ background: "radial-gradient(circle, hsl(38 90% 55%) 0%, transparent 70%)", animationDelay: "-5s" }}
      />
      {/* Mouse-reactive glow (desktop only) */}
      <div className="mouse-glow hidden md:block" />
    </div>
  );
}
