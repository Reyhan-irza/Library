import { useState } from "react";
import { Link } from "wouter";
import {
  ArrowLeft,
  BookOpen,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Copy,
  Loader2,
  RotateCcw,
  Search,
  Send,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useLookupPublicRequestStatus } from "@/hooks/api";
import type { PublicRequestStatus } from "@/types";

const statusLabels: Record<PublicRequestStatus["status"], string> = {
  pending: "Menunggu Persetujuan",
  approved: "Disetujui",
  borrowed: "Sedang Dipinjam",
  returned: "Sudah Dikembalikan",
  rejected: "Ditolak",
  overdue: "Terlambat",
  cancelled: "Dibatalkan",
};

const progressSteps = [
  { key: "pending", label: "Request dikirim", description: "Data sudah diterima sistem.", icon: Send },
  { key: "approved", label: "Disetujui admin", description: "Request sedang diproses untuk peminjaman.", icon: ClipboardCheck },
  { key: "borrowed", label: "Buku dipinjam", description: "Buku sedang berada pada peminjam.", icon: BookOpen },
  { key: "returned", label: "Dikembalikan", description: "Peminjaman sudah selesai.", icon: RotateCcw },
] as const;

export default function RequestStatusPage() {
  const [requestCode, setRequestCode] = useState("");
  const [studentId, setStudentId] = useState("");
  const [result, setResult] = useState<PublicRequestStatus | null>(null);
  const lookup = useLookupPublicRequestStatus();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    lookup.mutate({ requestCode, studentId }, {
      onSuccess: setResult,
      onError: (error: any) => {
        setResult(null);
        toast.error(error?.message ?? "Request tidak ditemukan");
      },
    });
  }

  return (
    <main className="min-h-screen bg-[#fbfaf6] text-slate-900">
      <header className="border-b border-slate-200/70 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-3xl items-center px-4 sm:px-6">
          <Link href="/catalog" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-emerald-700">
            <ArrowLeft className="h-4 w-4" /> Kembali ke katalog
          </Link>
        </div>
      </header>
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-xl">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-700">Request status / 02</p>
          <h1 className="text-3xl font-extrabold tracking-[-0.03em] text-slate-950">Cek Status Peminjaman</h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-500">
            Masukkan kode request dan NIS/NISN yang digunakan saat mengajukan peminjaman.
            Data hanya akan ditampilkan jika keduanya cocok.
          </p>

          <form onSubmit={handleSubmit} className="mt-7 space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_16px_44px_-28px_rgba(15,23,42,0.38)] sm:p-7">
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Kode request</span>
              <input value={requestCode} onChange={(event) => setRequestCode(event.target.value.toUpperCase())} placeholder="VRN-2026-XXXXXXXX" required className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3 font-mono text-sm uppercase outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/10" />
            </label>
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">NIS/NISN</span>
              <input value={studentId} onChange={(event) => setStudentId(event.target.value)} placeholder="Masukkan NIS/NISN" required className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/10" />
            </label>
            <button type="submit" disabled={lookup.isPending} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 text-sm font-bold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60">
              {lookup.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Cek Status
            </button>
            <div className="flex items-start gap-2 text-xs leading-relaxed text-slate-400">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              Kode request dan NIS/NISN dipakai bersama agar status siswa lain tidak dapat ditebak.
            </div>
          </form>

          {result && <StatusResult result={result} />}
        </div>
      </div>
    </main>
  );
}

