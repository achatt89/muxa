const test = require('node:test');
const assert = require('node:assert/strict');
const { selectRoute } = require('../../src/routing');

const baseConfig = {
  primaryProvider: 'mock-local',
  fallbackProvider: 'openai',
  routingStrategy: 'hybrid'
};

test('simple request stays on primary provider', () => {
  const route = selectRoute({
    config: baseConfig,
    canonicalRequest: {
      messages: [{ role: 'user', content: 'hi' }],
      complexityScore: 1
    }
  });

  assert.equal(route.provider, 'mock-local');
  assert.equal(route.usedFallback, false);
});

test('complex request routes to fallback provider', () => {
  const route = selectRoute({
    config: baseConfig,
    canonicalRequest: {
      messages: [{ role: 'user', content: 'very long message'.repeat(100) }],
      complexityScore: 10
    }
  });

  assert.equal(route.provider, 'openai');
  assert.equal(route.usedFallback, true);
});
