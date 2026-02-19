const test = require('node:test');
const assert = require('node:assert/strict');
const { ensureEagerLoaded, cache } = require('../../src/tools/registry');

test('core categories load on boot', async () => {
  cache.clear();
  await ensureEagerLoaded();
  assert.ok(cache.has('workspace'));
});
