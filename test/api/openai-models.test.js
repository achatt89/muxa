const test = require('node:test');
const assert = require('node:assert/strict');
const { request } = require('../helpers/http');

test('GET /v1/models returns model list', async () => {
  const res = await request({
    method: 'GET',
    path: '/v1/models'
  });

  assert.equal(res.statusCode, 200);
  const payload = JSON.parse(res.body);
  assert.ok(Array.isArray(payload.data));
  assert.ok(payload.data.some((model) => model.id === 'mock-openai'));
});
