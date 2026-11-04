# Technology Stack

**Project:** Резюме под вакансию  
**Researched:** 2026-11-04

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| React | 19.3 | Interactive resume editor, vacancy matching view, saved variants | The product is a client-side application with editable structured data and immediate preview. React's current stable release is 19.3. A full server-rendering framework is not needed for the private editor flow. |
| TypeScript | 7.0.2 | Typed resume and vacancy domain model | Explicit types help keep the master resume, vacancy snapshot, and tailored variants consistent. TypeScript 7 is the current stable release; check React and tooling type compatibility when bootstrapping because this is a recent compiler generation. |
| Vite | 8.3.x (current supported line) | Development server and production build | Vite has an official React + TypeScript template and emits static assets. This app has no account or server requirement in its first release, so a client-only build is sufficient. |
| `@vitejs/plugin-react` | 6.2.1 | React Fast Refresh and JSX integration for Vite | This is the Vite organization's default React plugin and supports the chosen React setup. |

### Data and Persistence

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| IndexedDB | Browser API | Store the master resume, vacancy records, and tailored versions locally | Resume data is structured and should survive reloads. IndexedDB is asynchronous and stores structured objects. Browser storage is best-effort and may be evicted, so the interface should clearly explain local-only storage and offer a data export/backup path before relying on it as the only copy. |
| Dexie | 4.4.7 | Typed schema, migrations, and convenient IndexedDB queries | Dexie wraps the browser database API and makes versioned schema changes and record operations easier to express. It also supplies TypeScript declarations. |

Do not use `localStorage` as the canonical data store: it is synchronous string-only storage and has a 5 MiB per-origin limit. It is suitable for small UI preferences, not the main resume database.

### PDF Export

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `@react-pdf/renderer` | 4.9.0 | Generate and download a paginated A4 PDF in the browser | Its browser API provides a download link and custom font registration. Register static TTF/WOFF fonts with Cyrillic glyphs; built-in standard PDF fonts are not enough for Russian text. Load the renderer only for the export flow if its bundle weight affects normal editing. |

Use CSS print styles and the browser print dialog only if opening the print dialog is an acceptable export interaction. The product requirement is a downloadable PDF, and a PDF renderer gives the app a direct download action and control over page composition. Verify Cyrillic text, line wrapping, and page breaks in the resulting file.

### Runtime and Hosting

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Node.js | 24 LTS or newer supported LTS | Local tooling and build environment | Use an LTS line compatible with Vite's engine requirements; do not deploy an EOL runtime. |
| Static HTTPS hosting | Provider-neutral | Serve the client application | No backend is needed for the chosen unauthenticated, local-first v1. HTTPS gives a secure context for browser capabilities and consistent behavior. Configure SPA fallback only if client-side routes are introduced. |

### Supporting Practices

- Keep the master resume and each vacancy-specific variant as separate records with stable IDs. A variant should retain its own editable content and the vacancy text or a useful vacancy summary, so later changes to the master do not silently rewrite an application already prepared.
- Treat resume content as private personal data. In v1, keep matching in the browser and avoid sending resume or vacancy text to analytics or a server.
- Add an explicit JSON export/import path for recovery and migration planning. IndexedDB data can be removed by browser actions, storage pressure, private-session cleanup, or origin changes.
- Keep the matching engine deterministic and local: normalize whitespace and case, compare a curated skill/keyword vocabulary, and report which terms matched or were not found. Do not describe absence of a word as proof the person lacks a skill.

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| App framework | React + Vite SPA | Next.js | No account, server-rendered content, or server API is in the confirmed first-release scope. A server framework adds deployment and architecture decisions without enabling the core editor scenario. Revisit if public SEO pages, sync, or server-side features become product requirements. |
| Browser persistence | IndexedDB with Dexie | `localStorage` | `localStorage` is synchronous, string-only, and small; it is less suitable for a growing set of structured resumes and variants. |
| PDF creation | `@react-pdf/renderer` | Browser print-to-PDF | Browser printing is a viable lower-complexity route, but it hands the final save step to the browser dialog and offers less deterministic pagination. Prefer it only if users accept that interaction. |
| Database/server | No server database in v1 | Cloud database and user accounts | Accounts and cross-device sync were explicitly deferred. Keeping v1 local avoids transmitting sensitive resume data before that need is established. |

## Installation

```bash
# Runtime
npm install react react-dom dexie @react-pdf/renderer

# Development
npm install -D vite typescript @vitejs/plugin-react @types/react @types/react-dom
```

Use the `react-ts` Vite template as the initial scaffold. Resolve current mutually compatible package versions at bootstrap and commit the lockfile; the versions above are the stable versions/lines checked during research, not an instruction to keep them frozen indefinitely.

## Sources

- [React versions](https://react.dev/versions) — React 19.3 is the latest stable version.
- [React blog](https://react.dev/blog) — the React team recommends a framework or a build tool such as Vite instead of Create React App for new apps.
- [Vite releases](https://vite.dev/releases) and [Vite getting started](https://vite.dev/guide/) — supported release lines, Node requirements, and official React + TypeScript template.
- [`@vitejs/plugin-react` on npm](https://www.npmjs.com/package/@vitejs/plugin-react) — current official React plugin release (6.2.1).
- [TypeScript on npm](https://www.npmjs.com/package/typescript) — current stable TypeScript release.
- [Dexie on npm](https://www.npmjs.com/package/dexie) and [Dexie documentation](https://dexie.org/docs/) — current package and IndexedDB wrapper.
- [MDN IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) and [storage quotas and eviction](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria) — structured browser storage and persistence limits.
- [`@react-pdf/renderer` on npm](https://www.npmjs.com/package/%40react-pdf/renderer), [browser download docs](https://react-pdf.org/docs/v4/advanced/on-the-fly-rendering), and [font docs](https://react-pdf.org/docs/v4/fonts) — current renderer, direct download, and custom font embedding.
- [MDN print styles](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Media_queries/Printing) — print CSS as an alternative PDF path.
- [Node.js release schedule](https://nodejs.org/en/about/previous-releases) — use a supported LTS runtime.

**Confidence:** Medium. Official project documentation and package registries verify the APIs and current versions. The React/Vite/IndexedDB architecture is a recommendation inferred from the confirmed browser-only v1 scope; validate rendering and font behavior in the chosen target browsers during implementation.
