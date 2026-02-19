const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const pkg = require('../../package.json');

const projectRoot = path.resolve(__dirname, '..', '..');

test('CLI --help outputs usage text', () => {
  const result = spawnSync('node', ['bin/muxa.js', '--help'], {
    cwd: projectRoot,
    encoding: 'utf8'
  });

  assert.equal(result.status, 0);
  assert.match(result.stdout, /Usage: muxa/);
});

test('CLI --version outputs package version', () => {
  const result = spawnSync('node', ['bin/muxa.js', '--version'], {
    cwd: projectRoot,
    encoding: 'utf8'
  });

  assert.equal(result.status, 0);
  assert.equal(result.stdout.trim(), pkg.version);
});
