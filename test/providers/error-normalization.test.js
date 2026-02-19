const test = require('node:test');
const assert = require('node:assert/strict');
const { invokeAdapter } = require('../../src/providers');
const { ProviderError } = require('../../src/providers/errors');

test('provider errors include status and code', async () => {
  const canonical = {
    model: 'gpt-4',
    messages: [{ role: 'user', content: 'fail please' }],
    debug: { forceProviderFailure: true }
  };

  await assert.rejects(
    async () => invokeAdapter('openai', canonical, {}),
    (error) => {
      assert.ok(error instanceof ProviderError);
      assert.equal(error.code, 'UPSTREAM_FAIL');
      assert.equal(error.statusCode, 502);
      return true;
    }
  );
});
