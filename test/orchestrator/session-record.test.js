const test = require('node:test');
const assert = require('node:assert/strict');
const { createOrchestrator } = require('../../src/orchestrator');

test('session recorder captures assistant message on completion', async () => {
  const captured = [];
  const orchestrator = createOrchestrator({
    sessionRecorder: {
      append: (message) => captured.push(message)
    }
  });

  const result = await orchestrator.runLoop({
    messages: [{ role: 'user', content: 'ping' }],
    decide: () => ({ type: 'respond', message: { role: 'assistant', content: 'pong' } })
  });

  assert.equal(result.outcome, 'response');
  assert.equal(captured.length, 1);
  assert.equal(captured[0].content, 'pong');
});
