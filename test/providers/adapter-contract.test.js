const test = require('node:test');
const assert = require('node:assert/strict');
const { invokeAdapter } = require('../../src/providers');
const { ensureMockOpenAI } = require('../helpers/mock-openai');

test('provider adapters translate canonical requests', async () => {
  ensureMockOpenAI();
  const canonical = {
    model: 'gpt-4',
    messages: [
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'World' }
    ]
  };

  const result = await invokeAdapter('openai', canonical, {
    providers: {
      openai: { apiKey: 'sk-test', baseUrl: 'https://api.openai.com/v1' }
    }
  });

  assert.equal(result.provider, 'openai');
  assert.equal(result.normalized.finishReason, 'stop');
  assert.equal(result.normalized.content, 'mock-openai response');
});
