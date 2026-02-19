const test = require('node:test');
const assert = require('node:assert/strict');
const { executeWithRouting } = require('../../src/routing');

const config = {
  primaryProvider: 'openai',
  fallbackProvider: 'anthropic',
  routingStrategy: 'hybrid'
};

test('fallback executes when primary fails', async () => {
  const result = await executeWithRouting({
    config,
    canonicalRequest: {
      messages: [{ role: 'user', content: 'trigger failure' }],
      debug: { forceProviderFailure: true, provider: 'openai' },
      complexityScore: 5
    }
  });

  assert.equal(result.route.provider, 'anthropic');
  assert.equal(result.route.usedFallback, true);
  assert.match(result.result.normalized.content, /Anthropic mock/);
});
