# Vireon Library

Vireon is a React and Vite library management app with a public catalog,
member borrowing flows, and librarian administration.

## Run & Operate

- `pnpm run dev` — run the Vite development server
- `pnpm run typecheck` — typecheck the application
- `pnpm run build` — build the production bundle
- `pnpm run serve` — preview the production bundle
- Supabase environment variables are documented in `.env.example`

## Stack

- Node.js 24, pnpm, TypeScript 5.9
- React + Vite
- Supabase for authentication, database access, and storage
- Tailwind CSS and Radix UI

## Where things live

- `src/` contains the client application and its domain pages.
- `supabase/schema.sql` is the database schema reference.
- `supabase/migrations/` contains ordered database changes.
- `vercel.json` is the source of truth for Vercel's root build.

## Architecture decisions

- The repository is intentionally a single-root Vite app rather than a monorepo.
- Supabase remains the source of truth for library data and authentication.

## Product

- Public catalog and book detail views
- Member authentication, borrowing requests, favorites, and request status
- Admin dashboards for books, members, staff, racks, reports, and borrowing workflows

## User preferences

Keep the Vercel build rooted at `pnpm run build` with `dist/` as the output.

## Gotchas

- Run `pnpm run typecheck` and `pnpm run build` after configuration changes.

## Pointers

- See `README.md` for the root project workflow.
