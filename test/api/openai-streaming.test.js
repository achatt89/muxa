const test = require('node:test');
const assert = require('node:assert/strict');
const { request } = require('../helpers/http');

test('OpenAI streaming emits data chunks and DONE marker', async () => {
  const res = await request({
    method: 'POST',
    path: '/v1/chat/completions',
    body: { stream: true, messages: [{ role: 'user', content: 'stream' }] }
  });

  assert.equal(res.headers['content-type'], 'text/event-stream');
  const chunks = res.body.trim().split('\n\n');
  assert.ok(chunks.some((chunk) => chunk.includes('data: [DONE]')));
});
