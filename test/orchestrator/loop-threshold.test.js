const test = require('node:test');
const assert = require('node:assert/strict');
const { createOrchestrator, LoopGuardError } = require('../../src/orchestrator');

test('loop guard enforces max steps', async () => {
  const orchestrator = createOrchestrator({ maxSteps: 1, toolExecutor: async () => ({ output: 'ok' }) });

  await assert.rejects(
    async () => {
      await orchestrator.runLoop({
        messages: [{ role: 'user', content: 'hello' }],
        decide: () => ({ type: 'tool', tool: { name: 'cmd', arguments: {} } })
      });
    },
    (error) => {
      assert.ok(error instanceof LoopGuardError);
      assert.equal(error.meta.maxSteps, 1);
      return true;
    }
  );
});
