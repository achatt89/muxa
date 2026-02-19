const test = require('node:test');
const assert = require('node:assert/strict');
const { request } = require('../helpers/http');

test('OpenAI chat completions return assistant choice', async () => {
  const res = await request({
    method: 'POST',
    path: '/v1/chat/completions',
    body: { messages: [{ role: 'user', content: 'say hi' }] }
  });

  assert.equal(res.statusCode, 200);
  const payload = JSON.parse(res.body);
  assert.equal(payload.object, 'chat.completion');
  assert.equal(payload.choices[0].message.role, 'assistant');
});
