const test = require('node:test');
const assert = require('node:assert/strict');
const { CircuitBreaker } = require('../../src/reliability/circuit-breaker');

test('circuit breaker transitions OPEN -> HALF_OPEN -> CLOSED', () => {
  const breaker = new CircuitBreaker({ failureThreshold: 2, resetTimeoutMs: 10 });
  breaker.recordFailure();
  breaker.recordFailure();
  assert.equal(breaker.state, 'OPEN');
  assert.equal(breaker.canExecute(), false);
  breaker.nextAttempt = Date.now() - 1;
  assert.equal(breaker.canExecute(), true);
  breaker.recordSuccess();
  assert.equal(breaker.state, 'CLOSED');
});
