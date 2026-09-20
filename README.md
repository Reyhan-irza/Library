# Vireon Library

Vireon is a modern library management application for public catalog browsing,
member accounts, borrowing requests, and librarian administration.

## Quick start

```bash
pnpm install
pnpm run dev
```

The production build can be checked with:

```bash
pnpm run typecheck
pnpm run build
```

## Project structure

- `src/` — React application, pages, components, hooks, and Supabase client code
- `public/` — static branding, Open Graph assets, and robots.txt
- `supabase/` — database schema and migrations
- `tests/` — focused application tests
- `vercel.json` — Vercel build and SPA rewrite configuration

The app is a single-root Vite project. Vercel runs `pnpm run build` and serves
the generated `dist/` directory.
