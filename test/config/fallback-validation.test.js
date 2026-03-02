const test = require('node:test');
const assert = require('node:assert/strict');
const { loadConfig } = require('../../src/config');

test('requires fallback provider in hybrid routing', () => {
  assert.throws(() => {
    loadConfig({
      env: {
        MUXA_ROUTING_STRATEGY: 'hybrid',
        MUXA_FALLBACK_PROVIDER: '',
        MUXA_PRIMARY_PROVIDER: 'mock'
      }
    });
  }, /Hybrid routing requires FALLBACK provider/);
});

test('rejects local fallback for hybrid routing', () => {
  assert.throws(() => {
    loadConfig({
      env: {
        MUXA_ROUTING_STRATEGY: 'hybrid',
        MUXA_FALLBACK_PROVIDER: 'ollama',
        MUXA_PRIMARY_PROVIDER: 'openai',
        OPENAI_API_KEY: 'sk-test'
      }
    });
  }, /Hybrid routing fallback must target a non-local provider/);
});

test('rejects fallback matching primary', () => {
  assert.throws(() => {
    loadConfig({
      env: {
        MUXA_ROUTING_STRATEGY: 'hybrid',
        MUXA_FALLBACK_PROVIDER: 'openai',
        MUXA_PRIMARY_PROVIDER: 'openai',
        OPENAI_API_KEY: 'sk-test'
      }
    });
  }, /Fallback provider must differ/);
});

test('accepts valid hybrid fallback combination', () => {
  const config = loadConfig({
    env: {
      MUXA_ROUTING_STRATEGY: 'hybrid',
      MUXA_FALLBACK_PROVIDER: 'openrouter',
      MUXA_PRIMARY_PROVIDER: 'openai',
      OPENAI_API_KEY: 'sk-test',
      OPENROUTER_API_KEY: 'or-test'
    }
  });

  assert.equal(config.fallbackProvider, 'openrouter');
});
