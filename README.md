# Pocket Architect

A local-first "magic 8-ball" for architectural drawing practice. Open it, get three
random constraints (building type, perspective, placement) calibrated to your skill
level, each with a one-line teaching tip, and draw within them for a timed session.

## Run the app

Double-click `index.html` (opens under `file://`). Works offline; no server or build.

The public version is available at <https://wjr.github.io/pocket-architect/>.

## Run the tests

Command line (requires Node):

```
node tests/pa.test.js
```

Or in a browser: open `test.html`.

## Files

- `index.html` / `styles.css` — markup and the drafting look.
- `app.js` — engine (pure functions) plus DOM/timer wiring.
- `data.js` — the constraint lists, tips, and difficulty tags. Add entries here; no other
file needs to change.
- `tests/pa.test.js` / `test.html` — the test suite.

## Adding content

Append objects to the arrays in `data.js`. Each entry is
`{ label, difficulty, tip }` where `difficulty` is `"easy"`, `"medium"`, or `"hard"`.
`tip` is optional. Keep at least one entry of each difficulty per category so every
skill level can always roll.

## Share graphics

`social/` holds share images (OG, Twitter/X card, Instagram, LinkedIn carousel) drawn
in the app's drafting style, plus a Puppeteer renderer that turns the templates into
PNGs. See [`social/README.md`](social/README.md) for the specs, how to re-render them,
and how to customize.

## Generate constraint images

The Ruby generator reads the 44 prompts in `image-gen-prompt.json`. It is dry-run by
default and never makes a paid API call unless `--generate` is supplied.

```sh
bundle install
ruby bin/generate_images --pilot --estimate
ruby bin/generate_images --pilot --generate --yes --max-cost 0.05
```

Set `OPENAI_API_KEY` before generating. Generated files go under
`images/constraints/`, with resumable state in `images/manifest.json`. Run the free
test suite with `bundle exec ruby -Itest test/image_generator_test.rb`. The browser maps each
`data.js` constraint value to its WebP visual and reveals it inside the existing card
without changing the card's dimensions.

Generated WebP assets are served by both pages through `image-map.js`. The source PNGs
remain available for image review and future conversion; the browser uses WebP for
smaller network payloads.

## Publish to GitHub Pages

GitHub Pages serves the `master` branch from its repository root. After committing
changes, push the branch with:

```sh
git push origin master
```

The published site is then available at the public URL above.
