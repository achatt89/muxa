const test = require('node:test');
const assert = require('node:assert/strict');
const { request } = require('../helpers/http');

test('OpenAI responses endpoint echoes content array', async () => {
  const res = await request({
    method: 'POST',
    path: '/v1/responses',
    body: {
      input: [{ role: 'user', content: [{ type: 'text', text: 'responses' }] }]
    }
  });

  assert.equal(res.statusCode, 200);
  const payload = JSON.parse(res.body);
  assert.equal(payload.object, 'response');
  assert.equal(payload.status, 'completed');
});
