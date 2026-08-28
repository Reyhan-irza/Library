import path from 'path';
import { fileURLToPath } from 'url';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

// Compatible with Node 18+ (import.meta.dirname requires Node 20.11+)
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const isReplit = process.env.REPL_ID !== undefined;
const isProduction = process.env.NODE_ENV === 'production';

// PORT hanya dibutuhkan saat dev di Replit — Vercel tidak memerlukannya
const rawPort = process.env.PORT;
const port = rawPort ? Number(rawPort) : 5173;

// BASE_PATH can be supplied by a host that mounts this app below a prefix.
const basePath = process.env.BASE_PATH ?? '/';

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),
    // Plugin Replit: hanya di dev environment Replit
    ...(!isProduction && isReplit
      ? [
          (await import('@replit/vite-plugin-runtime-error-modal')).default(),
          await import('@replit/vite-plugin-cartographer').then((m) =>
            m.cartographer({
              root: __dirname,
            }),
          ),
          await import('@replit/vite-plugin-dev-banner').then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
    dedupe: ['react', 'react-dom'],
  },
  root: path.resolve(__dirname),
  build: {
    outDir: path.resolve(__dirname, 'dist'),
    emptyOutDir: true,
  },
  server: {
    port,
    strictPort: true,
    host: '0.0.0.0',
    allowedHosts: true,
    fs: {
      strict: true,
    },
  },
  preview: {
    port,
    host: '0.0.0.0',
    allowedHosts: true,
  },
});
