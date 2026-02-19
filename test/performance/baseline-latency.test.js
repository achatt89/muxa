const test = require('node:test');
const assert = require('node:assert/strict');
const { request } = require('../helpers/http');

test('baseline latency stays under 500ms for /v1/messages', async () => {
  const start = Date.now();
  const res = await request({
    method: 'POST',
    path: '/v1/messages',
    body: { messages: [{ role: 'user', content: 'latency test' }] }
  });
  const duration = Date.now() - start;

  assert.equal(res.statusCode, 200);
  assert.ok(duration < 500);
});
