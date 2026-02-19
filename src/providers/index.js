const { MockOpenAIAdapter } = require('./adapters/mock-openai');
const { MockAnthropicAdapter } = require('./adapters/mock-anthropic');
const { MockLocalAdapter } = require('./adapters/mock-local');
const { ProviderError } = require('./errors');

const adapters = new Map([
  ['openai', new MockOpenAIAdapter()],
  ['anthropic', new MockAnthropicAdapter()],
  ['mock', new MockLocalAdapter()],
  ['mock-local', new MockLocalAdapter()]
]);

function getAdapter(name) {
  const adapter = adapters.get(name);
  if (!adapter) {
    throw new ProviderError(`Unknown provider adapter: ${name}`, {
      provider: name,
      statusCode: 500,
      code: 'PROVIDER_NOT_FOUND'
    });
  }
  return adapter;
}

async function invokeAdapter(name, canonicalRequest) {
  const adapter = getAdapter(name);
  return adapter.invoke(canonicalRequest);
}

module.exports = {
  getAdapter,
  invokeAdapter
};
