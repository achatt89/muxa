const test = require('node:test');
const assert = require('node:assert/strict');
const { loadCategory, cache } = require('../../src/tools/registry');

test('missing tool category returns null', async () => {
  cache.clear();
  const module = await loadCategory('unknown');
  assert.equal(module, null);
});
