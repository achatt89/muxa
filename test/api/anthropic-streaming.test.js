const test = require('node:test');
const assert = require('node:assert/strict');
const { request } = require('../helpers/http');

test('Anthropic streaming responses emit ordered events', async () => {
  const res = await request({
    method: 'POST',
    path: '/v1/messages',
    body: {
      stream: true,
      messages: [{ role: 'user', content: 'Stream please' }]
    }
  });

  assert.equal(res.headers['content-type'], 'text/event-stream');
  const chunks = res.body
    .trim()
    .split('\n\n')
    .map((chunk) => chunk.replace(/^event:\s*/gm, '').replace(/^data:\s*/gm, 'data:').trim());

  const eventNames = chunks.map((chunk) =>
    chunk.startsWith('data:') ? 'data' : chunk.split('\n')[0]
  );

  assert.deepEqual(eventNames.slice(0, 6), [
    'message_start',
    'content_block_start',
    'content_block_delta',
    'content_block_stop',
    'message_delta',
    'message_stop'
  ]);
});
