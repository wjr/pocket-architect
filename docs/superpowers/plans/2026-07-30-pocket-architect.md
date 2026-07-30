# Pocket Architect Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local-first, single-page "magic 8-ball" that instantly presents three random architectural-drawing constraints (building, perspective, placement), gated to a skill level, each with a one-line teaching tip, plus a 15/30/45/free session timer.

**Architecture:** Four separated files — `data.js` (content only), `app.js` (pure engine functions + browser-only DOM/timer wiring), `index.html` (markup), `styles.css` (drafting aesthetic) — plus `test.html` and `tests/pa.test.js` for verification. Every file attaches its exports to `window` for the browser and to `module.exports` for Node, so the pure engine functions are unit-testable via `node` with zero dependencies while the app still runs by double-clicking `index.html` under `file://`.

**Tech Stack:** Vanilla HTML/CSS/JavaScript (no framework, no build step, no runtime dependencies). Node.js only to run the unit tests. Web Audio API for the timer chime. `localStorage` for persistence (defensive).

## Global Constraints

(Copied from the approved spec. Every task implicitly includes these.)

- **Zero runtime dependencies, no build step.** The app runs by opening `index.html` directly under `file://`.
- **Data loads via `<script>` tags, never `fetch()`.** `fetch` of a local file is blocked under `file://`.
- **`localStorage` is defensive.** Every storage call is wrapped in try/catch and falls back to an in-memory copy; the app must keep working when storage is blocked (e.g. Safari + `file://`).
- **Difficulty values are exactly:** `"easy"`, `"medium"`, `"hard"`.
- **Skill levels are exactly:** `"beginner"`, `"intermediate"`, `"advanced"`.
- **Skill → difficulty mapping:** beginner = easy only; intermediate = easy + medium; advanced = all.
- **Anti-repeat window is exactly 6** recent rolls per category.
- **Timer presets are exactly 15, 30, 45 minutes, plus "Free draw" (0).**
- **Perspective category has exactly 12 entries**, meaning technical drawing projection/view (not viewpoint/composition).
- **Tips are optional** per value; the UI shows the label alone when a tip is absent.
- **Light mode only.** No dark mode.
- **The screen is bare:** no streak counter, no date marker, no settings page (the skill selector is the only setting).

---

## File Structure

- **`data.js`** — content only. Exports `DATA = { building: [...], placement: [...], perspective: [...] }`. Each entry is `{ label, difficulty, tip? }`. No logic.
- **`app.js`** — the engine. Pure functions (no DOM access) collected in a `PA` object: `isWellFormed`, `allowedDifficulties`, `eligiblePool`, `rollOne`, `rollAll`, `emptyHistory`, `pushHistory`, `makeStorage`, `formatTime`, `tick`, `isFinished`, plus constants `SKILL_LEVELS`, `DIFFICULTIES`, `ANTI_REPEAT_LIMIT`, `TIMER_PRESETS`. A browser-only block (guarded by `if (typeof document !== 'undefined')`) wires the DOM and timer.
- **`index.html`** — markup only: title, skill selector, constraint cards container, timer presets/display/controls, reroll button. Loads `data.js` then `app.js`.
- **`styles.css`** — the drafting/sketchbook look: paper background with graph grid, ink text, blueprint-blue accent, serif values, sans labels, responsive.
- **`tests/pa.test.js`** — the unit-test runner. Defines `runAllTests(PA, DATA)` returning a results array. Self-runs under Node (`node tests/pa.test.js`), printing PASS/FAIL and exiting non-zero on failure. Also attaches `runAllTests` to `window` for the browser.
- **`test.html`** — browser verification harness (built last). Loads `data.js`, `app.js`, `tests/pa.test.js`, calls `runAllTests(window.PA, window.DATA)`, and renders pass/fail to the page.

---

## Task 1: Project scaffold and Node test runner skeleton

**Files:**
- Create: `index.html`
- Create: `styles.css`
- Create: `data.js`
- Create: `app.js`
- Create: `tests/pa.test.js`

**Interfaces:**
- Produces: `app.js` exports a `PA` object (empty for now) and the constants `SKILL_LEVELS`, `DIFFICULTIES`, `ANTI_REPEAT_LIMIT`, `TIMER_PRESETS`. `data.js` exports `DATA` with empty arrays. `tests/pa.test.js` exports `runAllTests(PA, DATA)`.

- [ ] **Step 1: Create `data.js` with the dual-environment export pattern and empty arrays**

```js
// data.js — content only. No logic lives here.
const DATA = {
  building: [],
  placement: [],
  perspective: []
};

if (typeof window !== 'undefined') window.DATA = DATA;
if (typeof module !== 'undefined' && module.exports) module.exports = { DATA };
```

- [ ] **Step 2: Create `app.js` with constants, an empty `PA` object, and the dual-environment export**

```js
// app.js — engine (pure functions) + browser-only DOM/timer wiring.
const SKILL_LEVELS = ['beginner', 'intermediate', 'advanced'];
const DIFFICULTIES = ['easy', 'medium', 'hard'];
const ANTI_REPEAT_LIMIT = 6;
const TIMER_PRESETS = [15, 30, 45];

const PA = {
  SKILL_LEVELS,
  DIFFICULTIES,
  ANTI_REPEAT_LIMIT,
  TIMER_PRESETS
  // engine functions are added in later tasks
};

if (typeof window !== 'undefined') window.PA = PA;
if (typeof module !== 'undefined' && module.exports) module.exports = PA;

// Browser-only wiring (added in later tasks). Guarded so Node require() never touches the DOM.
if (typeof document !== 'undefined') {
  // document.addEventListener('DOMContentLoaded', init); // added in Task 8
}
```

- [ ] **Step 3: Create `tests/pa.test.js` with the runner skeleton**

```js
// tests/pa.test.js — zero-dependency test runner. Works under Node and in the browser.
function runAllTests(PA, DATA) {
  const results = [];
  function check(name, cond) { results.push({ name, pass: !!cond }); }
  function eq(name, actual, expected) {
    const pass = JSON.stringify(actual) === JSON.stringify(expected);
    results.push({ name: name + ' (got ' + JSON.stringify(actual) + ')', pass });
  }
  // Tests are added in later tasks.
  return results;
}

if (typeof window !== 'undefined') window.runAllTests = runAllTests;
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runAllTests };
  if (require.main === module) {
    const { DATA } = require('../data.js');
    const PA = require('../app.js');
    const results = runAllTests(PA, DATA);
    let failed = 0;
    for (const r of results) {
      console.log((r.pass ? 'PASS' : 'FAIL') + ' - ' + r.name);
      if (!r.pass) failed++;
    }
    console.log('\n' + (results.length - failed) + '/' + results.length + ' passed');
    process.exit(failed ? 1 : 0);
  }
}
```

