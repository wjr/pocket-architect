// tests/pa.test.js — zero-dependency test runner. Works under Node and in the browser.
function runAllTests(PA, DATA) {
  const results = [];
  function check(name, cond) { results.push({ name, pass: !!cond }); }
  function eq(name, actual, expected) {
    const pass = JSON.stringify(actual) === JSON.stringify(expected);
    results.push({ name: name + ' (got ' + JSON.stringify(actual) + ')', pass });
  }
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

  // --- data.js integrity (uses the real DATA passed in) ---
  const DIFFICULTIES = PA.DIFFICULTIES; // local alias so the verbatim block below resolves under Node
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
