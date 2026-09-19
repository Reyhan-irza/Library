/**
 * DashboardPreview — shared mini app mockup component.
 * Used on the Login page visual panel.
 * Accepts optional live stats; falls back to 0 while loading.
 */

import {
  BookOpen,
  Users,
  ArrowLeftRight,
  BarChart3,
  BookMarked,
  CheckCircle2,
  LayoutDashboard,
  Activity,
} from "lucide-react";

function fmt(n: number): string {
  return n.toLocaleString("id-ID");
}

export interface DashboardPreviewStats {
  totalBooks: number;
  totalMembers: number;
  totalBorrowings: number;
  availableBooks: number;
}

interface Props {
  stats?: DashboardPreviewStats;
  loading: boolean;
}

export default function DashboardPreview({ stats, loading }: Props) {
  const cards = [
    {
      label: "Total Buku",
      value: stats?.totalBooks,
      icon: BookMarked,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Anggota",
      value: stats?.totalMembers,
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Dipinjam",
      value: stats?.totalBorrowings,
      icon: ArrowLeftRight,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      label: "Tersedia",
      value: stats?.availableBooks,
      icon: CheckCircle2,
      color: "text-slate-500",
      bg: "bg-slate-50",
    },
  ] as const;

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", active: true },
    { icon: BookOpen, label: "Buku", active: false },
    { icon: ArrowLeftRight, label: "Peminjaman", active: false },
    { icon: Users, label: "Anggota", active: false },
    { icon: BarChart3, label: "Laporan", active: false },
  ] as const;

  const chartBars = [22, 38, 29, 52, 44, 60, 47];
  const maxBar = Math.max(...chartBars);

  return (
    <div
      className="w-full rounded-2xl overflow-hidden border border-white/10"
      style={{
        boxShadow:
          "0 0 0 1px rgba(255,255,255,0.06), 0 32px 80px -12px rgba(0,0,0,0.55), 0 8px 32px -8px rgba(0,0,0,0.32)",
      }}
    >
      {/* Browser chrome */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#f5f5f7] border-b border-slate-200/80">
        <div className="flex items-center gap-1.5" aria-hidden="true">
          <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
          <div className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
          <div className="w-3 h-3 rounded-full bg-[#28C840]" />
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-white rounded-md border border-slate-200/60 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
          <div className="w-1.5 h-1.5 rounded-full bg-slate-300" aria-hidden="true" />
          <span className="text-[11px] text-slate-400 font-mono">app.vireon.id/dashboard</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600">
          <Activity className="w-3 h-3" aria-hidden="true" />
          Admin
        </div>
      </div>

      {/* App layout */}
      <div className="flex" style={{ background: "#fafafa" }}>
        {/* Sidebar */}
        <div className="w-[108px] shrink-0 border-r border-slate-200/60 bg-white flex flex-col py-3">
          {/* Brand mark */}
          <div className="flex items-center gap-1.5 px-3 mb-3">
            <div
              className="w-5 h-5 rounded-[5px] flex items-center justify-center shrink-0"
              style={{ background: "hsl(161 52% 26%)" }}
            >
              <BookOpen className="w-2.5 h-2.5 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-[10px] font-extrabold tracking-[0.06em] text-slate-900">
              VIREON
            </span>
          </div>

          {/* Nav items */}
          <div className="flex flex-col gap-0.5 px-1.5">
            {navItems.map(({ icon: Icon, label, active }) => (
              <div
                key={label}
                className={`flex items-center gap-1.5 px-2 py-1.5 rounded-[6px] ${
                  active
                    ? "bg-[hsl(161_52%_26%/0.10)] text-[hsl(161_52%_26%)]"
                    : "text-slate-400"
                }`}
              >
                <Icon
                  className="w-2.5 h-2.5 shrink-0"
                  strokeWidth={active ? 2.25 : 1.75}
                />
                <span className="text-[9px] font-medium leading-none">{label}</span>
              </div>
            ))}
          </div>

          {/* Profile */}
          <div className="mt-auto px-2.5 pt-2 border-t border-slate-100 mx-2">
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shrink-0" />
              <div>
                <div className="text-[8px] font-semibold text-slate-700 leading-none">Admin</div>
                <div className="text-[7px] text-slate-400 mt-0.5 leading-none">Tim koleksi</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0 p-3.5">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[12px] font-bold text-slate-900 leading-tight">Dashboard</p>
              <p className="text-[9.5px] text-slate-400 mt-0.5">
                Ruang koleksi Vireon
              </p>
            </div>
            <div
              className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold"
              style={{
                background: "hsl(161 52% 26% / 0.08)",
                border: "1px solid hsl(161 52% 26% / 0.2)",
                color: "hsl(161 52% 26%)",
              }}
            >
              <div className="w-1 h-1 rounded-full bg-current animate-pulse" />
              Live
            </div>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-4 gap-2 mb-3">
            {cards.map(({ label, value, icon: Icon, color, bg }) => (
              <div
                key={label}
                className="bg-white rounded-lg border border-slate-100 p-2 shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
              >
                <div
                  className={`w-5 h-5 rounded-[5px] ${bg} flex items-center justify-center mb-1.5`}
                >
                  <Icon className={`w-2.5 h-2.5 ${color}`} strokeWidth={2} />
                </div>
                {loading ? (
                  <div className="h-3.5 w-8 bg-slate-200 rounded animate-pulse mb-0.5" />
                ) : (
                  <p className="text-[13px] font-extrabold text-slate-900 tabular-nums leading-none">
                    {fmt(value ?? 0)}
                  </p>
                )}
                <p className="text-[8px] text-slate-400 font-medium mt-0.5 leading-tight">
                  {label}
                </p>
              </div>
            ))}
          </div>

          {/* Mini chart */}
          <div className="bg-white rounded-lg border border-slate-100 p-2.5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[9.5px] font-semibold text-slate-700">Tren Peminjaman</p>
              <span className="text-[8px] text-slate-400">7 bulan terakhir</span>
            </div>
            <div className="flex items-end gap-1 h-9">
              {chartBars.map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-sm"
                  style={{
                    height: `${(h / maxBar) * 100}%`,
                    background:
                      i === chartBars.length - 1
                        ? "hsl(161 52% 30%)"
                        : "hsl(161 52% 30% / 0.25)",
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
