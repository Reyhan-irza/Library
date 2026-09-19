# Vireon / perpus-pintar (workspace)

This repository is a pnpm workspace containing multiple packages. The primary application in this repository is:

  artifacts/perpus-pintar

Quick start

- Development (local):

  pnpm --filter @workspace/perpus-pintar run dev

- Build (production test):

  pnpm --filter @workspace/perpus-pintar run build

Notes

- The project uses pnpm workspaces (see pnpm-workspace.yaml and the root package.json).
- The perpus-pintar app is built with Vite (see artifacts/perpus-pintar/vite.config.ts).
- Vercel deployment is configured at the repository root and builds the perpus-pintar package; the root `vercel.json` points to `artifacts/perpus-pintar/dist` as the output directory.

Repository structure (important):

- artifacts/perpus-pintar — Primary Vite application (do not move or rename).
- artifacts/api-server — Secondary workspace package (API server).
- lib/ and scripts/ — workspace libraries and helper packages.

Maintainer notes

- Do not change workspace structure, package names, pnpm configuration, or vercel.json unless you understand how the monorepo build and deployment are affected.
- Replit-specific metadata may exist under `artifacts/*/.replit-artifact`; these files are only used by Replit and are not required for pnpm, Vercel, or the Vite build.

For more information about developing and building the workspace, see pnpm-workspace.yaml and the package.json files inside each package.
