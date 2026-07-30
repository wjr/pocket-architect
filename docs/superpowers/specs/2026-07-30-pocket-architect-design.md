# Pocket Architect — Design Spec

**Date:** 2026-07-30
**Status:** Approved (pending implementation plan)

## Purpose

A single-page, local-first web tool (plain HTML/CSS/JS) that acts as a "magic 8-ball"
for architectural drawing practice. The moment it opens, it presents three random
constraints — **building type**, **perspective**, and **placement** — drawn from curated
lists. The user draws within those constraints for a timed session.

The problem it solves is procrastination driven by decision cost: "what should I draw
today?" is paid in full before any line is put down. By front-loading that decision to
zero and serving a calibrated prompt instantly, the tool lowers the activation energy to
start practicing.

## Goals

- Present an instant, random, calibrated drawing prompt on open — no blank screen.
- Encourage a hobbyist: difficulty is gated to their skill level, and every constraint
  value carries a one-line teaching tip.
- Run entirely offline as local files — double-click `index.html`, no server, no build.

## Non-goals (v1)

- No backend, accounts, or cross-device sync.
- No streak, history, or archive UI (the screen stays bare).
- No deployment / PWA / installable app (local files only — see Access model).
- No dark mode (light mode only).
- No per-category reroll (a single reroll-all button).
- No curated/themed sets (pure random).

## Access model

**Local files only.** The user opens `index.html` directly under `file://`.

Technical consequences:

- **Data is loaded via `<script>` tags, not `fetch()`.** `fetch` of a local JSON is
  blocked under `file://`; `<script src="data.js">` works fine.
- **`localStorage` is used defensively.** It can be flaky/blocked under `file://`
  (notably Safari), so every storage call is wrapped in try/catch and falls back to an
  in-memory copy. The app keeps working for the session; it just won't persist across
  reloads when storage is unavailable.
- **No service worker / offline cache** (PWA is out of scope).

**Known limitation:** local files are frictionless on a computer but clumsy on a phone
(mobile browsers dislike `file://`, and getting the file onto the device is a hassle).
Phone use is therefore secondary. Deploying the *same code* to a free static host is a
future low-effort upgrade that requires no rewrite.

## File structure (Approach B — separated files)

- `index.html` — markup only.
- `styles.css` — look & feel.
- `app.js` — the engine: rolling, timer, skill selection, persistence. Roll logic is
  kept in pure functions isolated from the DOM.
- `data.js` — content only: the constraint arrays, tips, and difficulty tags. No logic.
  This is the file edited most often (adding tips, tagging difficulty); it never touches
  engine code, so content edits cannot break the app.
- `test.html` — loads `data.js` + `app.js`, runs assertions against the pure functions,
  and prints pass/fail to the screen. Zero dependencies; runs under `file://`.

## Data model (`data.js`)

A single `DATA` object with three arrays. Each value is a plain object:

```js
{ label: "Cathedral", difficulty: "hard", tip: "Push verticality — tall nave, pointed arches; let columns carry the eye up." }
```

**Fields:**
- `label` (string, required) — what is drawn.
- `difficulty` (`"easy"` | `"medium"` | `"hard"`, required).
- `tip` (string, **optional**) — a one-line teaching note. If absent, the UI shows the
  label alone, so the app ships before every tip is written.

**Categories and target sizes (natural lengths, not a fixed 30):**
- `building` — ~30 entries (e.g. cathedral, lighthouse, row house, observatory, grain silo).
- `placement` — ~30 entries (e.g. cliffside, dense urban alley, reclaimed marsh, rooftop garden).
- `perspective` — **~12 entries.** "Perspective" means **technical drawing projection/view**,
  not viewpoint/composition. The list: one-point, two-point, three-point, plan, section,
  elevation, axonometric, isometric, worm's-eye, bird's-eye/aerial, exploded axon,
  sectional perspective. Forcing 30 here would mean padding; 12 distinct, teachable
  projections is the honest list.

**Difficulty → skill mapping** (the protective gate):
- **Beginner** rolls only `easy` values across all three categories.
- **Intermediate** rolls `easy` + `medium`.
- **Advanced** rolls everything.

**Anti-repeat:** the last ~6 rolls per category are remembered (in `localStorage`, with
the in-memory fallback). The next roll excludes them. Safety valve: if excluding recent
rolls would drop a category's eligible pool below 1, the exclusion is ignored so a roll
never fails.

