import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

function ghPagesFallback() {
  return {
    name: 'gh-pages-404-fallback',
    apply: 'build',
    closeBundle() {
      const indexHtml = resolve('dist', 'index.html');
      if (existsSync(indexHtml)) {
        writeFileSync(resolve('dist', '404.html'), readFileSync(indexHtml));
      }
    },
  };
}

export default defineConfig({
  base: process.env.GH_PAGES_BASE || '/',
  plugins: [preact(), ghPagesFallback()],
  optimizeDeps: {
    exclude: ['./src/tools/**/wasm/**'],
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './tests/setup.js',
  },
});
