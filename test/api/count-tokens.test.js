const test = require('node:test');
const assert = require('node:assert/strict');
const { request } = require('../helpers/http');

test('count tokens endpoint returns numeric value', async () => {
  const res = await request({
    method: 'POST',
    path: '/v1/messages/count_tokens',
    body: { messages: [{ role: 'user', content: 'token test' }] }
  });

  assert.equal(res.statusCode, 200);
  const payload = JSON.parse(res.body);
  assert.ok(typeof payload.input_tokens === 'number' && payload.input_tokens > 0);
});
