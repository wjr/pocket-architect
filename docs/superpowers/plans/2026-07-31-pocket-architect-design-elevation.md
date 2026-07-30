# Pocket Architect — Design Elevation (minimal · raw · crafted)

**Date:** 2026-07-31
**Status:** Implemented & verified (2026-07-31)

## Context
Pocket Architect is built and merged to `master`; it works and is verified. Its aesthetic *direction* is sound (warm paper, graph grid, ink, blueprint-blue, serif values + mono chrome) but it currently reads **generic** in the spots that matter most: all-system-fonts typography (Georgia / Roboto / `ui-monospace` — the exact defaults to avoid), a graph grid so faint it looks flat, zero tactility, and a plain centered-column form layout.

Goal: **improve the design while keeping it minimalistic and raw.** Decisions locked with the user:
- **Type** → self-host a distinctive pair, offline-safe (~≤120KB), system-font fallback.
- **Drafting character** → **texture only**: richer vellum graph paper + paper grain, warmer ink, sharper corners. *No* border frame, *no* markers (respects the earlier "keep it bare / no date or streak markers").
- **Motion** → **subtle & purposeful**: orchestrated load reveal, quiet reroll card transition, refined hover/press; honor `prefers-reduced-motion`.

**Outcome:** same one bare screen, same behavior, but with the craft and character of a real architect's working vellum sheet.

## Direction — "vellum drafting sheet"
Refine, don't rebuild. Keep every existing class/ID (consumed by `app.js` + `index.html`) and the existing structure; elevate only the surface.

## Files
- **`styles.css`** — the bulk: typography, color tokens, paper texture, hierarchy/spacing, motion, detail polish. (Values rewritten; selectors/structure unchanged.)
- **`index.html`** — minimal: add `<link rel="preload" as="font">` for the two primary cuts (perf, optional). No structural markup needed (grain = CSS pseudo-element).
- **`app.js`** — **no change expected.** Cards are re-created on every reroll, so a CSS entrance animation on `.card` auto-replays per reroll → pure-CSS reroll feedback. (Optional hook only if a value-only crossfade is later desired: toggle a class in `renderCards`.)
- **New `/fonts/`** — self-hosted latin-subset `.woff2` + OFL license files for each family.

## Aesthetic spec (recommended values; fine-tune during implementation)

**Typography — self-hosted, OFL-licensed, latin-subset woff2 (download from Google Fonts CDN once, commit locally):**
- Display serif **Fraunces** (variable `opsz`/`wght`, or 2 static cuts) → `.pa-title`, `.card-value`, `.card-tip`. Hero values use a high optical size for a confident, slightly "wonk"/hand-set character. Fallback: `Georgia, serif`.
- Mono **IBM Plex Mono** → `.card-label`, `.skill-btn`, `.preset-btn`, `.timer-display`, `.timer-controls button`, `.reroll`. Engineering/instrument feel. Fallback: `ui-monospace, Menlo, monospace`.
- `@font-face` with `font-display: swap`; `<link rel="preload">` the display + mono regular cuts in `<head>`.

**Color tokens (warmer vellum, refined ink, one blueprint accent):**
`--paper:#f1ebdc; --card:#fbf7ee; --ink:#17140d; --ink-soft:#5c544a; --accent:#1f4f8f; --rule:rgba(23,20,13,.14); --grid-minor:rgba(31,79,143,.045); --grid-major:rgba(31,79,143,.085).` One accent, used sparingly (active states, card rule, focus).

**Texture (paper tactility, CSS-only, no asset file):**
- Graph paper = two layers: minor ~18px @ `--grid-minor` + major ~90px @ `--grid-major` (real vellum major/minor lines).
- Grain = `body::before` with a tiled SVG `feTurbulence` data-URI @ ~0.035 opacity, `mix-blend-mode:multiply`, `pointer-events:none`.
- Optional faint edge vignette via `body::after` radial-gradient (very low opacity) for sheet depth.

