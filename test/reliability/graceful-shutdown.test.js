const test = require('node:test');
const assert = require('node:assert/strict');
const { ShutdownManager } = require('../../src/reliability/graceful-shutdown');

test('graceful shutdown runs registered handlers', async () => {
  const manager = new ShutdownManager();
  const called = [];
  manager.register(async () => called.push('a'));
  manager.register(async () => called.push('b'));
  await manager.shutdown();
  assert.deepEqual(called, ['a', 'b']);
});
