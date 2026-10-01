export default function AnimatedBackground() {
  // Keep the global atmosphere still and quiet. The workspace should read as
  // paper and ink; cursor-reactive light belongs to brand moments, not daily
  // operations.
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
      <div className="absolute inset-y-0 left-[28%] w-px bg-emerald-950/[0.025] dark:bg-white/[0.025]" />
      <div className="absolute inset-y-0 right-[12%] w-px bg-emerald-950/[0.02] dark:bg-white/[0.02]" />
      <div className="absolute inset-x-0 top-[31%] h-px bg-emerald-950/[0.025] dark:bg-white/[0.025]" />
    </div>
  );
}
