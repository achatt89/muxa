const test = require('node:test');
const assert = require('node:assert/strict');
const { createOrchestrator } = require('../../src/orchestrator');

test('server mode executes tool via toolExecutor', async () => {
  let executed = false;
  const orchestrator = createOrchestrator({
    toolExecutor: async () => {
      executed = true;
      return { output: 'ok' };
    }
  });

  const decide = (ctx) => {
    if (ctx.step === 0) {
      return { type: 'tool', tool: { name: 'shell.run', arguments: { cmd: 'ls' } } };
    }
    return { type: 'respond', message: { role: 'assistant', content: 'done' } };
  };

  const result = await orchestrator.runLoop({
    messages: [{ role: 'user', content: 'hi' }],
    decide,
    executionMode: 'server'
  });

  assert.equal(result.outcome, 'response');
  assert.ok(executed);
});
