const test = require('node:test');
const assert = require('node:assert/strict');
const { request } = require('../helpers/http');

test('Embeddings endpoint returns embedding vector', async () => {
  const res = await request({
    method: 'POST',
    path: '/v1/embeddings',
    body: { input: 'embed me' }
  });

  assert.equal(res.statusCode, 200);
  const payload = JSON.parse(res.body);
  assert.ok(Array.isArray(payload.data[0].embedding));
});
