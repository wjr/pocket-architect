// data.js — content only. No logic lives here.
const DATA = {
  building: [],
  placement: [],
  perspective: []
};

if (typeof window !== 'undefined') window.DATA = DATA;
if (typeof module !== 'undefined' && module.exports) module.exports = { DATA };