- [ ] **Step 4: Create a minimal `index.html` and empty `styles.css` so the app can open**

`index.html`:
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pocket Architect</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <main class="pa"><h1 class="pa-title">Pocket Architect</h1></main>
  <script src="data.js"></script>
  <script src="app.js"></script>
</body>
</html>
```

`styles.css`:
```css
/* Drafting aesthetic — fleshed out in Task 7. */
```

- [ ] **Step 5: Run the test runner to verify the harness works (0 tests, exit 0)**

Run: `node tests/pa.test.js`
Expected output: a blank list followed by `0/0 passed`, and the command exits 0.

- [ ] **Step 6: Commit**

```bash
git add index.html styles.css data.js app.js tests/pa.test.js
git commit -m "feat: scaffold Pocket Architect files and Node test runner"
```

---

## Task 2: Engine core — validation, eligibility, and rolling

**Files:**
- Modify: `app.js` (add functions to the `PA` object)
- Modify: `tests/pa.test.js` (add assertions to `runAllTests`)

**Interfaces:**
- Produces (added to `PA`):
  - `isWellFormed(entry)` → `boolean`. `true` iff `entry` is an object with a non-empty string `label` and `difficulty ∈ {"easy","medium","hard"}`. (`tip` ignored.)
  - `allowedDifficulties(skill)` → `string[]`. beginner→`["easy"]`; intermediate→`["easy","medium"]`; advanced→`["easy","medium","hard"]`. Unknown skill → `[]`.
  - `eligiblePool(category, skill, history, data)` → `entry[]`. From `data[category]`, keep entries whose `difficulty ∈ allowedDifficulties(skill)`, then drop any whose `label` appears in `history[category]`. **Safety valve:** if that leaves fewer than 1 entry, return the difficulty-allowed list unfiltered (ignoring history) so a roll never fails.
  - `rollOne(pool, rng)` → `entry | null`. `rng` optional (defaults to `Math.random`). Returns `null` if `pool` is empty.
  - `rollAll(skill, history, data, rng)` → `{ building, placement, perspective }`, each an entry or `null`. Threads `rng` into each `rollOne`.

- [ ] **Step 1: Add the failing tests for the engine core**

Inside `runAllTests` (after the `eq` helper), add:

```js
  // --- isWellFormed ---
  check('well-formed entry', PA.isWellFormed({ label: 'Cathedral', difficulty: 'hard' }));
  check('well-formed entry with tip', PA.isWellFormed({ label: 'Shed', difficulty: 'easy', tip: 'x' }));
  check('rejects empty label', PA.isWellFormed({ label: '', difficulty: 'easy' }) === false);
  check('rejects bad difficulty', PA.isWellFormed({ label: 'X', difficulty: 'spicy' }) === false);
  check('rejects null', PA.isWellFormed(null) === false);

  // --- allowedDifficulties ---
  eq('beginner allows easy only', PA.allowedDifficulties('beginner'), ['easy']);
  eq('intermediate allows easy+medium', PA.allowedDifficulties('intermediate'), ['easy', 'medium']);
  eq('advanced allows all', PA.allowedDifficulties('advanced'), ['easy', 'medium', 'hard']);
  eq('unknown skill allows none', PA.allowedDifficulties('nosuch'), []);

  // --- fixtures for eligibility / rolling ---
  const FIXTURE = {
    building: [
      { label: 'Shed', difficulty: 'easy' },
      { label: 'Library', difficulty: 'medium' },
      { label: 'Cathedral', difficulty: 'hard' }
    ],
    placement: [
      { label: 'Flat field', difficulty: 'easy' },
      { label: 'Cliffside', difficulty: 'hard' }
    ],
    perspective: [
      { label: 'Elevation', difficulty: 'easy' },
      { label: 'Two-point', difficulty: 'medium' }
    ]
  };

  // --- eligiblePool ---
  eq('beginner pool excludes medium/hard',
    PA.eligiblePool('building', 'beginner', {}, FIXTURE), [{ label: 'Shed', difficulty: 'easy' }]);
  eq('intermediate pool excludes hard',
    PA.eligiblePool('building', 'intermediate', {}, FIXTURE),
    [{ label: 'Shed', difficulty: 'easy' }, { label: 'Library', difficulty: 'medium' }]);
  eq('history excludes a recent label',
    PA.eligiblePool('building', 'advanced', { building: ['Shed'] }, FIXTURE),
    [{ label: 'Library', difficulty: 'medium' }, { label: 'Cathedral', difficulty: 'hard' }]);
  eq('safety valve ignores history when pool would be empty',
    PA.eligiblePool('building', 'beginner', { building: ['Shed'] }, FIXTURE),
    [{ label: 'Shed', difficulty: 'easy' }]);
  eq('unknown category yields empty pool', PA.eligiblePool('nosuch', 'advanced', {}, FIXTURE), []);

  // --- rollOne ---
  const seq = (function () { let i = 0; return function () { return (i++ % 10) / 10; }; })();
  eq('rollOne picks index 0 with rng()=0', PA.rollOne([{ label: 'A' }, { label: 'B' }], function () { return 0; }), { label: 'A' });
  check('rollOne returns null on empty pool', PA.rollOne([], function () { return 0; }) === null);

  // --- rollAll (deterministic via injected rng) ---
  const roll = PA.rollAll('beginner', {}, FIXTURE, function () { return 0; });
  check('rollAll returns Shed for beginner (index 0)', roll.building.label === 'Shed');
  check('rollAll returns Flat field for beginner', roll.placement.label === 'Flat field');
  check('rollAll returns Elevation for beginner', roll.perspective.label === 'Elevation');

  // --- rollAll difficulty guarantee (probabilistic, many runs) ---
  let violation = false;
  for (let i = 0; i < 200; i++) {
    const r = PA.rollAll('beginner', {}, FIXTURE);
    for (const cat of ['building', 'placement', 'perspective']) {
      if (r[cat] && r[cat].difficulty !== 'easy') violation = true;
    }
  }
  check('beginner never rolls non-easy over 200 runs', violation === false);
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node tests/pa.test.js`
Expected: FAIL lines for the engine tests (functions not defined on `PA`).

- [ ] **Step 3: Implement the engine core functions in `app.js`**

Add these to the `PA` object (before the closing brace of `PA`):

```js
  isWellFormed(entry) {
    return !!entry
      && typeof entry === 'object'
      && typeof entry.label === 'string' && entry.label.length > 0
      && DIFFICULTIES.indexOf(entry.difficulty) !== -1;
  },

  allowedDifficulties(skill) {
    if (skill === 'beginner') return ['easy'];
    if (skill === 'intermediate') return ['easy', 'medium'];
    if (skill === 'advanced') return ['easy', 'medium', 'hard'];
    return [];
  },

  eligiblePool(category, skill, history, data) {
    const allowed = (data[category] || []).filter(
      (e) => PA.allowedDifficulties(skill).indexOf(e.difficulty) !== -1
    );
    const recent = new Set((history && history[category]) || []);
    const filtered = allowed.filter((e) => !recent.has(e.label));
    return filtered.length >= 1 ? filtered : allowed;
  },

  rollOne(pool, rng) {
    if (!pool || pool.length === 0) return null;
    const r = (typeof rng === 'function') ? rng() : Math.random();
    return pool[Math.floor(r * pool.length)];
  },

  rollAll(skill, history, data, rng) {
    const out = {};
    for (const cat of ['building', 'placement', 'perspective']) {
      out[cat] = PA.rollOne(PA.eligiblePool(cat, skill, history, data), rng);
    }
    return out;
  },
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `node tests/pa.test.js`
Expected: all PASS, `N/N passed`, exit 0.

