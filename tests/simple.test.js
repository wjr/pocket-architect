// Static smoke checks for simple.html. Runtime behavior is exercised in the browser.
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'simple.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'simple.css'), 'utf8');

const checks = [
  ['has simple page title', html.includes('<title>Pocket Architect — Simple Drawing Practice</title>')],
  ['loads simple stylesheet', html.includes('<link rel="stylesheet" href="simple.css">')],
  ['loads data before app', html.indexOf('src="data.js"') < html.indexOf('src="app.js"')],
  ['has cards mount', html.includes('id="cards"')],
  ['has reroll control', html.includes('id="reroll"')],
  ['has timer controls', html.includes('id="timer-start"') && html.includes('id="timer-reset"')],
  ['has all skill controls', ['beginner', 'intermediate', 'advanced'].every((s) => html.includes('data-skill="' + s + '"'))],
  ['has all timer presets', ['15', '30', '45', '0'].every((m) => html.includes('data-minutes="' + m + '"'))],
  ['uses raw utility styling', css.includes('.simple-app') && css.includes('background: var(--simple-paper)')],
  ['does not include the long SEO content layer', !html.includes('seo-content')]
];

let failed = 0;
for (const [name, pass] of checks) {
  console.log((pass ? 'PASS' : 'FAIL') + ' - ' + name);
  if (!pass) failed++;
}
console.log('\n' + (checks.length - failed) + '/' + checks.length + ' passed');
process.exit(failed ? 1 : 0);
