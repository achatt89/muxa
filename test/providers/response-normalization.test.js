const test = require('node:test');
const assert = require('node:assert/strict');
const { invokeAdapter } = require('../../src/providers');

test('anthropic adapter normalizes usage into expected fields', async () => {
  const canonical = {
    model: 'claude-3',
    messages: [{ role: 'user', content: [{ type: 'text', text: 'ping' }] }]
  };

  const result = await invokeAdapter('anthropic', canonical, {});

  const usage = result.normalized.usage;
  assert.ok(typeof usage.input_tokens === 'number');
  assert.ok(typeof usage.output_tokens === 'number');
  assert.equal(result.normalized.finishReason, 'end_turn');
});
