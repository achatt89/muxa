const test = require('node:test');
const assert = require('node:assert/strict');
const { mapToolCall } = require('../../packages/client-mapping');

test('cline/kilo mapping transforms tool names', () => {
  const cline = mapToolCall('Cline', { name: 'shell.run', arguments: { cmd: 'ls' } });
  assert.equal(cline.name, 'run_command');

  const kilo = mapToolCall('kilo', { name: 'workspace.read', arguments: { path: 'file' } });
  assert.equal(kilo.name, 'read_file');
});
