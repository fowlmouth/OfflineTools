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

function getBase() {
  if (process.env.GH_PAGES_BASE) return process.env.GH_PAGES_BASE;
  if (process.env.GITHUB_ACTIONS === 'true' && process.env.GITHUB_REPOSITORY) {
    const repo = process.env.GITHUB_REPOSITORY.split('/').pop();
    if (!repo.endsWith('.github.io')) {
      return `/${repo}/`;
    }
  }
  return '/';
}

export default defineConfig({
  base: getBase(),
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
