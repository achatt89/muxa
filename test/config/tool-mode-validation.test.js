const test = require('node:test');
const assert = require('node:assert/strict');
const { loadConfig, ConfigError } = require('../../src/config');

test('rejects invalid tool execution mode', () => {
  assert.throws(() => {
    loadConfig({
      env: {
        MUXA_TOOL_EXECUTION_MODE: 'invalid'
      }
    });
  }, ConfigError);
});

test('returns normalized tool execution mode', () => {
  const config = loadConfig({
    env: {
      MUXA_TOOL_EXECUTION_MODE: 'CLIENT'
    }
  });

  assert.equal(config.toolExecution.mode, 'client');
});
