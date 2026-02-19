const test = require('node:test');
const assert = require('node:assert/strict');
const { createOrchestrator } = require('../../src/orchestrator');

test('client mode delegates tool execution to caller', async () => {
  const orchestrator = createOrchestrator();

  const result = await orchestrator.runLoop({
    messages: [{ role: 'user', content: 'hi' }],
    executionMode: 'client',
    decide: () => ({
      type: 'tool',
      tool: { name: 'workspace.edit', arguments: { file: 'README', text: 'update' } }
    })
  });

  assert.equal(result.outcome, 'tool_delegated');
  assert.equal(result.toolCall.name, 'workspace.edit');
  assert.equal(result.toolCall.arguments.file, 'README');
});
