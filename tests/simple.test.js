// Static smoke checks for simple.html. Runtime behavior is exercised in the browser.
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'simple.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'simple.css'), 'utf8');
const imageMap = fs.readFileSync(path.join(root, 'image-map.js'), 'utf8');
const { DATA } = require(path.join(root, 'data.js'));
const { buildImageMap } = require(path.join(root, 'image-map.js'));

const checks = [
  ['has simple page title', html.includes('<title>Pocket Architect — Simple Drawing Practice</title>')],
  ['loads simple stylesheet', html.includes('<link rel="stylesheet" href="simple.css">')],
  ['loads data before app', html.indexOf('src="data.js"') < html.indexOf('src="app.js"')],
  ['loads image map between data and app', html.indexOf('src="data.js"') < html.indexOf('src="image-map.js"') && html.indexOf('src="image-map.js"') < html.indexOf('src="app.js"')],
  ['has cards mount', html.includes('id="cards"')],
  ['has reroll control', html.includes('id="reroll"')],
  ['has timer controls', html.includes('id="timer-start"') && html.includes('id="timer-reset"')],
  ['has all skill controls', ['beginner', 'intermediate', 'advanced'].every((s) => html.includes('data-skill="' + s + '"'))],
  ['has all timer presets', ['15', '30', '45', '0'].every((m) => html.includes('data-minutes="' + m + '"'))],
  ['uses raw utility styling', css.includes('.simple-app') && css.includes('background: var(--simple-paper)')],
  ['supports visual reveal overlay', html.includes('id="cards"') && css.includes('.visual-preview') && imageMap.includes('PA_IMAGE_MAP')],
  ['keeps visual inside card bounds', css.includes('height: 190px') && css.includes('overflow: hidden') && css.includes('object-fit: contain')],
  ['maps every data constraint to a WebP asset', Object.values(buildImageMap(DATA)).every((category) => Object.values(category).every((asset) => asset.endsWith('.webp') && fs.existsSync(path.join(root, asset))))],
  ['does not include the long SEO content layer', !html.includes('seo-content')]
];

let failed = 0;
for (const [name, pass] of checks) {
  console.log((pass ? 'PASS' : 'FAIL') + ' - ' + name);
  if (!pass) failed++;
}
console.log('\n' + (checks.length - failed) + '/' + checks.length + ' passed');
process.exit(failed ? 1 : 0);
