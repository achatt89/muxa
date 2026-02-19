const test = require('node:test');
const assert = require('node:assert/strict');
const { HealthStatus } = require('../../src/observability/health');

test('health status serializes state and details', () => {
  const health = new HealthStatus();
  health.setState('degraded', { reason: 'db lag' });
  const json = health.toJson();
  assert.equal(json.status, 'degraded');
  assert.equal(json.details.reason, 'db lag');
});
