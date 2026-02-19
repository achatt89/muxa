const test = require('node:test');
const assert = require('node:assert/strict');
const { PolicyManager, PolicyViolationError } = require('../../src/policy');

test('policy enforces git push and test requirements', () => {
  const policy = new PolicyManager({ gitPushAllowed: false, commitRequiresTests: true });
  assert.throws(() => policy.assertGitPushAllowed(), PolicyViolationError);
  assert.throws(() => policy.assertTestsBeforeCommit(false), PolicyViolationError);
  assert.doesNotThrow(() => policy.assertTestsBeforeCommit(true));
});
