# Pocket Architect — social images

Share graphics drawn in the app’s own **vellum drafting-sheet** style — same paper,
graph grid, grain, ink, blueprint-blue, and Fraunces + IBM Plex Mono type as
`../styles.css`. They read as part of the practice, not as a generic widget.

## Files

| Output | Template | Spec | Use it for |
|---|---|---|---|
| `out/og.png` | `og.html` | 1200×630 | Link previews (Facebook, LinkedIn, Slack). **Wired into `../index.html` as `og:image` / `twitter:image`.** |
| `out/card.png` | `card.html` | 1200×675 | Twitter/X photo post — shows one real rolled prompt. |
| `out/instagram.png` | `instagram.html` | 1080×1080 | Instagram / square feed post. |
| `out/linkedin-1.png` … `-3.png` | `linkedin-{1,2,3}.html` | 1080×1080 | LinkedIn carousel: friction → how it works → a sample roll. |

The sample prompt used on the cards is a real roll from `../data.js`:
**Cathedral · Worm’s-eye view · Steep cliffside** (all advanced-tier).

Source: each `*.html` links `pa-fonts.css` (the self-hosted fonts, extracted
verbatim from the app) + `pa-social.css` (tokens + drafting-sheet chrome + layout).

## Render

```bash
npm install puppeteer          # one-time; bundles Chromium
node social/render.mjs         # renders every template into out/
node social/render.mjs og      # render only matches (substring of filename)
```

Output is written to `out/`. Default raster is **1×** = exact platform spec and
small files (~0.5–0.8 MB). For retina, set `SCALE = 2` at the top of `render.mjs`
(doubles dimensions, ~4× the bytes).

## Customize

- **Copy / headline / tagline:** edit the text inside each `*.html`.
- **The sample prompt:** the three `.card` blocks in `card.html`, `instagram.html`,
  and `linkedin-3.html` — swap in any values from `../data.js`.
- **Colors / grid / fonts:** change the tokens in `pa-social.css` `:root` (or, to
  keep the app and share graphics in lockstep, copy any change from `../styles.css`).
- **Add a carousel slide:** duplicate `linkedin-2.html`, bump the `02`/`Sht 02`
  numbering, advance the `.pip` that carries `.on`, and add it to `PAGES` in `render.mjs`.

## How it works

Each template is plain HTML that links the two stylesheets and is screenshotted by a
headless browser. The design decisions, and why:

- **HTML + CSS + a headless screenshot, not a graphics/canvas library.** The share
  graphics reuse the app's exact live look — tokens, graph grid, grain, ink, Fraunces
  + IBM Plex Mono — so they stay in lockstep with `../styles.css` by construction. You
  author and preview them as real web pages with real web type, not by placing glyphs
  on a coordinate plane. Change the app's CSS and a re-render carries it over.
- **Two stylesheets, split by hand-authored vs generated.** `pa-social.css` is the
  editable design (tokens, drafting chrome, layout). `pa-fonts.css` is a
  machine-extracted payload of the self-hosted fonts as base64 — regenerated from
  `../styles.css`, never hand-edited (see Notes).
- **Offline by design.** The fonts are inlined, so the renderer makes no network calls
  and the glyphs are byte-identical to the app — no missing-glyph fallback at capture.
- **The render loop** (`render.mjs`), per page: set the viewport to the exact pixel
  size with `deviceScaleFactor`, load the local file via `file://`, wait for
  `document.fonts.ready` so the real type is painted before capture, then screenshot
  `<body>`. That's what guarantees exact platform dimensions with no clipping.
- **Puppeteer is resolved lazily.** The app itself has zero runtime dependencies
  (vanilla, local-first), so `render.mjs` doesn't assume puppeteer lives in the repo:
  it tries a project dependency first, then falls back to a global / `$HOME` install
  via `createRequire`.
- **`SCALE` defaults to 1×** — exact platform spec and small files. Bump it to `2` for
  a retina raster (doubles dimensions, ~4× the bytes).

## Notes

- `pa-fonts.css` is large (~210 KB) because it embeds the fonts as base64, exactly
  like `../styles.css` — it’s regenerated from the app, not edited by hand.
- Everything renders offline from local files; no network calls.
