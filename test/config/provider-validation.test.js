const test = require('node:test');
const assert = require('node:assert/strict');
const { loadConfig, ConfigError } = require('../../src/config');

test('rejects unsupported providers', () => {
  assert.throws(() => {
    loadConfig({
      env: {
        MUXA_PRIMARY_PROVIDER: 'unsupported'
      }
    });
  }, ConfigError);
});

test('requires credentials for OpenAI provider', () => {
  assert.throws(() => {
    loadConfig({
      env: {
        MUXA_PRIMARY_PROVIDER: 'openai'
      }
    });
  }, /Missing required credential/);
});

test('accepts provider when credentials present', () => {
  const config = loadConfig({
    env: {
      MUXA_PRIMARY_PROVIDER: 'openai',
      OPENAI_API_KEY: 'sk-test'
    }
  });

  assert.equal(config.primaryProvider, 'openai');
  assert.ok(config.credentials.openai);
});
