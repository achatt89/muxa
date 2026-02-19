const test = require('node:test');
const assert = require('node:assert/strict');
const { SemanticCache } = require('../../src/cache/semantic-cache');

test('semantic cache returns hit when similarity above threshold', () => {
  const cache = new SemanticCache({ threshold: 0.5 });
  cache.set('fix login bug quickly', { text: 'cached response' });
  const hit = cache.get('login bug fix');
  assert.ok(hit);
  assert.equal(hit.response.text, 'cached response');
});
