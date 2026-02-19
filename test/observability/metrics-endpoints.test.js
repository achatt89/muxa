const test = require('node:test');
const assert = require('node:assert/strict');
const { MetricsRegistry } = require('../../src/observability/metrics');

test('metrics registry snapshots counters', () => {
  const metrics = new MetricsRegistry();
  metrics.inc('requests');
  metrics.inc('requests', 2);
  const snapshot = metrics.snapshot();
  assert.equal(snapshot.requests, 3);
});
