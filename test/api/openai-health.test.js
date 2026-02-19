const test = require('node:test');
const assert = require('node:assert/strict');
const { request } = require('../helpers/http');

test('OpenAI health endpoint reports ok', async () => {
  const res = await request({
    method: 'GET',
    path: '/v1/health'
  });

  assert.equal(res.statusCode, 200);
  const payload = JSON.parse(res.body);
  assert.equal(payload.status, 'ok');
});
