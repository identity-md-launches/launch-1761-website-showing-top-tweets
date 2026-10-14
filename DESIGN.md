# Identity MD Signal design system

## Overview

Signal is a compact tweet discovery and reading interface for the Identity MD community. The requested dark green and AI-equipped Pepe theme becomes a forest-green reading desk with one lime primary action and a comic squad illustration. The product stays close to the top: the hero introduces it in four words, followed immediately by search, topic filters, and the post collection.

The source of truth is `src/styles.css`. Application patterns live in `src/App.tsx`, icons in `src/icons.tsx`, and data in `src/posts.ts`. This is a single dark theme; there is no theme toggle or alternate light palette.

## Colors

The implementation uses sRGB hex values and role-based CSS properties in `src/styles.css:18`.

| Token | Value | Role |
| --- | --- | --- |
| `--page` | `#0b1712` | Page and navigation background |
| `--surface` | `#102219` | Posts, fields, empty states, dialog |
| `--surface-hover` | `#162c21` | Hover feedback |
| `--surface-raised` | `#1c3527` | Supporting panel, count badges, dialog close button |
| `--hero` | `#10271c` | Hero base |
| `--line` | `#294134` | Structural separators and post borders |
| `--control-line` | `#668371` | Discoverable field/dialog edges |
| `--text` | `#edf2e9` | Primary text |
| `--muted` | `#a2b2a7` | Handles, dates, secondary copy and metrics |
| `--accent` | `#c0f477` | Primary fill, selected states, highlighted headline |
| `--accent-hover` | `#d1ff92` | Primary hover |
| `--accent-soft` | `#283e20` | Selected navigation, filter and bookmark surfaces |
| `--ink` | `#142015` | Text on lime surfaces |
| `--focus` | `#d3ff98` | 2px focus perimeter |
| `--warning` | `#f5d69b` | Storage-unavailable explanation |

Small supporting colors remain local to their components: hero copy `#c0ccc1`, post-link text `#cbd7c9`, topic text/background `#b8cca5` / `#1c3022`, supporting-panel copy `#b6c6b8`, and avatar ink `#18241c`. Avatar fills are `#b8c4a3`, `#bfcabd`, `#b7acc7`, `#d2bfa0`, and `#a6cbb7`; these distinguish initials and never encode status. The dialog backdrop is `#020b07cc`.

The rendered probe measured post text at **14.61:1**, primary-button text at **13.19:1**, and topic-tag text at **8.17:1**. The minimum measured text ratio was **5.96:1**. See the validation report for the coverage boundary. Selection uses lime with dark ink. Forced-colors mode keeps system focus colors and explicit selected-control borders.

## Typography

Manrope is bundled locally as `public/fonts/manrope-latin.woff2`, with `Arial, sans-serif` fallbacks. The file supports weights 200–800; the UI uses only **400, 600, 700**. Font loading was verified in Chromium. The OFL is delivered beside the font.

| Token | Default size | Use |
| --- | ---: | --- |
| `--text-xs` | 12px / .75rem | Metadata, tags, supporting labels |
| `--text-sm` | 14px / .875rem | Navigation, authors, short copy |
| `--text-base` | 16px / 1rem | Post bodies, mobile inputs, dialog subheads |
| `--text-lg` | 20px / 1.25rem | Feed heading, brand, support heading |
| `--text-xl` | 28px / 1.75rem | Mobile hero and desktop dialog title |
| `--text-display` | 48px / 3rem | Desktop hero |

The global six-size scale renders five distinct sizes at each default tested viewport. Headline line height is 1.08, with tracking −.05em desktop and −.04em mobile. Brand tracking is −.035em; feed headings use −.025em. Body line height is 1.6, post copy 1.7 (1.65 on small phones). Post text has a 68ch cap; handles and query feedback can wrap anywhere. No critical content is ellipsized. Changing counts use tabular numerals. Inputs are at least 16px on mobile to avoid input-focus zoom.

## Layout

`.app-shell` is centered with a 1440px maximum. At wide sizes, a 220px sticky navigation column sits beside the workspace. Main padding is 36px. `.content-grid` contains a flexible feed and 254px supporting rail, separated by 28px. The banner illustration is absolutely positioned within its right-hand column so the copy, not the image's intrinsic dimensions, controls banner height.

Spacing uses a practical 4px rhythm with 8–12px inside groups, 16–20px around content, and 24–32px between sections. Small optical adjustments are retained in icons and inline metadata. This is implemented directly in component rules rather than a separate spacing-token schema.