**Hierarchy & spacing:**
- Generous vertical rhythm (`.pa` gap ~28–32px), larger side padding.
- `.card-value` is the hero: ~2rem desktop / ~1.6rem mobile, Fraunces, tight leading.
- `.pa-title` smaller (~1.05rem), wide tracking, a single refined hairline rule (no heavy border).
- `.card-tip` serif italic, `--ink-soft`, optional em-dash leader.
- Sharper corners: `border-radius:2px` (cards/buttons); square title block.
- Reduce shadows toward none (raw); a hairline at most.

**Motion (CSS-only; base state always opacity:1 so content shows with motion disabled):**
- Load: `@keyframes rise{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}`; stagger `.pa > *` via `animation-delay` (title→skill→cards→timer→reroll), cards stagger by `:nth-child`; `animation-fill-mode:both`, ~0.5s.
- Reroll: `.card` entrance (~0.35s `rise`) replays automatically on re-render.
- Hover: `.card:hover` `translateY(-2px)` + accent border; buttons subtle bg.
- Press: `:active{transform:scale(.98)}`.
- Focus (a11y): `:focus-visible{outline:2px solid var(--accent);outline-offset:2px}`.
- Keep/refine `.timer-display.finished` pulse (calm blueprint glow).
- `@media (prefers-reduced-motion: reduce){*{animation:none!important;transition:none!important}}`.

## Constraints honored
- **100% offline:** fonts are local woff2; no external `@import`/`url()`. Verified under emulated offline (core spec value).
- **Bare / no data markers:** texture-only — no date, streak, border frame, or registration marks.
- **No behavior change:** `app.js` untouched; 66/66 tests unaffected.
- OFL license files included for the bundled fonts.

## Verification
1. `node tests/pa.test.js` → still **66/66** (sanity; CSS doesn't affect logic).
2. Open `index.html` under `file://` via chrome-devtools MCP:
   - Fonts render (Fraunces values, Plex Mono labels) — confirm computed `font-family`.
   - **Offline:** emulate Network = Offline, reload → fonts still render, **zero** requests in `list_network_requests` (proves no external dependency introduced).
   - Major/minor grid + grain visible; warmer ink; sharp corners.
   - Hero-sized values; refined title rule; generous rhythm.
   - Load stagger plays once; reroll re-animates cards; hover/press; keyboard `:focus-visible` rings.
   - `.timer-display.finished` pulse; Free-draw disables controls; ≤360px layout holds.
3. Emulate `prefers-reduced-motion: reduce` → motion off, all content visible.
4. Mobile widths (320–480px) snapshot — cards stack, type scales, no overflow.

## Outcome
Shipped on `master` in four commits (`d81172f` plan → `e7c34fe` fonts →
`c3d96a3` design CSS → `7a8c1c0` file:// fix). `app.js` untouched; 66/66 tests
green; no behavior change.

**Key deviation from the written spec (necessary):** self-hosted `.woff2`
referenced via `@font-face url()` are **CORS-blocked under `file://`** in Chrome
(null origin), which broke fonts on the app's primary run mode (double-click).
Resolved by inlining the latin woff2 as **base64 data URIs** in `styles.css` —
no fetch, no CORS. The separate `.woff2` files were dropped; OFL license text kept.

**Verified live (chrome-devtools, `file://`):**
- `document.fonts.status === "loaded"`; Fraunces + IBM Plex Mono `.check()` true;
  computed families correct; body bg `#f1ebdc`.
- Console clean (no CORS/errors).
- Emulated **Offline** reload → fonts still `loaded`, 3 cards render, **zero**
  external network requests (only local `file://` + inline base64).
- Desktop `row` → mobile `380px` `column`: fluid hero sizing, **no horizontal overflow**.
- `prefers-reduced-motion`: rise animation gated behind `no-preference`; reduce
  override → every element `opacity:1`, `transform:none`, `animationName:none`.
- Reroll re-triggers the `pa-rise` card entrance (pure CSS, no JS change);
  keyboard `:focus-visible` shows the `2px` accent ring.