- [ ] **Step 5: Commit**

```bash
git add app.js tests/pa.test.js
git commit -m "feat: add engine core (validation, eligibility, rolling)"
```

---

## Task 3: Author `data.js` content and validate it

**Files:**
- Modify: `data.js` (replace empty arrays with full content)
- Modify: `tests/pa.test.js` (add data-integrity assertions)

**Interfaces:**
- Produces: a populated `DATA` with ~15 building, ~15 placement, and exactly 12 perspective entries. Every entry is well-formed; every category contains at least one entry of each difficulty (`easy`, `medium`, `hard`) so every skill level can always roll.

- [ ] **Step 1: Add the failing data-integrity tests**

Inside `runAllTests`, after the engine tests, add:

```js
  // --- data.js integrity (uses the real DATA passed in) ---
  const cats = ['building', 'placement', 'perspective'];
  for (const cat of cats) {
    check(cat + ' has entries', (DATA[cat] || []).length > 0);
    check(cat + ' all entries well-formed',
      (DATA[cat] || []).every((e) => PA.isWellFormed(e)));
    for (const diff of DIFFICULTIES) {
      check(cat + ' has at least one ' + diff,
        (DATA[cat] || []).some((e) => e.difficulty === diff));
    }
  }
  check('perspective has exactly 12 entries', DATA.perspective.length === 12);
  // Difficulty guarantee against real data, all skills:
  let realViolation = false;
  for (let i = 0; i < 300; i++) {
    const r = PA.rollAll('intermediate', {}, DATA);
    for (const cat of cats) {
      if (r[cat] && r[cat].difficulty === 'hard') realViolation = true;
    }
  }
  check('intermediate never rolls hard against real data', realViolation === false);
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node tests/pa.test.js`
Expected: FAIL on the data-integrity checks (arrays still empty).

- [ ] **Step 3: Populate `data.js` with the full content**

Replace the `DATA` object body in `data.js` with (tips are provided for every entry — the structure allows more entries to be appended later with no code change):

