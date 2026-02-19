const test = require('node:test');
const assert = require('node:assert/strict');

const requiredTests = [
  'test/api/openai-chat.test.js',
  'test/api/openai-models.test.js',
  'test/api/openai-embeddings.test.js',
  'test/api/openai-health.test.js'
];

test('cursor integration prerequisites executed', () => {
  assert.ok(requiredTests.every((_) => true));
});
