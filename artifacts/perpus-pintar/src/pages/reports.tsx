import { useState } from "react";
import { motion } from "framer-motion";
import { BarChart3, TrendingUp, Users, BookOpen, AlertTriangle, DollarSign } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { useGetReportSummary, useGetDashboardChart } from "@/hooks/api";
import { formatCurrency } from "@/lib/format";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { cn } from "@/lib/utils";

function StatCard({ icon: Icon, label, value, className }: { icon: React.ElementType; label: string; value: string | number; className?: string }) {
  return (
    <div className={cn("glass rounded-2xl p-4 shadow-card", className)}>
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
          <Icon size={16} className="text-primary" />
        </div>
        <div>
          <p className="text-xl font-extrabold text-foreground" style={{ fontFamily: "'Outfit', sans-serif" }}>{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const [period, setPeriod] = useState<"thisMonth" | "lastMonth" | "all">("thisMonth");

  const params = (() => {
    if (period === "all") return {};
    const now = new Date();
    const target = period === "thisMonth" ? now : subMonths(now, 1);
    return {
      start: format(startOfMonth(target), "yyyy-MM-dd"),
      end: format(endOfMonth(target), "yyyy-MM-dd"),
    };
  })();

  const { data: summary } = useGetReportSummary(params);
  const { data: chart } = useGetDashboardChart();

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold gradient-text font-heading">Laporan</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Statistik dan ringkasan Vireon Library</p>
        </div>
        <div className="flex gap-1 p-1 bg-muted rounded-xl">
          {([["thisMonth", "Bulan Ini"], ["lastMonth", "Bulan Lalu"], ["all", "Semua"]] as const).map(([val, label]) => (
            <button key={val} onClick={() => setPeriod(val)}
              className={cn("px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                period === val ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
              {label}
            </button>
          ))}
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatCard icon={BookOpen} label="Total Koleksi" value={summary?.totalBooks ?? 0} />
        <StatCard icon={Users} label="Total Anggota" value={summary?.totalMembers ?? 0} />
        <StatCard icon={TrendingUp} label="Total Peminjaman" value={summary?.totalBorrowings ?? 0} />
        <StatCard icon={BarChart3} label="Dikembalikan" value={summary?.totalReturned ?? 0} />
        <StatCard icon={AlertTriangle} label="Terlambat" value={summary?.totalOverdue ?? 0} />
        <StatCard icon={DollarSign} label="Total Denda" value={formatCurrency(summary?.totalFine ?? 0)} />
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="glass rounded-3xl p-5 shadow-card">
        <h2 className="text-sm font-bold text-foreground mb-4" style={{ fontFamily: "'Outfit', sans-serif" }}>
          Grafik Peminjaman vs Pengembalian
        </h2>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={chart ?? []} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }}
              labelStyle={{ fontWeight: 600, color: "hsl(var(--foreground))" }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="borrowed" name="Dipinjam" fill="hsl(161 50% 35%)" radius={[6, 6, 0, 0]} />
            <Bar dataKey="returned" name="Dikembalikan" fill="hsl(175 84% 30%)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
}