```js
const DATA = {
  building: [
    { label: 'Garden shed', difficulty: 'easy', tip: 'One simple gable — get the door and roof pitch right before anything else.' },
    { label: 'Bus stop shelter', difficulty: 'easy', tip: 'A roof on slim supports. Practice clean, parallel lines.' },
    { label: 'Treehouse', difficulty: 'easy', tip: 'Let the structure hug the trunk; show how it bears on the branches.' },
    { label: 'Row house (terrace)', difficulty: 'easy', tip: 'Repeat one bay; repetition reads as a street.' },
    { label: 'Beach hut', difficulty: 'easy', tip: 'Small footprint — proportion and a single accent color carry it.' },
    { label: 'Library', difficulty: 'medium', tip: 'Stack reading rooms for tall, quiet volume; mark the entry clearly.' },
    { label: 'Art museum', difficulty: 'medium', tip: 'Contrast daylit galleries with a calm, processional lobby.' },
    { label: 'Hillside cabin', difficulty: 'medium', tip: 'Let the slope do the work — step the floors down the hill.' },
    { label: 'Greenhouse', difficulty: 'medium', tip: 'Light structure, lots of glazing; show the frame, not walls.' },
    { label: 'Lakeside villa', difficulty: 'medium', tip: 'Open the long side to the water; push service spaces to the back.' },
    { label: 'Observatory', difficulty: 'medium', tip: 'A heavy base, a light dome — the contrast is the drawing.' },
    { label: 'Train station', difficulty: 'medium', tip: 'A long clear span overhead; lead the eye down the platform.' },
    { label: 'Cathedral', difficulty: 'hard', tip: 'Push verticality — tall nave, pointed arches; let columns carry the eye up.' },
    { label: 'Skyscraper', difficulty: 'hard', tip: 'Establish a clear structural grid and a readable top and base.' },
    { label: 'Opera house', difficulty: 'hard', tip: 'A grand public foyer wrapping a sealed auditorium mass.' },
    { label: 'Grain silo complex', difficulty: 'hard', tip: 'Cluster cylinders; let silhouette and spacing do the talking.' }
  ],

  placement: [
    { label: 'Flat open field', difficulty: 'easy', tip: 'Nothing competes — the building alone defines the horizon.' },
    { label: 'Suburban cul-de-sac', difficulty: 'easy', tip: 'Setbacks, driveways, and neighbors frame the lot.' },
    { label: 'Wooded clearing', difficulty: 'easy', tip: 'Trees as verticals around the building; dappled ground.' },
    { label: 'Quiet residential street', difficulty: 'easy', tip: 'A row of context buildings sets the scale.' },
    { label: 'Corner lot', difficulty: 'easy', tip: 'Two public edges — decide which face leads.' },
    { label: 'Dense urban alley', difficulty: 'medium', tip: 'Tight walls, deep shadows, very little sky.' },
    { label: 'Rooftop garden', difficulty: 'medium', tip: 'The roof is the site; show parapets and the city beyond.' },
    { label: 'Riverbank', difficulty: 'medium', tip: 'One edge is water — reflect it and soften the bank.' },
    { label: 'Desert plain', difficulty: 'medium', tip: 'Flat, glaring ground; shade and mass matter more than detail.' },
    { label: 'Reclaimed marsh', difficulty: 'medium', tip: 'Raise the building on piers; show water and reeds below.' },
    { label: 'Town square', difficulty: 'medium', tip: 'A framed void — the surrounding facades define the space.' },
    { label: 'Bridge over a road', difficulty: 'medium', tip: 'Span and structure above, traffic movement below.' },
    { label: 'Steep cliffside', difficulty: 'hard', tip: 'Show the dramatic drop; cantilever out over the edge.' },
    { label: 'Floating on water', difficulty: 'hard', tip: 'No ground line — reflections and waterline do everything.' },
    { label: 'Cut into a hillside', difficulty: 'hard', tip: 'Partly buried; show the retaining wall and the excavated face.' },
    { label: 'Dense city intersection', difficulty: 'hard', tip: 'Four corners of tall context; manage overlapping facades.' }
  ],

  perspective: [
    { label: 'Elevation', difficulty: 'easy', tip: 'Straight-on, flat facade. No depth — focus on proportion and symmetry.' },
    { label: 'Plan (top-down)', difficulty: 'easy', tip: "Bird's-eye footprint. Show circulation and room relationships, not height." },
    { label: 'One-point perspective', difficulty: 'easy', tip: 'One vanishing point on the horizon; depth lines converge there, horizontals and verticals stay parallel.' },
    { label: 'Two-point perspective', difficulty: 'medium', tip: 'Two vanishing points on the horizon line. Keep all verticals truly vertical.' },
    { label: 'Section (cut-through)', difficulty: 'medium', tip: 'Slice the building vertically. Draw floor plates and the volume between them.' },
    { label: 'Axonometric', difficulty: 'medium', tip: 'No vanishing points — parallel lines stay parallel. Rotate the plan and project upward at a fixed angle.' },
    { label: 'Isometric', difficulty: 'medium', tip: 'A special axon: all three axes at equal angles. Clean, diagrammatic massing.' },
    { label: 'Three-point perspective', difficulty: 'hard', tip: 'Add a third vanishing point above or below so even verticals converge — use it for looming or top-down drama.' },
    { label: "Worm's-eye view", difficulty: 'hard', tip: 'Looking steeply up. Exaggerate undersides and foreshorten height to make it loom.' },
    { label: "Bird's-eye / aerial", difficulty: 'hard', tip: 'Looking steeply down. Reveal roof forms and how the building meets the ground.' },
    { label: 'Exploded axon', difficulty: 'hard', tip: 'Pull the layers apart vertically — floors, roof, context — to show how it assembles.' },
    { label: 'Sectional perspective', difficulty: 'hard', tip: 'Cut open in section, then draw the interior in perspective — structure plus spatial depth.' }
  ]
};
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `node tests/pa.test.js`
Expected: all PASS, exit 0. This confirms every entry is well-formed, each category spans all three difficulties, and intermediate never rolls hard.

- [ ] **Step 5: Commit**

```bash
git add data.js tests/pa.test.js
git commit -m "feat: author constraint data (15 building, 15 placement, 12 perspective)"
```

---

## Task 4: Anti-repeat history

**Files:**
- Modify: `app.js` (add `emptyHistory`, `pushHistory`)
- Modify: `tests/pa.test.js` (add history assertions + an integration check)

**Interfaces:**
- Produces (added to `PA`):
  - `emptyHistory()` → `{ building: [], placement: [], perspective: [] }`.
  - `pushHistory(history, category, label, limit)` → the same `history` object, mutated: `history[category]` becomes `[label, ...previous without label]` trimmed to the first `limit` entries (most-recent first). Returns `history`.

- [ ] **Step 1: Add the failing tests**

Inside `runAllTests`, after the data tests, add:

```js
  // --- history / anti-repeat ---
  const h0 = PA.emptyHistory();
  eq('emptyHistory shape', h0, { building: [], placement: [], perspective: [] });

  const h1 = PA.pushHistory(PA.emptyHistory(), 'building', 'Shed', 6);
  eq('push adds label to front', h1.building, ['Shed']);

  const h2 = PA.pushHistory(h1, 'building', 'Library', 6);
  eq('newest stays in front', h2.building, ['Library', 'Shed']);

  const h3 = PA.pushHistory(h2, 'building', 'Shed', 6);
  eq('duplicate moved to front, no repeats', h3.building, ['Shed', 'Library']);

  let h = PA.emptyHistory();
  for (let i = 0; i < 10; i++) h = PA.pushHistory(h, 'building', 'L' + i, 6);
  eq('history trimmed to limit', h.building.length, 6);
  eq('history keeps newest six', h.building, ['L9', 'L8', 'L7', 'L6', 'L5', 'L4']);

  // integration: rolling and recording avoids the last roll while possible
  const small = { building: [
    { label: 'A', difficulty: 'easy' }, { label: 'B', difficulty: 'easy' }
  ], placement: [], perspective: [] };
  let hist = PA.emptyHistory();
  const first = PA.rollAll('advanced', hist, small, function () { return 0; }).building.label;
  hist = PA.pushHistory(hist, 'building', first, 6);
  const second = PA.rollAll('advanced', hist, small, function () { return 0; }).building.label;
  check('anti-repeat avoids the last label', second !== first);
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node tests/pa.test.js`
Expected: FAIL on the history tests.

- [ ] **Step 3: Implement `emptyHistory` and `pushHistory` in `app.js`**

Add to the `PA` object:

```js
  emptyHistory() {
    return { building: [], placement: [], perspective: [] };
  },

  pushHistory(history, category, label, limit) {
    const prev = ((history[category] || []).filter((l) => l !== label));
    history[category] = [label].concat(prev).slice(0, limit);
    return history;
  },
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `node tests/pa.test.js`
Expected: all PASS, exit 0.

