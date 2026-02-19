const test = require('node:test');
const assert = require('node:assert/strict');
const { PromptCache } = require('../../src/cache/prompt-cache');

test('expired entries miss cache', async () => {
  const cache = new PromptCache({ ttlMs: 10 });
  cache.set('hello', 'openai', { text: 'world' });
  await new Promise((resolve) => setTimeout(resolve, 20));
  const hit = cache.get('hello', 'openai');
  assert.equal(hit, null);
});
