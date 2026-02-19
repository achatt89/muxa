const test = require('node:test');
const assert = require('node:assert/strict');
const { request } = require('../helpers/http');

test('Fallback resilience: primary failure routes to fallback provider', async () => {
  const res = await request({
    method: 'POST',
    path: '/v1/messages',
    body: {
      messages: [{ role: 'user', content: 'trigger fallback' }],
      debug: { forceProviderFailure: true }
    },
    configOptions: {
      env: {
        NODE_ENV: 'test',
        MUXA_PRIMARY_PROVIDER: 'openai',
        OPENAI_API_KEY: 'sk-test',
        MUXA_FALLBACK_PROVIDER: 'anthropic',
        ANTHROPIC_API_KEY: 'test-key',
        MUXA_ROUTING_STRATEGY: 'hybrid'
      }
    }
  });

  assert.equal(res.statusCode, 200);
  assert.equal(res.headers['x-muxa-route'], 'fallback');
});
