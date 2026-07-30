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
  },

  emptyHistory() {
    return { building: [], placement: [], perspective: [] };
  },

  pushHistory(history, category, label, limit) {
    const prev = ((history[category] || []).filter((l) => l !== label));
    history[category] = [label].concat(prev).slice(0, limit);
    return history;
  },

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
  }
};

if (typeof window !== 'undefined') window.PA = PA;
if (typeof module !== 'undefined' && module.exports) module.exports = PA;

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
