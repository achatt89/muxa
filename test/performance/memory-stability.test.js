const test = require('node:test');
const assert = require('node:assert/strict');
const { MemoryStore } = require('../../src/memory/store');

test('memory store remains bounded under sustained load', () => {
  const store = new MemoryStore({ surpriseThreshold: 0, maxEntries: 5 });
  for (let i = 0; i < 20; i += 1) {
    store.addCandidate({ content: `entry ${i}`, surprise: 1, createdAt: Date.now() + i });
  }

  assert.ok(store.entries.length <= 5);
});
