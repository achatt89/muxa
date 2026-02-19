const test = require('node:test');
const assert = require('node:assert/strict');
const { MemoryStore } = require('../../src/memory/store');

test('memory store filters low-surprise entries', () => {
  const store = new MemoryStore({ surpriseThreshold: 0.6 });
  const addedHigh = store.addCandidate({ content: 'important insight', surprise: 0.9 });
  const addedLow = store.addCandidate({ content: 'boring detail', surprise: 0.2 });

  assert.equal(addedHigh, true);
  assert.equal(addedLow, false);
  assert.equal(store.entries.length, 1);
});