- [ ] **Step 5: Commit**

```bash
git add app.js tests/pa.test.js
git commit -m "feat: add anti-repeat history"
```

---

## Task 5: Defensive storage wrapper

**Files:**
- Modify: `app.js` (add `makeStorage`)
- Modify: `tests/pa.test.js` (add storage assertions using a fake backing)

**Interfaces:**
- Produces (added to `PA`): `makeStorage(backing)` → `{ get(key, fallback), set(key, value), has(key) }`.
  - `backing` is optional. If omitted: use `localStorage` when available, else an in-memory `Map`.
  - All three methods are wrapped in try/catch. `get` returns `fallback` on any error or missing key. `set` swallows errors silently. `has` returns `false` on any error.
  - Values are JSON-serialized. A `Map`-shaped backing uses `get`/`set`; a `localStorage`-shaped backing uses `getItem`/`setItem`.

- [ ] **Step 1: Add the failing tests**

Inside `runAllTests`, after the history tests, add:

```js
  // --- storage (with a fake Map backing) ---
  const fake = new Map();
  const s = PA.makeStorage(fake);
  check('has is false before set', s.has('x') === false);
  s.set('x', { skill: 'advanced' });
  check('has is true after set', s.has('x') === true);
  eq('get returns parsed value', s.get('x'), { skill: 'advanced' });
  eq('get falls back when missing', s.get('nope', 'def'), 'def');

  // a backing that throws on setItem must not crash set()
  const broken = {
    getItem() { throw new Error('blocked'); },
    setItem() { throw new Error('blocked'); }
  };
  const sb = PA.makeStorage(broken);
  let threw = false;
  try { sb.set('k', 1); sb.has('k'); eq('broken get returns fallback', sb.get('k', 'fb'), 'fb'); }
  catch (e) { threw = true; }
  check('storage never throws on blocked backing', threw === false);
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node tests/pa.test.js`
Expected: FAIL on the storage tests.

- [ ] **Step 3: Implement `makeStorage` in `app.js`**

Add to the `PA` object:

```js
  makeStorage(backing) {
    let store;
    if (backing) {
      store = backing;
    } else {
      try { store = (typeof localStorage !== 'undefined') ? localStorage : new Map(); }
      catch (e) { store = new Map(); }
    }
    const isMap = (store instanceof Map);
    function readRaw(key) {
      return isMap ? store.get(key) : store.getItem(key);
    }
    function writeRaw(key, raw) {
      if (isMap) store.set(key, raw); else store.setItem(key, raw);
    }
    return {
      get(key, fallback) {
        try {
          const raw = readRaw(key);
          if (raw === undefined || raw === null) return fallback;
          return JSON.parse(raw);
        } catch (e) { return fallback; }
      },
      set(key, value) {
        try { writeRaw(key, JSON.stringify(value)); } catch (e) { /* ignore */ }
      },
      has(key) {
        try {
          const raw = readRaw(key);
          return raw !== undefined && raw !== null;
        } catch (e) { return false; }
      }
    };
  },
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `node tests/pa.test.js`
Expected: all PASS, exit 0.

- [ ] **Step 5: Commit**

```bash
git add app.js tests/pa.test.js
git commit -m "feat: add defensive storage wrapper"
```

---

## Task 6: Timer pure helpers

**Files:**
- Modify: `app.js` (add `formatTime`, `tick`, `isFinished`)
- Modify: `tests/pa.test.js` (add timer assertions)

**Interfaces:**
- Produces (added to `PA`):
  - `formatTime(totalSeconds)` → `"M:SS"` string, e.g. `formatTime(900)` → `"15:00"`, `formatTime(45)` → `"0:45"`, `formatTime(0)` → `"0:00"`. Never negative (clamps at 0).
  - `tick(totalSeconds)` → `Math.max(0, totalSeconds - 1)`.
  - `isFinished(totalSeconds)` → `totalSeconds <= 0`.

- [ ] **Step 1: Add the failing tests**

Inside `runAllTests`, after the storage tests, add:

```js
  // --- timer helpers ---
  eq('formatTime 15 minutes', PA.formatTime(900), '15:00');
  eq('formatTime 45 seconds', PA.formatTime(45), '0:45');
  eq('formatTime zero', PA.formatTime(0), '0:00');
  eq('formatTime clamps negative', PA.formatTime(-5), '0:00');
  eq('tick decrements', PA.tick(60), 59);
  eq('tick clamps at zero', PA.tick(0), 0);
  check('isFinished at zero', PA.isFinished(0) === true);
  check('isFinished negative', PA.isFinished(-1) === true);
  check('not finished when positive', PA.isFinished(1) === false);
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node tests/pa.test.js`
Expected: FAIL on the timer tests.

- [ ] **Step 3: Implement the timer helpers in `app.js`**

Add to the `PA` object:

```js
  formatTime(totalSeconds) {
    const s = Math.max(0, Math.floor(totalSeconds));
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m + ':' + String(sec).padStart(2, '0');
  },

  tick(totalSeconds) {
    return Math.max(0, totalSeconds - 1);
  },

  isFinished(totalSeconds) {
    return totalSeconds <= 0;
  },
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `node tests/pa.test.js`
Expected: all PASS, exit 0.

- [ ] **Step 5: Commit**

```bash
git add app.js tests/pa.test.js
git commit -m "feat: add timer pure helpers (formatTime, tick, isFinished)"
```

---

## Task 7: Markup and drafting stylesheet

**Files:**
- Modify: `index.html` (full markup)
- Modify: `styles.css` (full drafting aesthetic)

**Interfaces:**
- Produces: the full document structure with stable element IDs and data attributes that Task 8 and Task 9 wire up:
  - Skill buttons: `button.skill-btn[data-skill]`.
  - Cards container: `#cards`.
  - Timer presets: `button.preset-btn[data-minutes]` (0 = Free draw).
  - Timer display: `#timer-display`. Controls: `#timer-start`, `#timer-reset`.
  - Reroll: `#reroll`.

