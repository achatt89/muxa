const test = require('node:test');
const assert = require('node:assert/strict');
const { mapToolCall } = require('../../packages/client-mapping');

test('codex mapping remaps workspace tools', () => {
  const result = mapToolCall('codex', {
    name: 'workspace.search',
    arguments: { query: 'foo' }
  });

  assert.equal(result.name, 'codebase_search');
  assert.deepEqual(result.arguments, { query: 'foo' });
});
