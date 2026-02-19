const test = require('node:test');
const assert = require('node:assert/strict');
const { HeadroomSidecar } = require('../../src/headroom/sidecar');

test('sidecar restart transitions through restarting state', async () => {
  const sidecar = new HeadroomSidecar({ enabled: true });
  await sidecar.start();
  await sidecar.restart();
  const status = sidecar.getStatus();
  assert.equal(status.status, 'running');
});
