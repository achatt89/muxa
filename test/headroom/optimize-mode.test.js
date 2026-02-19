const test = require('node:test');
const assert = require('node:assert/strict');
const { CompressionEngine } = require('../../src/headroom/compression');

test('optimize mode reduces tokens and reports savings', () => {
  const engine = new CompressionEngine({ mode: 'optimize' });
  const result = engine.optimize({ tokens: 1000 });
  assert.equal(result.tokens, 900);
  assert.equal(result.metrics.savings, 100);
});
