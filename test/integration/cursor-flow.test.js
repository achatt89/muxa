const test = require('node:test');
const assert = require('node:assert/strict');
const { request } = require('../helpers/http');

test('Cursor flow: /v1/chat/completions returns choices', async () => {
  const res = await request({
    method: 'POST',
    path: '/v1/chat/completions',
    body: {
      messages: [{ role: 'user', content: 'summarize muxa proxy' }]
    }
  });

  assert.equal(res.statusCode, 200);
  const payload = JSON.parse(res.body);
  assert.ok(Array.isArray(payload.choices));
  assert.equal(payload.choices[0].message.role, 'assistant');
});
