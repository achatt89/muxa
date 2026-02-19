const test = require('node:test');
const assert = require('node:assert/strict');
const { OpenRouterAdapter } = require('../../src/providers/adapters/openrouter');

const originalFetch = global.fetch;

test('openrouter adapter translates and invokes HTTP request', async (t) => {
  t.after(() => {
    global.fetch = originalFetch;
  });

  global.fetch = async (url, options) => {
    assert.match(url, /chat\/completions/);
    const parsed = JSON.parse(options.body);
    assert.ok(Array.isArray(parsed.messages));
    return {
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'openrouter reply' }, finish_reason: 'stop' }],
        usage: { prompt_tokens: 1, completion_tokens: 1 }
      })
    };
  };

  const adapter = new OpenRouterAdapter({ apiKey: 'test-key', baseUrl: 'https://example.com' });
  const result = await adapter.invoke({ messages: [{ role: 'user', content: 'hi' }] });
  assert.equal(result.normalized.content, 'openrouter reply');
});