function StatusResult({ result }: { result: PublicRequestStatus }) {
  const rejected = result.status === "rejected" || result.status === "cancelled";
  const isOverdue = result.status === "overdue";
  const currentStepIndex = result.status === "returned"
    ? progressSteps.length - 1
    : result.status === "borrowed" || isOverdue
      ? 2
      : result.status === "approved"
        ? 1
        : 0;

  async function copyRequestCode() {
    try {
      await navigator.clipboard.writeText(result.requestCode);
      toast.success("Kode request berhasil disalin");
    } catch {
      toast.error("Kode tidak dapat disalin otomatis");
    }
  }

  return (
    <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_16px_44px_-28px_rgba(15,23,42,0.38)] sm:p-7">
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
          rejected ? "bg-rose-50 text-rose-600" : isOverdue ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-700"
        }`}>
          {rejected ? <XCircle className="h-5 w-5" /> : isOverdue ? <Clock3 className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Status request</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <p className="font-mono text-lg font-extrabold tracking-wider text-slate-900">{result.requestCode}</p>
            <button
              type="button"
              onClick={copyRequestCode}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-[10px] font-bold text-slate-500 transition hover:border-emerald-300 hover:text-emerald-700"
              aria-label={`Salin kode request ${result.requestCode}`}
            >
              <Copy className="h-3 w-3" /> Salin
            </button>
          </div>
        </div>
      </div>

      {rejected ? (
        <div className="mt-6 rounded-xl border border-rose-100 bg-rose-50/70 p-4">
          <p className="text-sm font-bold text-rose-900">{statusLabels[result.status]}</p>
          <p className="mt-1 text-xs leading-relaxed text-rose-700">
            Request ini sudah tidak melanjutkan proses peminjaman.
          </p>
        </div>
      ) : (
        <div className="mt-6 rounded-xl border border-emerald-900/[0.08] bg-emerald-50/45 p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-800/60">Progres peminjaman</p>
              <p className={`mt-1 text-sm font-bold ${isOverdue ? "text-amber-700" : "text-emerald-900"}`}>
                {statusLabels[result.status]}
              </p>
            </div>
            <span className="rounded-full bg-white/80 px-2.5 py-1 text-[10px] font-bold text-emerald-800 shadow-sm">
              {currentStepIndex + 1} / {progressSteps.length}
            </span>
          </div>
          <div className="space-y-0">
            {progressSteps.map((step, index) => {
              const Icon = step.icon;
              const complete = index < currentStepIndex || result.status === "returned";
              const active = index === currentStepIndex;
              return (
                <div key={step.key} className="relative flex gap-3 pb-4 last:pb-0">
                  {index < progressSteps.length - 1 && (
                    <span className={`absolute left-[15px] top-8 h-[calc(100%-8px)] w-px ${
                      complete ? "bg-emerald-500/60" : "bg-emerald-900/10"
                    }`} aria-hidden="true" />
                  )}
                  <motion.span
                    initial={false}
                    animate={{ scale: active ? 1.04 : 1 }}
                    className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border ${
                      complete || active
                        ? isOverdue && active
                          ? "border-amber-300 bg-amber-100 text-amber-700"
                          : "border-emerald-300 bg-emerald-100 text-emerald-700"
                        : "border-emerald-900/10 bg-white/70 text-slate-300"
                    }`}
                  >
                    {complete && !active ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  </motion.span>
                  <div className="pt-0.5">
                    <p className={`text-xs font-bold ${active ? (isOverdue ? "text-amber-800" : "text-emerald-900") : "text-slate-600"}`}>
                      {step.label}
                    </p>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">
                      {active && isOverdue ? "Tanggal pengembalian sudah terlewati." : step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <dl className="mt-6 grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2">
        <Detail label="Peminjam" value={result.requesterName} />
        <Detail label="Kelas" value={result.requesterClass} />
        <Detail label="Jenis" value={result.borrowingType === "PERSONAL" ? "Peminjaman Pribadi" : "Perwakilan Kelas"} />
        <Detail label="Buku" value={`${result.bookTitle} · ${result.quantity} eksemplar`} />
        <Detail label="Status" value={statusLabels[result.status]} />
        <Detail label="Diajukan" value={new Date(result.requestedAt).toLocaleString("id-ID")} />
        {result.dueDate && <Detail label="Jatuh tempo" value={new Date(result.dueDate).toLocaleDateString("id-ID")} />}
      </dl>
      {result.rejectionReason && (
        <div className="mt-5 flex items-start gap-2 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">
          <Clock3 className="mt-0.5 h-4 w-4 shrink-0" />
          Alasan: {result.rejectionReason}
        </div>
      )}
    </section>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</dt>
      <dd className="mt-1 text-sm font-semibold text-slate-700">{value}</dd>
    </div>
  );
}