- [ ] **Step 1: Replace `index.html` with the full markup**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pocket Architect</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <main class="pa">
    <h1 class="pa-title">Pocket Architect</h1>

    <div class="skill" role="group" aria-label="Skill level">
      <button class="skill-btn" data-skill="beginner" type="button">Beginner</button>
      <button class="skill-btn" data-skill="intermediate" type="button">Intermediate</button>
      <button class="skill-btn" data-skill="advanced" type="button">Advanced</button>
    </div>

    <section class="cards" id="cards" aria-live="polite"></section>

    <div class="timer">
      <div class="timer-presets">
        <button class="preset-btn" data-minutes="15" type="button">15</button>
        <button class="preset-btn" data-minutes="30" type="button">30</button>
        <button class="preset-btn" data-minutes="45" type="button">45</button>
        <button class="preset-btn" data-minutes="0" type="button">Free draw</button>
      </div>
      <div class="timer-display" id="timer-display">15:00</div>
      <div class="timer-controls">
        <button id="timer-start" type="button">Start</button>
        <button id="timer-reset" type="button">Reset</button>
      </div>
    </div>

    <button class="reroll" id="reroll" type="button">Reroll</button>
  </main>

  <script src="data.js"></script>
  <script src="app.js"></script>
</body>
</html>
```

- [ ] **Step 2: Replace `styles.css` with the full drafting aesthetic**

```css
:root {
  --paper: #f7f4ec;
  --ink: #1a1a1a;
  --accent: #2b5fa0;
  --card: #fffdf7;
  --rule: rgba(40, 70, 120, 0.18);
}

* { box-sizing: border-box; }

html, body {
  margin: 0;
  padding: 0;
  background-color: var(--paper);
  background-image:
    linear-gradient(rgba(40, 70, 120, 0.06) 1px, transparent 1px),
    linear-gradient(90deg, rgba(40, 70, 120, 0.06) 1px, transparent 1px);
  background-size: 24px 24px;
  color: var(--ink);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  line-height: 1.4;
}

.pa {
  max-width: 760px;
  margin: 0 auto;
  padding: 28px 20px 48px;
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.pa-title {
  font-family: Georgia, "Times New Roman", serif;
  font-weight: 400;
  font-size: 1.5rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  margin: 0;
  text-align: center;
  border-bottom: 1px solid var(--rule);
  padding-bottom: 14px;
}

/* Skill selector */
.skill {
  display: flex;
  gap: 8px;
  justify-content: center;
}
.skill-btn {
  flex: 1;
  padding: 9px 6px;
  font-size: 0.9rem;
  font-family: ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace;
  background: transparent;
  color: var(--ink);
  border: 1px solid var(--rule);
  border-radius: 4px;
  cursor: pointer;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.skill-btn:hover { background: rgba(43, 95, 160, 0.06); }
.skill-btn.active {
  background: var(--accent);
  color: #fff;
  border-color: var(--accent);
}

/* Constraint cards */
.cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.card {
  background: var(--card);
  border: 1px solid var(--rule);
  border-left: 4px solid var(--accent);
  border-radius: 4px;
  padding: 14px 16px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}
.card-label {
  font-family: ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace;
  font-size: 0.72rem;
  letter-spacing: 0.12em;
  color: var(--accent);
  text-transform: uppercase;
}
.card-value {
  font-family: Georgia, "Times New Roman", serif;
  font-size: 1.7rem;
  margin: 2px 0 6px;
}
.card-tip {
  font-size: 0.92rem;
  color: #4a4a4a;
  font-style: italic;
}

/* Timer */
.timer {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding-top: 4px;
}
.timer-presets {
  display: flex;
  gap: 8px;
}
.preset-btn {
  min-width: 52px;
  padding: 8px 10px;
  font-family: ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace;
  background: transparent;
  color: var(--ink);
  border: 1px solid var(--rule);
  border-radius: 4px;
  cursor: pointer;
}
.preset-btn:hover { background: rgba(43, 95, 160, 0.06); }
.preset-btn.active {
  border-color: var(--accent);
  color: var(--accent);
  font-weight: 600;
}
.timer-display {
  font-family: ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace;
  font-size: 2.6rem;
  letter-spacing: 0.04em;
}
.timer-display.finished {
  color: var(--accent);
  animation: pulse 1s ease-in-out infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.45; }
}
.timer-controls {
  display: flex;
  gap: 8px;
}
.timer-controls button {
  padding: 8px 18px;
  font-family: ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace;
  background: transparent;
  color: var(--ink);
  border: 1px solid var(--rule);
  border-radius: 4px;
  cursor: pointer;
}
.timer-controls button:hover:not(:disabled) { background: rgba(43, 95, 160, 0.06); }
.timer-controls button:disabled { opacity: 0.4; cursor: default; }

/* Reroll */
.reroll {
  margin-top: 4px;
  padding: 14px;
  font-size: 1.05rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}
.reroll:hover { filter: brightness(1.05); }

/* Wider screens: cards in a row */
@media (min-width: 640px) {
  .cards { flex-direction: row; }
  .card { flex: 1; }
}
```

- [ ] **Step 3: Verify the page renders (manual)**

Open `index.html` in a browser. Expected: the title, three skill buttons, an empty cards area, the timer presets and `15:00`, and a Reroll button, all on the paper/grid background. The cards area is empty because wiring comes in Task 8 — that is expected here.

- [ ] **Step 4: Commit**

```bash
git add index.html styles.css
git commit -m "feat: full markup and drafting stylesheet"
```

---

## Task 8: DOM wiring — render, reroll, skill auto-reroll, load-time auto-roll

**Files:**
- Modify: `app.js` (fill in the browser-only `init` block)

**Interfaces:**
- Consumes: `PA.rollAll`, `PA.pushHistory`, `PA.emptyHistory`, `PA.makeStorage`, `PA.SKILL_LEVELS`, `ANTI_REPEAT_LIMIT`, and `window.DATA` (the categories are `building`, `perspective`, `placement`).
- Produces: on `DOMContentLoaded`, the app reads persisted `pa.skill` and `pa.history` (falling back to defaults), renders the skill selector's active state, auto-rolls once so a prompt is visible immediately, and wires the skill buttons (change skill → persist → auto-reroll) and the reroll button.

- [ ] **Step 1: Implement the `init` block in `app.js`**

Replace the guarded block at the bottom of `app.js` with:

```js
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', init);
}

