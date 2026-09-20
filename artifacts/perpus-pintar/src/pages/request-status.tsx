import { useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, CheckCircle2, Clock3, Loader2, Search, ShieldCheck, XCircle } from "lucide-react";
import { toast } from "sonner";
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
  return (
    <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_16px_44px_-28px_rgba(15,23,42,0.38)] sm:p-7">
      <div className="flex items-start gap-3">
        {rejected ? <XCircle className="mt-0.5 h-5 w-5 text-rose-600" /> : <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" />}
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Status request</p>
          <p className="mt-1 font-mono text-lg font-extrabold tracking-wider text-slate-900">{result.requestCode}</p>
        </div>
      </div>
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