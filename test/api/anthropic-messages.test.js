const test = require('node:test');
const assert = require('node:assert/strict');
const { request } = require('../helpers/http');

test('Anthropic /v1/messages returns structured response', async () => {
  const res = await request({
    method: 'POST',
    path: '/v1/messages',
    body: {
      model: 'claude-3',
      messages: [{ role: 'user', content: 'Hello world' }]
    }
  });

  assert.equal(res.statusCode, 200);
  const payload = JSON.parse(res.body);
  assert.equal(payload.role, 'assistant');
  assert.ok(Array.isArray(payload.content));
  assert.equal(payload.stop_reason, 'end_turn');
  assert.deepEqual(Object.keys(payload.usage).sort(), [
    'input_tokens',
    'output_tokens'
  ]);
});
