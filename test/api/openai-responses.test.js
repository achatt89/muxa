const test = require('node:test');
const assert = require('node:assert/strict');
const { request } = require('../helpers/http');
const { parseSse } = require('../helpers/sse');

test('OpenAI responses endpoint streams completion events when requested', async () => {
  const res = await request({
    method: 'POST',
    path: '/v1/responses',
    headers: { accept: 'text/event-stream' },
    body: {
      input: [{ role: 'user', content: [{ type: 'text', text: 'responses' }] }],
      stream: true
    }
  });

  assert.equal(res.statusCode, 200);
  assert.equal(res.headers['content-type'], 'text/event-stream');
  const events = parseSse(res.body);
  assert.ok(events.find((evt) => evt.event === 'response.created'));
  const delta = events.find((evt) => evt.event === 'response.output_text.delta');
  assert.ok(delta, 'delta event missing');
  assert.equal(delta.data.delta.trim(), 'mock-openai response');
  assert.ok(events.find((evt) => evt.event === 'response.output_text.done'));
  const completed = events.find((evt) => evt.event === 'response.completed');
  assert.ok(completed);
  assert.equal(completed.data.response.object, 'response');
  assert.equal(completed.data.response.status, 'completed');
  assert.ok(events.find((evt) => evt.data === '[DONE]'));
});

test('OpenAI responses endpoint echoes content array when stream disabled', async () => {
  const res = await request({
    method: 'POST',
    path: '/v1/responses',
    body: {
      input: [{ role: 'user', content: [{ type: 'text', text: 'responses' }] }],
      stream: false
    }
  });

  assert.equal(res.statusCode, 200);
  const payload = JSON.parse(res.body);
  assert.equal(payload.object, 'response');
  assert.equal(payload.status, 'completed');
});
