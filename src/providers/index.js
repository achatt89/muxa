const { MockOpenAIAdapter } = require('./adapters/mock-openai');
const { MockAnthropicAdapter } = require('./adapters/mock-anthropic');
const { MockLocalAdapter } = require('./adapters/mock-local');
const { OpenRouterAdapter } = require('./adapters/openrouter');
const { OllamaAdapter } = require('./adapters/ollama');
const { ProviderError } = require('./errors');

const adapterFactories = new Map([
  ['openai', () => new MockOpenAIAdapter()],
  ['anthropic', () => new MockAnthropicAdapter()],
  ['mock', () => new MockLocalAdapter()],
  ['mock-local', () => new MockLocalAdapter()],
  ['openrouter', (config) => new OpenRouterAdapter(config?.providers?.openrouter || {})],
  ['ollama', (config) => new OllamaAdapter(config?.providers?.ollama || {})]
]);

function getAdapter(name, config) {
  const factory = adapterFactories.get(name);
  if (!factory) {
    throw new ProviderError(`Unknown provider adapter: ${name}`, {
      provider: name,
      statusCode: 500,
      code: 'PROVIDER_NOT_FOUND'
    });
  }
  return factory(config);
}

async function invokeAdapter(name, canonicalRequest, config) {
  const adapter = getAdapter(name, config);
  return adapter.invoke(canonicalRequest);
}

module.exports = {
  getAdapter,
  invokeAdapter
};
