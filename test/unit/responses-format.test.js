const test = require('node:test');
const assert = require('node:assert/strict');
const { convertResponsesToChat } = require('../../src/api/responses-format');

test('convertResponsesToChat handles string input', () => {
  const result = convertResponsesToChat({ input: 'hello' });
  assert.equal(result.messages.length, 1);
  assert.deepEqual(result.messages[0], { role: 'user', content: 'hello' });
});

test('convertResponsesToChat flattens multimodal content', () => {
  const result = convertResponsesToChat({
    input: [
      {
        role: 'user',
        content: [
          { type: 'text', text: 'line1' },
          { type: 'input_text', text: 'line2' }
        ]
      }
    ]
  });
  assert.equal(result.messages[0].content, 'line1\n\nline2');
});

test('convertResponsesToChat converts immediate function call result pair', () => {
  const result = convertResponsesToChat({
    input: [
      {
        type: 'function_call',
        name: 'terminal_execute',
        arguments: { command: 'ls' },
        call_id: 'call-1'
      },
      {
        type: 'function_call_output',
        call_id: 'call-1',
        output: 'README.md'
      }
    ]
  });
  assert.equal(result.messages.length, 2);
  assert.equal(result.messages[0].role, 'assistant');
  assert.equal(result.messages[0].tool_calls[0].function.name, 'terminal_execute');
  assert.equal(result.messages[1].role, 'tool');
  assert.equal(result.messages[1].tool_call_id, 'call-1');
});

test('convertResponsesToChat downgrades orphan tool outputs to user text', () => {
  const result = convertResponsesToChat({
    input: [
      {
        type: 'function_call_output',
        output: 'Detached result'
      }
    ]
  });
  assert.equal(result.messages[0].role, 'user');
  assert.equal(result.messages[0].content, 'Detached result');
});

test('convertResponsesToChat handles tool_use and tool_result content parts immediately', () => {
  const result = convertResponsesToChat({
    input: [
      {
        role: 'assistant',
        content: [
          { type: 'text', text: 'Running command' },
          { type: 'tool_use', id: 'toolu_1', name: 'shell_command', input: { command: 'ls' } }
        ]
      },
      {
        role: 'tool',
        tool_call_id: 'toolu_1',
        content: [{ type: 'output_text', text: 'README.md' }]
      }
    ]
  });

  assert.equal(result.messages.length, 2);
  assert.equal(result.messages[0].tool_calls[0].id, 'toolu_1');
  assert.equal(result.messages[1].role, 'tool');
  assert.equal(result.messages[1].tool_call_id, 'toolu_1');
  assert.equal(result.messages[1].content, 'README.md');
});
