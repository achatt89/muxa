const test = require('node:test');
const assert = require('node:assert/strict');
const { retry } = require('../../src/reliability/retry');

test('retry only retries failed attempts and succeeds eventually', async () => {
  let calls = 0;
  const result = await retry(async () => {
    calls += 1;
    if (calls < 2) {
      throw new Error('fail');
    }
    return 'ok';
  }, { maxAttempts: 3, baseDelay: 1 });

  assert.equal(result, 'ok');
  assert.equal(calls, 2);
});
