const test = require('node:test');
const assert = require('node:assert/strict');
const { MemoryStore } = require('../../src/memory/store');

test('retrieval ranking combines relevance and recency', () => {
  const now = Date.now();
  const store = new MemoryStore({ surpriseThreshold: 0 });
  store.addCandidate({ content: 'fix login bug quickly', surprise: 0.7, importance: 0.9, createdAt: now - 1000 });
  store.addCandidate({ content: 'remember to write docs', surprise: 0.8, importance: 0.8, createdAt: now - 10 * 24 * 60 * 60 * 1000 });

  const ranked = store.retrieveTop({ query: 'login bug', limit: 1 });
  assert.equal(ranked[0].content.includes('login'), true);
});
