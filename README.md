# Offline Tools

A suite of browser-based utilities that run entirely offline. Once the page loads, no internet connection is required — all processing happens locally in your browser.

Built with **Preact** and **Vite**, deployed as a static single-page app to GitHub Pages.

## Tools

- **QR Code Generator** — Create downloadable QR codes (PNG) for plain text, URLs, and vCard contact cards. Powered by `qr-code-styling`.
- **Data Explorer** — Validate, format, convert, and query JSON, YAML, and XML. Input format is auto-detected. Convert any format to JSON and run jq-style path queries (e.g. `.users[].name`).
- **Brown Noise Generator** — Continuous brown noise for focus and sleep using the Web Audio API. Adjustable volume, tone, and pitch, plus an optional screen wake lock.

## Getting Started

```bash
npm install
npm run dev      # start dev server at localhost:5173
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm test` | Run the test suite once |
| `npm run test:watch` | Run tests in watch mode |

## Tech Stack

- **Preact** — UI framework
- **Vite 8** — build tooling with `@preact/preset-vite`
- **preact-router** — client-side routing
- **Open Props** — CSS custom property design tokens
- **Vitest** + **jsdom** + **@testing-library/preact** — testing

## Architecture

```
src/
├── index.jsx              # Entry point, mounts App
├── app.jsx                # Router with lazy-loaded tool pages
├── components/layout/     # Header, Loading, ToolPage wrapper
├── hooks/                 # useWasmTool, useBrownNoise, useWakeLock
├── pages/                 # Home, QrCode, DataTool, BrownNoise
├── tools/                 # Tool logic (data, qr, brown-noise)
├── utils/                 # Route helpers
└── styles/                # Global styles + Open Props imports
```

### Code Splitting

Each tool page is lazy-loaded via dynamic `import()`, so the code for a tool is only fetched when the user navigates to it.

### Data Explorer

The Data Explorer detects the input format automatically and supports:

- **Format** — pretty-print JSON, YAML, or XML
- **Convert to JSON** — normalize any supported format to JSON
- **Query** — jq-style path expressions (`.field`, `[index]`, `[]` for iteration)

## Deployment

The app is configured for GitHub Pages. The build generates a `404.html` fallback (copied from `index.html`) so client-side routing works on refresh. The base path is auto-detected from the repository name when building in GitHub Actions, or can be set via `GH_PAGES_BASE`.

```bash
npm run build
```

Output is in `dist/`. Deploy the contents as static files.

## Testing

Tests live in `tests/` and cover unit tests for components, hooks, pages, and tool logic.

```bash
npm test
```

## License

Private project.