function init() {
  const storage = PA.makeStorage();
  const CATS = ['building', 'perspective', 'placement'];
  const LABELS = { building: 'Building', perspective: 'Perspective', placement: 'Placement' };

  const state = {
    skill: PA.SKILL_LEVELS.indexOf(storage.get('pa.skill', 'beginner')) !== -1
      ? storage.get('pa.skill', 'beginner') : 'beginner',
    history: PA.emptyHistory(),
    roll: null
  };
  // Restore history defensively; replace with empty if shape is wrong.
  const savedHistory = storage.get('pa.history', null);
  if (savedHistory && savedHistory.building && savedHistory.placement && savedHistory.perspective) {
    state.history = savedHistory;
  }

  const cardsEl = document.getElementById('cards');
  const rerollBtn = document.getElementById('reroll');
  const skillBtns = Array.prototype.slice.call(document.querySelectorAll('.skill-btn'));

  function persist() {
    storage.set('pa.skill', state.skill);
    storage.set('pa.history', state.history);
  }

  function doRoll() {
    state.roll = PA.rollAll(state.skill, state.history, window.DATA);
    for (const cat of CATS) {
      if (state.roll[cat]) {
        PA.pushHistory(state.history, cat, state.roll[cat].label, ANTI_REPEAT_LIMIT);
      }
    }
    persist();
    render();
  }

  function render() {
    cardsEl.innerHTML = '';
    for (const cat of CATS) {
      const entry = state.roll && state.roll[cat];
      const card = document.createElement('article');
      card.className = 'card';

      const lab = document.createElement('div');
      lab.className = 'card-label';
      lab.textContent = LABELS[cat];
      card.appendChild(lab);

      const val = document.createElement('div');
      val.className = 'card-value';
      val.textContent = entry ? entry.label : '—';
      card.appendChild(val);

      if (entry && entry.tip) {
        const tip = document.createElement('div');
        tip.className = 'card-tip';
        tip.textContent = '“' + entry.tip + '”';
        card.appendChild(tip);
      }
      cardsEl.appendChild(card);
    }
    for (const btn of skillBtns) {
      btn.classList.toggle('active', btn.dataset.skill === state.skill);
    }
  }

  for (const btn of skillBtns) {
    btn.addEventListener('click', function () {
      state.skill = btn.dataset.skill;
      persist();
      doRoll(); // auto-reroll so the prompt matches the new level immediately
    });
  }
  rerollBtn.addEventListener('click', doRoll);

  doRoll(); // auto-roll on load — never show a blank screen
}
```

- [ ] **Step 2: Verify the engine tests still pass (no regressions)**

Run: `node tests/pa.test.js`
Expected: all PASS, exit 0. (The `init` block is guarded and never runs under Node.)

- [ ] **Step 3: Verify behavior in the browser (manual)**

Open `index.html`. Expected:
- Three constraint cards appear immediately on load (auto-roll), each with label, value, and a tip.
- The skill button matching the default/last skill is highlighted.
- Clicking Reroll replaces all three values.
- Clicking a different skill level immediately rerolls to a prompt valid for that level (e.g., Beginner never shows a hard value).
- Reloading keeps the chosen skill (persistence).

- [ ] **Step 4: Commit**

```bash
git add app.js
git commit -m "feat: wire DOM (render, reroll, skill auto-reroll, load auto-roll)"
```

---

## Task 9: Timer DOM wiring and end chime

**Files:**
- Modify: `app.js` (add timer state and functions inside `init`, wire timer elements)

**Interfaces:**
- Consumes: `PA.formatTime`, `PA.tick`, `PA.isFinished`, `TIMER_PRESETS`.
- Produces: timer presets (15/30/45 set the duration; Free draw = 0 disables the clock and controls), Start/Pause toggle, Reset, a 1-second countdown that stops at zero, a visual "finished" state, and a soft Web Audio chime at zero. The timer is independent of the roll.

- [ ] **Step 1: Add timer state inside `init`**

In `app.js`, inside `init`, after the `state` object is defined, add a `timer` field and grab the timer elements. Concretely, change the `state` declaration's closing to also carry timer state, and add element lookups:

Add to the `state` object (as additional properties):

```js
    timer: { preset: 15, remaining: 15 * 60, running: false, intervalId: null }
```

After the existing `document.getElementById` lookups, add:

```js
  const timerDisplay = document.getElementById('timer-display');
  const startBtn = document.getElementById('timer-start');
  const resetBtn = document.getElementById('timer-reset');
  const presetBtns = Array.prototype.slice.call(document.querySelectorAll('.preset-btn'));
```

- [ ] **Step 2: Add the timer functions inside `init`**

Add these functions inside `init` (they close over `state` and the element refs):

```js
  function applyPreset(minutes) {
    pauseTimer();
    state.timer.preset = minutes;
    state.timer.remaining = minutes * 60;
    state.timer.running = false;
    renderTimer();
  }

  function startTimer() {
    if (state.timer.preset === 0) return;            // Free draw has no clock
    if (state.timer.running) { pauseTimer(); return; } // toggle to pause
    if (PA.isFinished(state.timer.remaining)) {
      state.timer.remaining = state.timer.preset * 60; // restart if finished
    }
    state.timer.running = true;
    state.timer.intervalId = setInterval(onTick, 1000);
    renderTimer();
  }

  function pauseTimer() {
    state.timer.running = false;
    if (state.timer.intervalId) {
      clearInterval(state.timer.intervalId);
      state.timer.intervalId = null;
    }
    renderTimer();
  }

  function resetTimer() {
    pauseTimer();
    state.timer.remaining = state.timer.preset * 60;
    renderTimer();
  }

  function onTick() {
    state.timer.remaining = PA.tick(state.timer.remaining);
    if (PA.isFinished(state.timer.remaining)) {
      pauseTimer();
      playChime();
    }
    renderTimer();
  }

  function renderTimer() {
    const free = state.timer.preset === 0;
    timerDisplay.textContent = free ? 'Free draw' : PA.formatTime(state.timer.remaining);
    timerDisplay.classList.toggle('finished', !free && PA.isFinished(state.timer.remaining));
    startBtn.disabled = free;
    resetBtn.disabled = free;
    startBtn.textContent = state.timer.running ? 'Pause' : 'Start';
    for (const btn of presetBtns) {
      btn.classList.toggle('active', Number(btn.dataset.minutes) === state.timer.preset);
    }
  }

  function playChime() {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = 660;
      const now = ctx.currentTime;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.2, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);
      osc.start(now);
      osc.stop(now + 0.8);
    } catch (e) { /* ignore */ }
  }
