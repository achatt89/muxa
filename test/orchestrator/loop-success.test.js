const test = require('node:test');
const assert = require('node:assert/strict');
const { createOrchestrator } = require('../../src/orchestrator');

test('orchestrator executes tool then responds successfully', async () => {
  let toolExecutions = 0;
  const orchestrator = createOrchestrator({
    toolExecutor: async (call) => {
      toolExecutions += 1;
      return { output: `ran ${call.name}` };
    }
  });

  let first = true;
  const decide = ({ step }) => {
    if (first) {
      first = false;
      return {
        type: 'tool',
        tool: {
          name: 'workspace.search',
          arguments: { query: 'foo' }
        }
      };
    }

    return {
      type: 'respond',
      message: { role: 'assistant', content: `done in step ${step}` }
    };
  };

  const result = await orchestrator.runLoop({
    messages: [{ role: 'user', content: 'hi' }],
    decide
  });

  assert.equal(result.outcome, 'response');
  assert.equal(result.steps, 2);
  assert.equal(result.response.content, 'done in step 1');
  assert.equal(toolExecutions, 1);
  assert.ok(result.transcript.some((msg) => msg.role === 'tool'));
});
