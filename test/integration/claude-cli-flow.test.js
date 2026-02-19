const test = require('node:test');
const assert = require('node:assert/strict');
const { request } = require('../helpers/http');

test('Claude CLI flow: /v1/messages responds with routing metadata', async () => {
  const res = await request({
    method: 'POST',
    path: '/v1/messages',
    body: {
      messages: [{ role: 'user', content: 'hello from claude' }]
    }
  });

  assert.equal(res.statusCode, 200);
  assert.ok(res.headers['x-muxa-provider']);

  const payload = JSON.parse(res.body);
  assert.equal(payload.type, 'message');
  assert.equal(payload.role, 'assistant');
});
