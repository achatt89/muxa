const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..', '..');

test('CLI exits non-zero on invalid critical configuration', () => {
  const result = spawnSync('node', ['bin/muxa.js'], {
    cwd: projectRoot,
    encoding: 'utf8',
    env: {
      ...process.env,
      NODE_ENV: 'test',
      MUXA_PRIMARY_PROVIDER: 'openai' // missing OPENAI_API_KEY
    }
  });

  assert.equal(result.status, 1);
  assert.match(result.stderr, /Configuration error/);
});
