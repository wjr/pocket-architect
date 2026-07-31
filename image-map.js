// image-map.js — maps data.js constraint labels to generated WebP assets.
(function (root) {
  const ID_OVERRIDES = {
    'placement:Bridge over a road': 'bridge-over-road',
    'perspective:Worm\'s-eye view': 'worms-eye-view',
    'perspective:Bird\'s-eye / aerial': 'birds-eye-aerial'
  };

  function slugify(value) {
    return String(value)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  function buildImageMap(data) {
    const map = {};
    Object.keys(data || {}).forEach(function (category) {
      map[category] = {};
      data[category].forEach(function (entry) {
        const id = ID_OVERRIDES[category + ':' + entry.label] || slugify(entry.label);
        map[category][entry.label] = 'images/constraints/' + category + '/' + category + '-' + id + '.webp';
      });
    });
    return map;
  }

  root.PA_IMAGE_MAP = buildImageMap(root.DATA || {});
  if (typeof module !== 'undefined' && module.exports) module.exports = { buildImageMap };
})(typeof window !== 'undefined' ? window : globalThis);