## Engine (`app.js`)

**Pure functions** (no DOM access, unit-testable):
- `eligiblePool(category, skill, history)` → the values in `category` permitted by
  `skill`, minus the recent entries in `history` (with the safety valve applied).
- `rollOne(pool)` → a uniformly random value from `pool`.
- `rollAll(skill, history)` → `{ building, perspective, placement }`.
- `isWellFormed(entry)` → `true` only if `entry` has a `label` and a valid `difficulty`.

**Behavior:**
- **On load:** auto-roll once. There is never a blank screen.
- **Reroll:** one button re-rolls all three; anti-repeat prevents bouncing back to the
  identical combo. (Per-category reroll is a future add, not v1.)
- **Skill selector:** a Beginner / Intermediate / Advanced control. Changing it (a)
  persists the choice and (b) **auto-rerolls immediately**, so the constraints on screen
  are always valid for the selected level.
- **Session timer:**
  - Presets: **15 / 30 / 45 minutes**, plus **"Free draw"** (no clock).
  - Countdown display; **Start / Pause / Reset**.
  - At zero: a soft chime + a visual change, then it **stops** (no looping alarm, never
    counts below zero).
  - "Free draw" hides the countdown and disables the timer controls.
  - The timer is independent of the roll — rerolling mid-timer leaves the timer running.
- **Persistence:** `localStorage` keys `pa.skill` (selected skill) and `pa.history`
  (per-category recent rolls). All access is try/catch with in-memory fallback.
- **Data validation at load:** every `data.js` entry is passed through `isWellFormed`;
  malformed entries are skipped with a `console.warn`, so one typo can't blank the app.

## UI (`index.html`, `styles.css`)

**One screen, no menus, no settings page.** The skill selector is the only setting.
Mobile-first: one column on phone, constraint cards in a row on desktop. Works 320px →
wide.

Layout, top to bottom:
1. Title.
2. Skill segmented control — `[Beginner][Intermediate][Advanced]`.
3. Three constraint cards, each showing a small category label, the rolled value (large),
   and the one-line tip.
4. Timer presets `[15][30][45][Free draw]`, the countdown, and `Start` / `Reset`.
5. Primary `Reroll` button (large).

On load the screen auto-rolls, so a complete prompt is visible immediately.

**Look & feel — drafting / sketchbook aesthetic**, so the tool reads as part of the
practice rather than a generic widget:
- Warm paper-white background with a faint graph-paper grid behind everything.
- Near-black "ink" text; a single muted **blueprint-blue** accent for the active skill
  button and primary actions.
- Constraint *values* set in a clean serif/display face (they read as "the brief");
  labels, timer, and buttons in a quiet sans/mono.
- Calm, uncluttered, high contrast. Light mode only.

The screen is deliberately **bare**: no streak counter, no date marker, no extra chrome.

## Robustness & edge cases

- **Storage blocked** (`file://` + Safari) → silent in-memory fallback; session still works.
- **Missing tip** → card shows the label alone.
- **Too few items at a skill level** → anti-repeat safety valve keeps the pool ≥ 1. If a
  level ever had zero entries, the roll falls back to harder items rather than failing.
- **First-ever load** (empty history) → rolls normally; no special case.
- **Long tip text** → wraps; the card grows; layout holds.
- **Timer** never counts below zero; "Free draw" disables timer controls; rerolling
  mid-timer leaves the timer untouched.
- **Malformed `data.js` entries** → skipped at load with a `console.warn`.

## Verification

No test framework (proportionate to a local static tool). Instead:

- The roll logic lives in pure functions isolated from the DOM.
- `test.html` loads `data.js` + `app.js` and runs assertions against those functions,
  printing pass/fail to the screen. It covers, at minimum:
  - A Beginner roll never contains a `hard` value in any category.
  - An Intermediate roll never contains a `hard` value.
  - An Advanced roll may contain any difficulty.
  - Anti-repeat actually excludes the most recent rolls.
  - A roll with empty history succeeds.
  - A malformed entry is skipped (not rolled).

## Out of scope / future

- Per-category reroll.
- Dark mode.
- Deployment, PWA, offline install, phone-friendly access.
- Streak, history, archive, sharing.
- Curated themed sets (vs. pure random).
- Auto-balanced difficulty across the combo (current model gates each value by skill).
