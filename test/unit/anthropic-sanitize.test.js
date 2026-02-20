const test = require('node:test');
const assert = require('node:assert/strict');
const { sanitizeAnthropicMessages } = require('../../src/api/router');

test('sanitizeAnthropicMessages keeps valid tool pair', () => {
  const messages = sanitizeAnthropicMessages([
    {
      role: 'assistant',
      content: [{ type: 'tool_use', id: 'toolu_1', name: 'cmd', input: {} }]
    },
    {
      role: 'tool',
      tool_use_id: 'toolu_1',
      content: 'result'
    }
  ]);

  assert.equal(messages.length, 2);
  assert.equal(messages[1].role, 'tool');
  assert.equal(messages[1].tool_use_id, 'toolu_1');
});

test('sanitizeAnthropicMessages downgrades orphan tool message', () => {
  const messages = sanitizeAnthropicMessages([
    {
      role: 'tool',
      tool_use_id: 'missing',
      content: 'result'
    }
  ]);

  assert.equal(messages.length, 1);
  assert.equal(messages[0].role, 'assistant');
  assert.equal(messages[0].content, 'result');
});
