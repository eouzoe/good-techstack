import { fileURLToPath, URL } from 'node:url';

import babel from '@rolldown/plugin-babel';
import tailwindcss from '@tailwindcss/vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    assetsInlineLimit: 0,
    target: 'esnext',
  },
  envPrefix: ['PUBLIC_'],
  plugins: [
    tailwindcss(),
    tanstackStart({
      server: {
        entry: './src/entry-server.tsx',
      },
    }),
    react(),
    babel({
      presets: [reactCompilerPreset()],
    }),
  ],
  resolve: {
    alias: {
      '#shared': fileURLToPath(new URL('src/shared', import.meta.url)),
      '@': fileURLToPath(new URL('src', import.meta.url)),
    },
    dedupe: ['tslib', 'valibot', 'react', 'react-dom'],
  },
});
