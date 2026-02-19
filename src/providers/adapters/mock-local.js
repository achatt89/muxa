const { ProviderAdapter } = require('../base');

function approximateTokens(text) {
  if (!text) {
    return 0;
  }
  return Math.max(1, Math.ceil(text.length / 6));
}

class MockLocalAdapter extends ProviderAdapter {
  constructor() {
    super('mock-local', { type: 'local' });
  }

  translateRequest(canonical) {
    return {
      model: canonical.model || 'local-model',
      prompt: (canonical.messages || []).map((msg) => msg.content || '').join(' ')
    };
  }

  async invokeTranslated(payload) {
    const output = `Local mock: ${payload.prompt || 'hello'}`.trim();
    return {
      output,
      usage: {
        input_tokens: approximateTokens(payload.prompt),
        output_tokens: approximateTokens(output)
      },
      finishReason: 'stop'
    };
  }
}

module.exports = {
  MockLocalAdapter
};
