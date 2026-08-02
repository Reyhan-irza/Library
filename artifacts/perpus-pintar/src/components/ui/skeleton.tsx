import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("shimmer rounded-lg", className)} />;
}

/** A single list-row placeholder (members, staff, borrowings). */
export function SkeletonRow({ className }: { className?: string }) {
  return (
    <div className={cn("glass rounded-2xl p-4 shadow-card flex items-center gap-4", className)}>
      <div className="w-10 h-10 rounded-2xl shimmer flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 shimmer rounded-md w-2/3" />
        <div className="h-2.5 shimmer rounded-md w-1/2 opacity-70" />
      </div>
    </div>
  );
}

/** A book-card placeholder for grid layouts (books, favorites). */
export function SkeletonBookCard() {
  return (
    <div className="glass rounded-2xl overflow-hidden shadow-card">
      <div className="aspect-[3/4] shimmer" />
      <div className="p-2.5 space-y-1.5">
        <div className="h-3 shimmer rounded-md w-4/5" />
        <div className="h-2.5 shimmer rounded-md w-3/5 opacity-70" />
      </div>
    </div>
  );
}

/** A stat-card placeholder for dashboard. */
export function SkeletonStatCard() {
  return (
    <div className="glass rounded-3xl p-5 shadow-card">
      <div className="w-10 h-10 rounded-2xl shimmer mb-3" />
      <div className="h-7 shimmer rounded-md w-16 mb-1.5" />
      <div className="h-2.5 shimmer rounded-md w-24 opacity-70" />
    </div>
  );
}

/** A card placeholder for categories/racks grids. */
export function SkeletonCard() {
  return (
    <div className="glass rounded-2xl p-4 shadow-card">
      <div className="w-10 h-10 rounded-2xl shimmer mb-3" />
      <div className="space-y-2">
        <div className="h-3.5 shimmer rounded-md w-3/4" />
        <div className="h-2.5 shimmer rounded-md w-1/2 opacity-70" />
        <div className="h-2.5 shimmer rounded-md w-1/3 opacity-60 mt-2" />
      </div>
    </div>
  );
}
