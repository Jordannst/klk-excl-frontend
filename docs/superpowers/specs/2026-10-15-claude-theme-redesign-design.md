# Claude-inspired Theme Redesign — Design

**Date:** 2026-10-15
**Status:** Approved by user (sections 1–3 in chat); awaiting written-spec review
**Goal:** Re-skin the landing page, login page and dashboard with an Anthropic/Claude-inspired palette (warm ivory, slate, clay) and typography. **UI only**: colors, fonts and CSS. No backend, API, data or behavior changes.

## Decisions

| Topic | Decision |
|---|---|
| Color role | **Clay in front** (claude.ai style): primary actions, focus rings, active tab and key figures use clay on every surface. |
| Light theme | Ivory canvas + white surfaces + slate text. Used by dashboard, landing (light) and login (light). |
| Dark theme | **Warm** (Anthropic slate `#141413`, faint clay glow). Landing and login only, via the existing `data-landing-theme` toggle. |
| Dashboard theme | Light only. The unused `.dark` block in `app/globals.css` is deleted. |
| Fonts | Keep **Instrument Sans** (UI) and **IBM Plex Mono** (numbers / No STT). Add **Source Serif 4** (500/600) for landing h1/h2 and the login headline only. Anthropic Sans/Serif are proprietary and not used. |
| Logo | Shape unchanged. Fills move to a token (`--brand-mark`, temporary clay). The user will supply a re-created logo later (out of scope). |
| Implementation | **Hybrid**: re-tune the neutral `slate-*` scale in `@theme` (covers 211 classes automatically) and hand-migrate the ~70 accent usages to role tokens. |

Not Anthropic's identity: no Anthropic logo, mark, wordmark or font files. Only the palette and feel are borrowed.

## Section 1 — Tokens

All text/background pairs below were computed at ≥ 4.5:1 (WCAG AA). Ratios are noted.

### Light (dashboard + landing light + login light)

| Role | Value | Notes |
|---|---|---|
| canvas | `#faf9f5` | Anthropic ivory-light. ink on it 17.5 |
| surface | `#ffffff` | cards, inputs, tables |
| surface-soft | `#f0eee6` | table header, panels. subtle text on it 4.67 |
| line / line-strong | `#e8e6dc` / `#d1cfc5` | |
| ink | `#141413` | |
| muted text | `#5e5d59` | 6.26 on canvas |
| subtle text | `#6b6a64` | 5.15 on canvas (Anthropic cloud-dark `#87867f` is only 3.47 → rejected) |
| primary (bg) | `#b85836` | white text 4.68 |
| primary hover | `#a24b2c` | white text 5.87 |
| primary ink | `#ffffff` | |
| accent text / link | `#9a4529` | 6.12 on canvas (`#b85836` as text is 4.44 → rejected) |
| accent tint | `#f5e4dc` | with `#9a4529` text 5.22 (badges, highlight flash) |
| focus ring | `#d97757` | Anthropic clay, ring at ~35% alpha |
| success | text `#5a6e40` (5.62 on white), on tint `#4e6137` / `#e9eedf` (5.75) | olive |
| warning | `#8a5d0f` on `#f8ecd4` (4.91) | |
| danger / destructive | `#c43c3c` (5.17 on white, 4.91 on canvas, white text 5.17), tint `#f9e3e0` | |
| brand mark | `#d97757` | interim until new logo |

### Dark — warm (landing + login only)

| Role | Value | Notes |
|---|---|---|
| canvas | `#141413` | ink `#faf9f5` 17.5 |
| surface | `#1f1e1d` | muted 7.48 |
| surface-soft | `#262624` | subtle 4.68 |
| line / control-line | `#30302e` / `#3d3d3a` | |
| ink / muted / subtle | `#faf9f5` / `#b0aea5` / `#918f88` | subtle 5.14 on surface |
| primary (bg) | `#d97757` | with `#141413` text 5.90 (`#b85836` sinks on dark) |
| accent text | `#d97757` | 5.90 on canvas |
| tint / tint ink | `#3a2a22` / `#f0b49b` | 7.63 |
| danger | `#f08a80` | 7.59 |

### Warm `slate-*` scale (overrides Tailwind's `--color-slate-*` in `@theme`)

Each step matches the luminance of Tailwind's original slate step, so every currently-passing text contrast still passes. Steps close to an Anthropic swatch use it exactly.

| 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950 |
|---|---|---|---|---|---|---|---|---|---|---|
| `#faf9f5` | `#f0eee6` | `#e8e6dc` | `#d1cfc5` | `#a5a295` | `#767365` | `#5e5d59` | `#3d3d3a` | `#30302e` | `#1f1e1d` | `#141413` |

(`slate-500` on white stays 4.76.)

### Token naming

- `app/globals.css`: shadcn HSL variables (`--background`, `--primary`, `--muted`, `--border`, `--ring`, `--destructive`, `--success`, `--warning`, `--info`, …) get the light values above.
- `klk-green*` → **renamed** `klk-accent*` (`klk-accent`, `-hover`, `-deep`, `-tint`), a mechanical rename across all usages. A token named "green" must not hold orange. Other `klk-*` tokens (`ink`, `line`, `canvas`, `red`, …) keep their names with new values.
- `components/marketing/theme.css`: `--blue` → **renamed** `--accent`. Light and dark values replaced, including the duplicated `@media (prefers-color-scheme: dark)` block.
- Delete the dead `font-family: 'Inter'` rule on `body` (overridden by the `next/font` class on `<body>`), the unused `.dark` block together with `@custom-variant dark` (no `dark:` variants or `.dark` toggles exist in `app/`, `components/`, `lib/`), and the unused `.gradient-primary`, `.gradient-card`, `.shadow-soft` and `.shadow-elevation` utilities (no usages in `app/` or `components/`).

