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

  validateData(data) {
    const out = {};
    for (const cat of ['building', 'placement', 'perspective']) {
      out[cat] = (data[cat] || []).filter((e) => {
        if (PA.isWellFormed(e)) return true;
        console.warn('[Pocket Architect] skipping malformed entry:', e);
        return false;
      });
    }
    return out;
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
  if (!document.getElementById('cards')) return; // no app DOM (e.g. test.html) — engine globals only
  const storage = PA.makeStorage();
  const CATS = ['building', 'perspective', 'placement'];
  const LABELS = { building: 'Building', perspective: 'Perspective', placement: 'Placement' };

  const state = {
    skill: PA.SKILL_LEVELS.indexOf(storage.get('pa.skill', 'beginner')) !== -1
      ? storage.get('pa.skill', 'beginner') : 'beginner',
    history: PA.emptyHistory(),
    roll: null,
    timer: { preset: 15, remaining: 15 * 60, running: false, intervalId: null }
  };
  const data = PA.validateData(window.DATA); // validated once: drop malformed entries with a warn
  // Restore history defensively; replace with empty if shape is wrong.
  const savedHistory = storage.get('pa.history', null);
  if (savedHistory && savedHistory.building && savedHistory.placement && savedHistory.perspective) {
    state.history = savedHistory;
  }

  const cardsEl = document.getElementById('cards');
  const rerollBtn = document.getElementById('reroll');
  const skillBtns = Array.prototype.slice.call(document.querySelectorAll('.skill-btn'));
  const timerDisplay = document.getElementById('timer-display');
  const startBtn = document.getElementById('timer-start');
  const resetBtn = document.getElementById('timer-reset');
  const presetBtns = Array.prototype.slice.call(document.querySelectorAll('.preset-btn'));

  function persist() {
    storage.set('pa.skill', state.skill);
    storage.set('pa.history', state.history);
  }

  function doRoll() {
    state.roll = PA.rollAll(state.skill, state.history, data);
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

  for (const btn of skillBtns) {
    btn.addEventListener('click', function () {
      state.skill = btn.dataset.skill;
      persist();
      doRoll(); // auto-reroll so the prompt matches the new level immediately
    });
  }
  rerollBtn.addEventListener('click', doRoll);

  for (const btn of presetBtns) {
    btn.addEventListener('click', function () {
      applyPreset(Number(btn.dataset.minutes));
    });
  }
  startBtn.addEventListener('click', startTimer);
  resetBtn.addEventListener('click', resetTimer);

  applyPreset(state.timer.preset); // render the initial 15:00 and highlight the 15 preset

  doRoll(); // auto-roll on load — never show a blank screen
}