| Breakpoint | Implemented behavior |
| --- | --- |
| ≤1220px | Navigation 196px, workspace padding 28px, rail 216px, gap 24px |
| ≤1080px | Navigation 190px; supporting rail hidden; feed fills the workspace |
| ≤740px | Navigation becomes a normal-flow header with two horizontal links; supporting navigation is hidden; hero heading 28px; 20px page margins |
| ≤440px | 16px page margins; compact header/banner; 12px topic labels; 16px post padding |
| ≤360px | Tighter metadata/icon spacing; 12px post insets |

The filter row wraps. The search/sort row wraps when its content needs more room, with rem-based widths that grow with text. Post actions can wrap onto a second line at enlarged sizes. The dialog is at most 560px wide and uses an internal scroll area at `100dvh - 48px`. Tested reflow widths: 320, 390, 740, 900, 1080, 1440px. At 390×844 the first post's Read action ends at 821.2px, visibly inside the first screen. A 200% text-enlargement check also passed; native browser zoom was not tested.

## Elevation & Depth

The interface is flat. Surface tones and 1px borders define grouping; there are no box shadows, gradient text, glass effects, nested post cards, or animated ambient layers. Only the native modal occupies the browser's top layer. The keyboard skip link uses z-index 100 while focused. Illustration clipping is intentional; text never depends on the illustration for contrast.

## Shapes

`--radius-sm: 8px` is used for fields and actions; `--radius: 12px` for posts and the support panel; `--radius-lg: 16px` for hero and dialog. Tags use 4px, count badges 5px, filters and save controls 6px. Initials are circular. The brand mark is a local SVG frog.

## Components

| Component/pattern | Source | Behavior and states |
| --- | --- | --- |
| `App` | `src/App.tsx:58` | Owns filters, hash navigation, bookmark storage and dialog |
| `PostCard` | `src/App.tsx:32` | Author, UTC date, quote or marked summary, snapshot metrics, original-source links and bookmark toggle |
| `Avatar` | `src/App.tsx:28` | Decorative initials, optional small size; never implies a verified profile photo |
| `Icon` | `src/icons.tsx` | Local 24-unit SVGs, 1.7px stroke, currentColor; decorative to assistive technology |
| `.primary-button` | `src/styles.css:95` | Lime action; hover fill; 44px minimum height |
| `.search-field` / `.sort-field` | `src/styles.css:104` | Native labeled controls; search clear button; exact search and sort state in hash |
| `.topic-filters` | `src/styles.css:114` | Native buttons with `aria-pressed`; selected fill plus underline |
| `.save-button` | `src/styles.css:145` | Fill, icon, accessible name and `aria-pressed` change together; persists locally |
| `.empty-state` | `src/styles.css:172` | Explains missing results or saved posts; offers Clear filters or Explore posts |
| `.about-dialog` | `src/App.tsx:148` | Native modal, initial close-button focus, Tab boundary wrapping, Escape/close/backdrop dismissal, native focus return |

Focus uses a visible 2px perimeter with a 4px offset; the search wrapper uses a 2px offset. Updates have polite live regions, while storage failure is a persistent alert. The native modal makes background content inert. No fake loading state exists: the local collection is immediately available. Errors are limited to browser storage; those retain in-memory saves and explain their lifetime.

Motion is opt-in under `prefers-reduced-motion: no-preference`: 120ms named-property transitions and a `.96` press scale, using `cubic-bezier(.2, 0, 0, 1)` for transforms. Hover rules require a hover-capable pointer. There are no infinite animations or autoplay.

## Do's and Don'ts

- Reuse `.app-shell`, the feed hierarchy, and existing semantic tokens when extending this interface.
- Keep data controls immediately above the content they change. Add posts through the typed `Post` shape and retain observed source URLs.
- Use native buttons for local actions and real anchors for external sources. Keep text labels or accessible names on every action.
- Keep the snapshot distinction and summary labels visible. Do not invent counts, verification badges, or live updates.
- Preserve rem-based text and wrapping actions; do not solve overflow by clipping author names or reducing essential type.
- A new view should reuse the header, `PostCard`, empty-state pattern and hash navigation, rather than introducing server-dependent paths or another visual system.

Design guidance: Jakub Krehel's Better Interface (MIT). Documentation method: Paul Bakaus's Impeccable (Apache-2.0), as supplied in the pinned assignment guide. Notices and license text are retained in `artifacts/licenses/`.
