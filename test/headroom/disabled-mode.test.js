const test = require('node:test');
const assert = require('node:assert/strict');
const { HeadroomSidecar } = require('../../src/headroom/sidecar');

test('sidecar disabled mode does not run', async () => {
  const sidecar = new HeadroomSidecar({ enabled: false });
  await sidecar.start();
  const status = sidecar.getStatus();
  assert.equal(status.status, 'disabled');
});
