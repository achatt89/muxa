const test = require('node:test');
const assert = require('node:assert/strict');
const { MemoryStore } = require('../../src/memory/store');

test('older memories receive lower recency score', () => {
  const now = Date.now();
  const store = new MemoryStore({ surpriseThreshold: 0 });
  store.addCandidate({ content: 'recent fact', surprise: 0.8, importance: 0.5, createdAt: now });
  store.addCandidate({ content: 'old fact', surprise: 0.9, importance: 0.9, createdAt: now - 30 * 24 * 60 * 60 * 1000 });

  const ranked = store.rankEntries('fact');
  assert.equal(ranked[0].entry.content, 'recent fact');
});
