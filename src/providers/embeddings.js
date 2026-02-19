const { invokeAdapter } = require('./index');
const { ProviderError } = require('./errors');

async function generateEmbedding({ text, config }) {
  const provider = config?.embeddingsProvider || config?.primaryProvider;
  if (!provider) {
    throw new ProviderError('No embeddings provider configured', {
      code: 'EMBEDDINGS_PROVIDER_MISSING',
      statusCode: 400
    });
  }

  const invocation = await invokeAdapter(provider, {
    model: 'embeddings',
    messages: [{ role: 'user', content: text }],
    debug: {}
  }, config);

  return {
    provider,
    output: invocation.normalized?.content || invocation.response?.output || ''
  };
}

module.exports = {
  generateEmbedding
};
