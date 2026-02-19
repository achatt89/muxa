const test = require('node:test');
const assert = require('node:assert/strict');
const { mapToolCall } = require('../../packages/client-mapping');

test('continue mapping remaps workspace search', () => {
  const result = mapToolCall('continue', { name: 'workspace.search', arguments: { query: 'bar' } });
  assert.equal(result.name, 'search_repo');
});
