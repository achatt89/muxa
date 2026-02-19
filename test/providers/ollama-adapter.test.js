const test = require('node:test');
const assert = require('node:assert/strict');
const { OllamaAdapter } = require('../../src/providers/adapters/ollama');

const originalFetch = global.fetch;

test('ollama adapter invokes local endpoint', async (t) => {
  t.after(() => {
    global.fetch = originalFetch;
  });

  global.fetch = async (url, options) => {
    assert.match(url, /\/api\/chat$/);
    const parsed = JSON.parse(options.body);
    assert.equal(parsed.model, 'llama3.1');
    return {
      ok: true,
      json: async () => ({
        message: { content: 'ollama says hi' }
      })
    };
  };

  const adapter = new OllamaAdapter({ baseUrl: 'http://localhost:11434' });
  const result = await adapter.invoke({ messages: [{ role: 'user', content: 'hi' }] });
  assert.match(result.normalized.content || result.output, /ollama/);
});
