/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import fs from 'node:fs';

// Niveau des fonctions natives attendu par cette interface (voir native-api.txt).
const NATIVE_API = fs.readFileSync(path.resolve(__dirname, 'native-api.txt'), 'utf8').trim();

export default defineConfig({
  plugins: [react()],
  define: { 'import.meta.env.VITE_NATIVE_API': JSON.stringify(NATIVE_API) },
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          motion: ['framer-motion'],
        },
      },
    },
  },
  test: { environment: 'jsdom', setupFiles: ['src/test/setup.ts'] },
});