### Fonts

- `app/shared-document.tsx`: add `Source_Serif_4` via `next/font/google` (weights 500, 600) as CSS variable `--klk-font-serif`, attached to `<body>` with the existing variables.
- Applied only to landing h1/h2 (`marketing.module.css`) and the login headline (`login.module.css`). Dashboard stays sans.

## Section 2 — Per-surface changes and scope

### Dashboard (`app/(workspace)/*` + shared components)

- New tokens in `globals.css`, warm slate scale, `klk-green*` → `klk-accent*`.
- Hand-migrate accents (only `className` strings change):
  - `blue-*` (21): primary buttons → primary token classes; spinners → `text-primary`.
  - `emerald-*` (30): split by intent. **Actions** (e.g. save in signatures, restore in trash) → primary. **Success status** → success (olive).
  - `violet-*` (10): signatures page actions → primary. Storage category cards → Anthropic secondary swatches (olive / sky / fig) in text-safe deep variants (≥ 4.5:1, computed during implementation).
  - `orange` / `yellow` / `amber`: storage usage status and note boxes → warning / danger. Search-hit flash `bg-amber-100` → accent tint. **Storage thresholds (50/70/90%) are untouched**; only colors change.
  - `red-*` (44): unchanged. `destructive` token → `#c43c3c`.
- `components/NavigationProgress.tsx`: `color="#2563eb"` → `#d97757`.

### Landing (`app/[locale]`)

- `theme.css`: replace light and dark values (both dark blocks), `--blue` → `--accent`. Hero, preview and concept gradients become ivory/slate with a faint clay glow.
- `marketing.module.css`: the 17 blue hex literals (`#2463eb`, `#205add`, `#174fd0`, tinted variants) → tokens.
- h1/h2 → serif.
- Copy, layout, animation, locales (id/en) and theme-toggle logic are unchanged.

### Login (`app/(auth)/login`)

- `login.module.css`: collapse the three overriding layers (original green handoff tokens → "Public product identity" override at ~L456 → "Shared public theme" at ~L493) into **one token-based layer**. Result: left panel uses surface-soft (ivory-medium / `#1f1e1d`) with a faint clay glow; eyebrow and links accent; headline serif.
- `page.tsx`: 2× `bg-blue-600 hover:bg-blue-700` → primary.
- Theme toggle unchanged.

### Logo

`components/ProductBrand.tsx`: hardcoded `#2463eb` fills → `var(--brand-mark, #d97757)`; ink fill keeps `var(--brand-mark-ink, …)`. Path data unchanged.

### Out of scope (must not change)

- Everything in `backend/`.
- `lib/api.ts`, `lib/hooks/*`, `lib/types.ts`, `lib/auth.tsx`, `next.config.ts`.
- Any handler, state, effect, conditional logic, route structure or user-facing copy.
- Print documents `components/InvoiceDocument.tsx` / `TransactionDocument.tsx` and backend PDFs (business documents, not UI).
- `app/[locale]/opengraph-image.tsx` and `public/social-preview.png` (follow-up together with the new logo).
- Logo artwork.

### Diff rule

Changes are allowed only in: `.css` files, `className` string values, font loading in `app/shared-document.tsx`, `fill` attributes in `ProductBrand.tsx`, the `color` prop in `NavigationProgress.tsx`, and expected RGB values in `scripts/landing-theme.check.cjs`.

## Section 3 — Verification

1. `npm run lint` and `npm run build` pass.
2. Existing QA against `next start` (ports 3100 / 3101):
   - `test:product`, `test:landing`, `test:landing-locales`, `test:landing-motion` pass **unmodified**: the behavior proof.
   - `test:landing-theme`: update only the hardcoded RGB expectations to the new palette (dark canvas `rgb(20, 20, 19)`, dark heading `rgb(250, 249, 245)`, light canvas `rgb(250, 249, 245)`). The ≥ 4.5:1 contrast assertion stays.
3. Behavior guard:
   - `git status` in `backend/` is clean.
   - The frontend `git diff` touches only the diff-rule categories.
   - `grep` finds no remaining `blue-*`, `emerald-*`, `violet-*` classes or `#2463eb` in `app/` and `components/`. Print documents are excluded from this check.
4. Before/after screenshots at 1440px and 390px:
   - landing (id/en × light/dark)
   - login (light/dark)
   - dashboard, storage, trash, signatures

   Dashboard pages are captured with the `test:product` `/api` mocks: **no backend or production database access**. The screenshot script lives in the session scratchpad and is not committed.

## Housekeeping

- Add `.superpowers/` to `frontend/.gitignore`.
- Commit messages: no `Co-Authored-By` or other attribution trailers.
- Fine-tuning after the first pass is expected: the user will review and request adjustments, which are token-value edits.
