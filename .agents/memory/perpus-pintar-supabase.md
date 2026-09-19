---
name: Perpus Pintar Supabase Migration
description: Status migrasi aplikasi perpustakaan ke Supabase — keputusan arsitektur dan langkah setup yang tersisa.
---

# Perpus Pintar – Status Migrasi

**Why:** Migrasi dari Express/JWT custom API ke Supabase Auth + PostgreSQL + RLS.

## Selesai
- Semua file ditulis di `artifacts/perpus-pintar/src/`
- `@supabase/supabase-js` terinstall
- VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY disimpan sebagai shared env vars
- App berjalan bersih (no Supabase warning di console)
- Supabase: `https://kptnxmdergqdbgjxgong.supabase.co`

## Tersisa untuk User
1. **Jalankan schema SQL** di Supabase Dashboard → SQL Editor → paste `supabase/schema.sql`
2. **Buat user pertama** via Supabase Dashboard → Authentication → Add User
3. **GitHub push** — user perlu connect GitHub account di Replit Settings dulu (NO_CREDENTIALS error)
4. **Nonaktifkan email confirmation** di Supabase → Auth → Email → "Confirm email" → OFF (agar staff creation bekerja)

## Keputusan Arsitektur
- Login pakai email (bukan username) karena Supabase Auth
- `borrow_book()` dan `return_book()` adalah PostgreSQL RPC SECURITY DEFINER (atomic stock update)
- `src/hooks/api.ts` = compatibility layer, same interface as lama
- `src/lib/auth.ts` cache user di localStorage, session token dikelola Supabase
