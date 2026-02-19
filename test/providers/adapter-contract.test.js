const test = require('node:test');
const assert = require('node:assert/strict');
const { invokeAdapter } = require('../../src/providers');

test('provider adapters translate canonical requests', async () => {
  const canonical = {
    model: 'gpt-4',
    messages: [
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'World' }
    ]
  };

  const result = await invokeAdapter('openai', canonical);

  assert.equal(result.provider, 'openai');
  assert.ok(result.payload.prompt.includes('Hello'));
  assert.equal(result.normalized.finishReason, 'stop');
  assert.match(result.normalized.content, /OpenAI mock/);
});