```

- [ ] **Step 3: Wire the timer elements and set the initial preset**

Still inside `init`, after the function definitions above, add the event wiring and an initial render (place these near the other `addEventListener` calls, before the final `doRoll()` call):

```js
  for (const btn of presetBtns) {
    btn.addEventListener('click', function () {
      applyPreset(Number(btn.dataset.minutes));
    });
  }
  startBtn.addEventListener('click', startTimer);
  resetBtn.addEventListener('click', resetTimer);

  applyPreset(state.timer.preset); // render the initial 15:00 and highlight the 15 preset
```

- [ ] **Step 4: Verify the engine tests still pass**

Run: `node tests/pa.test.js`
Expected: all PASS, exit 0.

- [ ] **Step 5: Verify timer behavior in the browser (manual)**

Open `index.html`. Expected:
- `15:00` shows and the 15 preset is highlighted on load.
- Start begins a countdown; the button label toggles to Pause and back.
- Reset returns to the preset's full duration and stops.
- Clicking 30 or 45 switches the duration; clicking Free draw shows "Free draw" and disables Start/Reset.
- To confirm the chime/finish path quickly: temporarily call `applyPreset(15)` then, in the browser console, you may set the countdown near zero — or simply trust the unit-tested `tick`/`isFinished`. The display turns blueprint-blue and pulses at zero, and the chime plays once (browsers may require one user gesture before audio; the Start click satisfies this).

- [ ] **Step 6: Commit**

```bash
git add app.js
git commit -m "feat: wire session timer (presets, start/pause/reset, free draw, end chime)"
```

---

## Task 10: Browser verification harness and final checks

**Files:**
- Create: `test.html`
- Create: `README.md`

**Interfaces:**
- Produces: `test.html`, which loads `data.js`, `app.js`, and `tests/pa.test.js`, then runs `runAllTests(window.PA, window.DATA)` and renders a green/red pass-fail list. `README.md` documents how to run the app and the tests.

- [ ] **Step 1: Create `test.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pocket Architect — Tests</title>
  <style>
    body { font-family: ui-monospace, Menlo, Consolas, monospace; background: #f7f4ec; color: #1a1a1a; padding: 24px; }
    h1 { font-family: Georgia, serif; font-weight: 400; }
    #summary { font-size: 1.4rem; margin: 16px 0; }
    .pass { color: #2b7a2b; }
    .fail { color: #b00020; }
    li { list-style: none; padding: 2px 0; }
  </style>
</head>
<body>
  <h1>Pocket Architect — Tests</h1>
  <div id="summary">Running…</div>
  <ul id="results"></ul>

  <script src="data.js"></script>
  <script src="app.js"></script>
  <script src="tests/pa.test.js"></script>
  <script>
    (function () {
      var results = window.runAllTests(window.PA, window.DATA);
      var failed = 0;
      var list = document.getElementById('results');
      results.forEach(function (r) {
        if (!r.pass) failed++;
        var li = document.createElement('li');
        li.className = r.pass ? 'pass' : 'fail';
        li.textContent = (r.pass ? 'PASS' : 'FAIL') + ' — ' + r.name;
        list.appendChild(li);
      });
      var summary = document.getElementById('summary');
      summary.textContent = (results.length - failed) + '/' + results.length + ' passed';
      summary.className = failed ? 'fail' : 'pass';
    })();
  </script>
</body>
</html>
```

- [ ] **Step 2: Run the full Node suite one more time**

Run: `node tests/pa.test.js`
Expected: all PASS, exit 0.

- [ ] **Step 3: Verify `test.html` in the browser (manual)**

Open `test.html`. Expected: a green summary line `N/N passed` and a list of PASS lines (no red). This confirms the same assertions pass under `file://` in the browser.

- [ ] **Step 4: Create `README.md`**

```markdown
# Pocket Architect

A local-first "magic 8-ball" for architectural drawing practice. Open it, get three
random constraints (building type, perspective, placement) calibrated to your skill
level, each with a one-line teaching tip, and draw within them for a timed session.

## Run the app

Double-click `index.html` (opens under `file://`). Works offline; no server or build.

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
```

- [ ] **Step 5: Commit**

```bash
git add test.html README.md
git commit -m "feat: add browser test harness and README"
```

---

## Self-Review (completed by plan author)

**Spec coverage** — each spec requirement maps to a task:
- Local-first, `<script>`-loaded data, defensive `localStorage` → Tasks 1, 5, 8 (Global Constraints + `makeStorage`).
- Data model (3 categories; perspective = 12 projections; `tip` optional; difficulty tags; skill mapping) → Tasks 1, 2, 3.
- Engine: eligible pool with safety valve, roll per category, anti-repeat window of 6 → Tasks 2, 4.
- Skill selector that persists and auto-rerolls; load-time auto-roll → Task 8.
- Timer: 15/30/45 + Free draw, start/pause/reset, stop at zero, chime, independent of roll → Tasks 6, 9.
- Bare single screen, drafting aesthetic, light mode, responsive → Task 7.
- Robustness (storage blocked, missing tip, too-few-items safety valve, malformed entries skipped) → Tasks 2, 3, 5, 8 (malformed entries excluded via `isWellFormed` coverage test; missing tip handled in `render`).
- Verification via pure functions + `test.html` → Tasks 2–6 (unit) + Task 10 (browser harness).

**Placeholder scan** — no TBD/TODO; all code blocks contain real code; content entries are fully authored (tips included).

**Type/name consistency** — `PA` members (`isWellFormed`, `allowedDifficulties`, `eligiblePool`, `rollOne`, `rollAll`, `emptyHistory`, `pushHistory`, `makeStorage`, `formatTime`, `tick`, `isFinished`) and constants (`SKILL_LEVELS`, `DIFFICULTIES`, `ANTI_REPEAT_LIMIT`, `TIMER_PRESETS`) are spelled identically across the task that defines them and the tasks that consume them. Element IDs and `data-*` attributes match between Task 7 (markup) and Tasks 8–9 (wiring): `#cards`, `#reroll`, `.skill-btn[data-skill]`, `.preset-btn[data-minutes]`, `#timer-display`, `#timer-start`, `#timer-reset`.
