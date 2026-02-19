const test = require('node:test');
const assert = require('node:assert/strict');
const { loadCategory, cache } = require('../../src/tools/registry');

test('non-core categories load when requested', async () => {
  cache.clear();
  const module = await loadCategory('git');
  assert.ok(module);
  assert.ok(cache.has('git'));
});
