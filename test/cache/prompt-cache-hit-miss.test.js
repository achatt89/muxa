const test = require('node:test');
const assert = require('node:assert/strict');
const { PromptCache } = require('../../src/cache/prompt-cache');

test('prompt cache hits repeated prompts', () => {
  const cache = new PromptCache({ ttlMs: 1000 });
  cache.set('hello', 'openai', { text: 'world' });
  const hit = cache.get('hello', 'openai');
  assert.deepEqual(hit, { text: 'world' });
});
