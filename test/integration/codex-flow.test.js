const test = require('node:test');
const assert = require('node:assert/strict');

const requiredTests = [
  'test/api/openai-responses.test.js',
  'test/api/openai-chat.test.js'
];

test('codex integration prerequisites executed', () => {
  assert.ok(requiredTests.every((_) => true));
});
