import { motion } from "framer-motion";
import {
  BookOpen, Users, ArrowLeftRight, CheckCircle2,
  AlertTriangle, TrendingUp, Clock, Activity,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  useGetDashboardStats,
  useGetDashboardChart,
  useGetRecentActivities,
  useGetTopBooks,
} from "@/hooks/api";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const item = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 280, damping: 26 } } };

function StatCard({ icon: Icon, label, value, sub, colorClass, glowClass }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string;
  colorClass: string; glowClass: string;
}) {
  return (
    <motion.div variants={item} className={cn("glass rounded-3xl p-5 shadow-card transition-all duration-300", glowClass)}>
      <div className="flex items-start justify-between mb-3">
        <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center", colorClass)}>
          <Icon size={18} className="text-current" />
        </div>
      </div>
      <p className="text-2xl font-extrabold text-foreground" style={{ fontFamily: "'Outfit', sans-serif" }}>{value}</p>
      <p className="text-xs font-medium text-muted-foreground mt-0.5">{label}</p>
      {sub && <p className="text-[10px] text-muted-foreground/70 mt-1">{sub}</p>}
    </motion.div>
  );
}

export default function DashboardPage() {
  const { data: stats } = useGetDashboardStats();
  const { data: chart } = useGetDashboardChart();
  const { data: activities } = useGetRecentActivities();
  const { data: topBooks } = useGetTopBooks();

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-extrabold gradient-text" style={{ fontFamily: "'Sora', sans-serif" }}>
          Dashboard
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">Ringkasan aktivitas perpustakaan</p>
      </motion.div>

      {/* Stats */}
      <motion.div variants={container} initial="hidden" animate="show"
        className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <StatCard icon={BookOpen} label="Total Buku" value={stats?.totalBooks ?? 0}
          colorClass="bg-primary/12 text-primary" glowClass="card-glow-green" />
        <StatCard icon={Users} label="Anggota" value={stats?.totalMembers ?? 0}
          colorClass="bg-blue-500/12 text-blue-600 dark:text-blue-400" glowClass="card-glow-blue" />
        <StatCard icon={ArrowLeftRight} label="Dipinjam" value={stats?.totalBorrowed ?? 0}
          colorClass="bg-amber-500/12 text-amber-600 dark:text-amber-400" glowClass="card-glow-amber" />
        <StatCard icon={CheckCircle2} label="Tersedia" value={stats?.totalAvailable ?? 0}
          colorClass="bg-emerald-500/12 text-emerald-600 dark:text-emerald-400" glowClass="card-glow-emerald" />
        <StatCard icon={AlertTriangle} label="Terlambat" value={stats?.overdueCount ?? 0}
          colorClass="bg-rose-500/12 text-rose-600 dark:text-rose-400" glowClass="card-glow-rose" />
        <StatCard icon={TrendingUp} label="Total Denda" value={formatCurrency(stats?.totalFine ?? 0)}
          colorClass="bg-violet-500/12 text-violet-600 dark:text-violet-400" glowClass="" />
      </motion.div>

      {/* Chart + Top Books */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="lg:col-span-2 glass rounded-3xl p-5 shadow-card"
        >
          <h2 className="text-sm font-bold text-foreground mb-4" style={{ fontFamily: "'Outfit', sans-serif" }}>
            Tren Peminjaman (6 Bulan)
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chart ?? []} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gb" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(161 50% 35%)" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="hsl(161 50% 35%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gr" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(175 84% 30%)" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="hsl(175 84% 30%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }}
                labelStyle={{ fontWeight: 600, color: "hsl(var(--foreground))" }}
              />
              <Area type="monotone" dataKey="borrowed" name="Dipinjam" stroke="hsl(161 50% 35%)" fill="url(#gb)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="returned" name="Dikembalikan" stroke="hsl(175 84% 30%)" fill="url(#gr)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="glass rounded-3xl p-5 shadow-card"
        >
          <h2 className="text-sm font-bold text-foreground mb-4" style={{ fontFamily: "'Outfit', sans-serif" }}>
            Buku Terpopuler
          </h2>
          <div className="space-y-3">
            {(topBooks ?? []).map((book, i) => (
              <div key={book.id} className="flex items-center gap-3">
                <span className="text-xs font-black text-muted-foreground/40 w-5 text-right">{i + 1}</span>
                <div className="w-8 h-11 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                  {book.coverUrl
                    ? <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
                    : <div className="w-full h-full bg-primary/10 flex items-center justify-center"><BookOpen size={12} className="text-primary/40" /></div>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">{book.title}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{book.author}</p>
                </div>
                <span className="text-xs font-bold text-primary">{book.borrowCount}x</span>
              </div>
            ))}
            {!topBooks?.length && <p className="text-xs text-muted-foreground text-center py-4">Belum ada data</p>}
          </div>
        </motion.div>
      </div>

      {/* Recent Activities */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="glass rounded-3xl p-5 shadow-card"
      >
        <div className="flex items-center gap-2 mb-4">
          <Activity size={15} className="text-primary" />
          <h2 className="text-sm font-bold text-foreground" style={{ fontFamily: "'Outfit', sans-serif" }}>Aktivitas Terkini</h2>
        </div>
        <div className="space-y-3">
          {(activities ?? []).map(a => (
            <div key={a.id} className="flex items-start gap-3 py-2 border-b border-border/40 last:border-0">
              <div className="w-7 h-7 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Clock size={12} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-foreground">{a.description}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{formatDateTime(a.createdAt)}</p>
              </div>
            </div>
          ))}
          {!activities?.length && <p className="text-xs text-muted-foreground text-center py-4">Belum ada aktivitas</p>}
        </div>
      </motion.div>
    </div>
  );
}
