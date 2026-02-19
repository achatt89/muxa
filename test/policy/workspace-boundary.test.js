const test = require('node:test');
const assert = require('node:assert/strict');
const { PolicyManager, PolicyViolationError } = require('../../src/policy');

test('policy blocks path outside workspace', () => {
  const policy = new PolicyManager({ workspaceRoot: '/repo/project' });
  assert.throws(() => {
    policy.assertWorkspacePath('../etc/passwd');
  }, PolicyViolationError);
});
