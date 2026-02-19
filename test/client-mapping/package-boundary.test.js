const test = require('node:test');
const assert = require('node:assert/strict');

test('client mapping package loads without proxy runtime deps', () => {
  const module = require('../../packages/client-mapping');
  assert.equal(typeof module.mapToolCall, 'function');
});
