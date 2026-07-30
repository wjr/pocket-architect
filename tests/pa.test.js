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
