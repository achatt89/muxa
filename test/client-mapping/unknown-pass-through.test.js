const test = require('node:test');
const assert = require('node:assert/strict');
const { mapToolCall } = require('../../packages/client-mapping');

test('unknown client preserves canonical mapping', () => {
  const result = mapToolCall('some-client', { name: 'workspace.search', arguments: { query: 'baz' } });
  assert.equal(result.name, 'workspace.search');
});
