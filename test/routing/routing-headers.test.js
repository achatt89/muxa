const test = require('node:test');
const assert = require('node:assert/strict');
const { request } = require('../helpers/http');

test('routing metadata headers are included in responses', async () => {
  const res = await request({
    method: 'POST',
    path: '/v1/messages',
    body: {
      messages: [{ role: 'user', content: 'hello' }]
    },
    configOptions: {
      overrides: {
        port: 0
      },
      env: {
        NODE_ENV: 'test',
        MUXA_PRIMARY_PROVIDER: 'mock',
        MUXA_FALLBACK_PROVIDER: 'openai',
        MUXA_ROUTING_STRATEGY: 'hybrid',
        OPENAI_API_KEY: 'sk-test'
      }
    }
  });

  assert.equal(res.statusCode, 200);
  assert.ok(res.headers['x-muxa-provider']);
  assert.ok(res.headers['x-muxa-route']);
});
