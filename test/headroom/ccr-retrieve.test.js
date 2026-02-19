const test = require('node:test');
const assert = require('node:assert/strict');
const { CompressionEngine } = require('../../src/headroom/compression');

test('optimize mode preserves metrics for CCR retrieval', () => {
  const engine = new CompressionEngine({ mode: 'optimize' });
  const result = engine.optimize({ tokens: 200 });
  assert.ok(result.metrics.tokensBefore);
  assert.ok(result.metrics.tokensAfter);
});
