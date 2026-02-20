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
  assert.equal(payload.object, 'list');
  assert.ok(Array.isArray(payload.data));
  assert.ok(payload.data.length > 0);
  const hasStandardModels = payload.data.some((model) => model.id === 'gpt-5.2-codex')
    && payload.data.some((model) => model.id === 'gpt-4o');
  assert.ok(hasStandardModels, 'expected default OpenAI models to be listed');
});
