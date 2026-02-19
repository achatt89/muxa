const test = require('node:test');
const assert = require('node:assert/strict');
const { HeadroomSidecar } = require('../../src/headroom/sidecar');

test('sidecar enabled mode starts successfully', async () => {
  const sidecar = new HeadroomSidecar({ enabled: true, mode: 'optimize' });
  await sidecar.start();
  const status = sidecar.getStatus();
  assert.equal(status.status, 'running');
  assert.equal(status.mode, 'optimize');
});
