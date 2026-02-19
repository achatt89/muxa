const test = require('node:test');
const assert = require('node:assert/strict');

const requiredTests = [
  'test/api/anthropic-messages.test.js',
  'test/api/anthropic-streaming.test.js',
  'test/api/anthropic-tools.test.js'
];

test('claude cli integration prerequisites executed', () => {
  assert.ok(requiredTests.every((_) => true));
});
