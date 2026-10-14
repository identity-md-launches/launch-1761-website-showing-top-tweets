# Identity MD Signal

A dark green, responsive reading desk for top tweets about Identity MD, illustrated with AI-equipped Pepes. Search posts and authors, filter topics, sort by captured likes/reposts or date, open the original tweets, and save posts in this browser.

**The feed is a sourced, static collection of eight posts.** It is not a live X feed or an exhaustive ranking. The capture date, selection method, cached counts, summaries, and storage behavior are explained in the website's About dialog. See [source provenance](artifacts/SOURCES.md).

## Install, develop, preview, rebuild

Use Node.js 22.12+ (worker used 24.21.0) and npm.

```sh
npm ci
npm run dev
```

To rebuild and preview the production export:

```sh
npm run typecheck
npm run build
npm run preview -- --host 127.0.0.1
```

Open the local URL printed by Vite. The completed `dist/index.html` and all of `dist/` are included in this deliverable. Static hosting serves **the contents of `dist/`**; it does not need to rebuild. Vite's base is `./`, and all runtime assets are local. Hash navigation works under a gateway subpath without server rewrites. Use an HTTP server for preview, rather than double-clicking the HTML file.

No credentials, API keys, wallet, server, RPC, analytics, or remote font service are required. Bookmarks use the `identity-md-signal:saved:v1` local-storage key. Clearing browser data removes them. If storage is blocked, the UI explains that saves only last for the current page session.

## Project map

| Path | Contents |
| --- | --- |
| `src/App.tsx` | Feed, navigation, filters, bookmarks, source dialog |
| `src/posts.ts` | Sourced post records, date derivation, search and sorting |
| `src/styles.css` | Design tokens, responsive layouts, focus and reduced-motion styles |
| `src/icons.tsx` | Local SVG interface icons |
| `public/` | Runtime artwork, font, share card, favicon |
| `dist/` | Finished static export, included alongside source |
| `DESIGN.md` | Implemented visual system |
| `artifacts/validation.md` | Six-domain review, actual checks, fixes and limitations |
| `artifacts/SOURCES.md` | Tweet provenance and selection method |
| `artifacts/ASSETS.md` | Illustration prompt, asset provenance and attribution |

To update the collection, edit `src/posts.ts` with observed source URLs, post IDs, text or clearly marked summaries, and captured counts. Update `capturedOn` and the provenance record, then typecheck, build and rerun the checks. Never add invented engagement figures or present cached metrics as live. The avatar circles deliberately contain initials instead of unverified profile photos.

## Actual validation results

Run on 14 October 2026, against the final production export:

| Check | Result |
| --- | --- |
| Vite 7.3.7 production build | Passed |
| TypeScript 5.9.3 strict typecheck | Passed |
| Chromium interaction suite | **24/24 passed** |
| Supplied taste@1 design probe | **16/16 passed** |
| axe WCAG A/AA scans | No violations in checked feed, dialog and empty states |
| Widths 320, 390, 740, 900, 1080, 1440 | No horizontal overflow |
| First screen at 390 × 844 | Product, search, Explore action and first post's Read/save controls visible |
| 200% text enlargement at 390 | Reflows without horizontal overflow |
| Network and console | No missing local assets, script errors, or external runtime requests |
| npm audit, final lockfile | 0 vulnerabilities reported |

The build and typecheck ran using dependencies installed outside the repository, respecting the worker's protected `node_modules` path:

```sh
IMD_DEPENDENCY_ROOT=/tmp/imd-signal-deps/node_modules \
  /tmp/imd-signal-deps/node_modules/.bin/vite build
/tmp/imd-signal-deps/node_modules/.bin/tsc --noEmit \
  --typeRoots /tmp/imd-signal-deps/node_modules/@types
```

For the optional browser suite, install Playwright and axe in a separate temporary directory, install Chromium, and point the script at the installed modules:

```sh
npm install --prefix /tmp/imd-signal-checks playwright @axe-core/playwright
/tmp/imd-signal-checks/node_modules/.bin/playwright install chromium
IMD_PLAYWRIGHT_MODULE=/tmp/imd-signal-checks/node_modules/playwright/index.mjs \
IMD_AXE_MODULE=/tmp/imd-signal-checks/node_modules/@axe-core/playwright/dist/index.js \
  node scripts/validate.mjs
npm run check:bundle
```

The script serves `dist/` at `/preview/`, opens the browser, writes evidence to disposable `test/scratch/interaction/`, and closes the server and browser. `IMD_CHROMIUM_EXECUTABLE` optionally selects an existing Chromium executable. The worker used `/root/.cache/ms-playwright/chromium_headless_shell-1247/chrome-headless-shell-linux64/chrome-headless-shell` with the Playwright and axe packages in `/tmp/blackout-toolchain/node_modules/`.

The pinned design probe was run with:

```sh
IMD_PLAYWRIGHT=/tmp/imd-review-playwright.mjs \
  node .imd/reads/skills/design-critic/scripts/taste.mjs --out test/scratch/taste
```

The pinned input is removed during submission. Its actual result is preserved in [artifacts/taste-results.json](artifacts/taste-results.json); the application does not need it to rebuild. Selected final screenshots and the interaction report are in `artifacts/`.

**Limitations:** WebKit downloaded but could not launch because this host lacks its shared libraries, including `libgtk-4.so.1`; Safari is unverified. No physical-device or screen-reader session was performed. Text enlargement is not native browser zoom. X returned HTTP 403 during research, so content/counts were observed through public cached mirrors; external availability is not certified. Share metadata is present, but live social unfurling cannot be verified before a hosting URL exists.

## Packaging

The 8 MiB cap and explicit `.gitignore` budget are recorded in [artifacts/PATH_BUDGET.md](artifacts/PATH_BUDGET.md). `dist/` is intentionally included. Dependencies, caches, browser downloads, archives and test scratch are excluded at every nesting level. Run `npm run check:bundle` for the measured file total and relative-asset checks. No deployment, publication, or Git metadata changes were performed.
