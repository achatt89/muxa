const test = require('node:test');
const assert = require('node:assert/strict');
const { request } = require('../helpers/http');

test('Anthropic messages accept tool_use blocks', async () => {
  const res = await request({
    method: 'POST',
    path: '/v1/messages',
    body: {
      messages: [
        { role: 'user', content: 'Use tool' },
        {
          role: 'assistant',
          content: [{ type: 'tool_use', id: 'tu_1', name: 'echo', input: { text: 'hello' } }]
        }
      ]
    }
  });

  assert.equal(res.statusCode, 200);
  const payload = JSON.parse(res.body);
  assert.equal(payload.role, 'assistant');
});
