// app.js — engine (pure functions) + browser-only DOM/timer wiring.
const SKILL_LEVELS = ['beginner', 'intermediate', 'advanced'];
const DIFFICULTIES = ['easy', 'medium', 'hard'];
const ANTI_REPEAT_LIMIT = 6;
const TIMER_PRESETS = [15, 30, 45];

const PA = {
  SKILL_LEVELS,
  DIFFICULTIES,
  ANTI_REPEAT_LIMIT,
  TIMER_PRESETS,

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
  }
};

if (typeof window !== 'undefined') window.PA = PA;
if (typeof module !== 'undefined' && module.exports) module.exports = PA;

// Browser-only wiring (added in later tasks). Guarded so Node require() never touches the DOM.
if (typeof document !== 'undefined') {
  // document.addEventListener('DOMContentLoaded', init); // added in Task 8
}
