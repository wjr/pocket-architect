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

## Notes

- `pa-fonts.css` is large (~210 KB) because it embeds the fonts as base64, exactly
  like `../styles.css` — it’s regenerated from the app, not edited by hand.
- Everything renders offline from local files; no network calls.
