const test = require('node:test');
const assert = require('node:assert/strict');
const { PolicyManager, PolicyViolationError } = require('../../src/policy');

test('policy blocks disallowed hosts', () => {
  const policy = new PolicyManager({ allowedHosts: ['example.com'] });
  assert.doesNotThrow(() => policy.assertWebHost('https://example.com/api'));
  assert.throws(() => policy.assertWebHost('https://evil.com'), PolicyViolationError);
});
