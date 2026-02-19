const test = require('node:test');
const assert = require('node:assert/strict');
const { request } = require('../helpers/http');

test('Cloud provider E2E: OpenAI adapter handles chat completion', async () => {
  const res = await request({
    method: 'POST',
    path: '/v1/chat/completions',
    body: { messages: [{ role: 'user', content: 'cloud provider test' }] },
    configOptions: {
      env: {
        NODE_ENV: 'test',
        MUXA_PRIMARY_PROVIDER: 'openai',
        OPENAI_API_KEY: 'sk-test'
      }
    }
  });

  assert.equal(res.statusCode, 200);
  const payload = JSON.parse(res.body);
  assert.equal(payload.object, 'chat.completion');
});
