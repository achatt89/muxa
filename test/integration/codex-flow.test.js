const test = require('node:test');
const assert = require('node:assert/strict');
const { request } = require('../helpers/http');

test('Codex flow: /v1/responses returns response object', async () => {
  const res = await request({
    method: 'POST',
    path: '/v1/responses',
    body: {
      input: [{ role: 'user', content: [{ type: 'text', text: 'describe muxa' }] }]
    }
  });

  assert.equal(res.statusCode, 200);
  const payload = JSON.parse(res.body);
  assert.equal(payload.object, 'response');
  assert.equal(payload.status, 'completed');
});
