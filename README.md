# Vireon Library

Sistem informasi manajemen perpustakaan untuk koleksi buku, anggota,
peminjaman, favorit, laporan, dan aktivitas harian.

## Stack

- React + TypeScript + Vite
- Tailwind CSS
- Supabase Auth dan PostgreSQL
- TanStack Query
- Vercel untuk hosting aplikasi web

## Menjalankan secara lokal

```bash
pnpm install
cp .env.example .env.local
# isi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY
pnpm dev
```

Jalankan `supabase/schema.sql` di SQL Editor project Supabase sebelum
menggunakan fitur data dan autentikasi.

## Build production

```bash
pnpm build
```

Hasil build berada di folder `dist/`.

## Deploy ke Vercel

1. Import repository ini ke Vercel.
2. Biarkan Framework Preset menggunakan Vite atau pilih `Other`.
3. Set Build Command ke `pnpm build`.
4. Set Output Directory ke `dist`.
5. Tambahkan environment variables berikut untuk environment Production:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
6. Deploy.

`vercel.json` sudah menangani fallback route untuk aplikasi SPA tanpa
mengganggu file asset di folder `assets/`.