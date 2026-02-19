const test = require('node:test');
const assert = require('node:assert/strict');
const { CompressionEngine } = require('../../src/headroom/compression');

test('audit mode returns metrics without changing payload', () => {
  const engine = new CompressionEngine({ mode: 'audit' });
  const input = { tokens: 100 };
  const result = engine.audit(input);
  assert.equal(result.tokens, 100);
  assert.equal(result.metrics.savings, 0);
});
