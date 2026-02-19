const { ProviderAdapter } = require('../base');
const { ProviderError } = require('../errors');

function approximateTokens(text) {
  if (!text) {
    return 0;
  }
  return Math.max(1, Math.ceil(text.length / 3.5));
}

class MockAnthropicAdapter extends ProviderAdapter {
  constructor() {
    super('anthropic', { type: 'cloud' });
  }

  translateRequest(canonical) {
    return {
      model: canonical.model || 'claude-3',
      messages: canonical.messages || [],
      system: canonical.system || ''
    };
  }

  async invokeTranslated(payload, canonical) {
    if (canonical.debug?.forceProviderFailure && canonical.debug.provider === 'anthropic') {
      throw new ProviderError('Simulated Anthropic failure', {
        provider: this.name,
        statusCode: 500,
        code: 'ANTHROPIC_FAIL'
      });
    }

    const joined = payload.messages
      .map((msg) => (Array.isArray(msg.content) ? msg.content.map((part) => part.text).join(' ') : msg.content))
      .join(' ')
      .trim();

    const text = `Anthropic mock: ${joined || canonical.prompt || 'hello'}`.trim();
    const usage = {
      input_tokens: approximateTokens(joined),
      output_tokens: approximateTokens(text),
      total_tokens: approximateTokens(joined) + approximateTokens(text)
    };

    return {
      output: text,
      usage,
      stop_reason: 'end_turn'
    };
  }

  normalizeResponse(canonical, providerResponse) {
    return {
      content: providerResponse.output,
      usage: {
        input_tokens: providerResponse.usage.input_tokens,
        output_tokens: providerResponse.usage.output_tokens
      },
      finishReason: providerResponse.stop_reason || 'end_turn'
    };
  }
}

module.exports = {
  MockAnthropicAdapter
};
