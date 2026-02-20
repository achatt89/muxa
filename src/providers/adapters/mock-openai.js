const { ProviderAdapter } = require('../base');
const { ProviderError } = require('../errors');

function approximateTokens(text) {
  if (!text) {
    return 0;
  }
  return Math.max(1, Math.ceil(text.length / 4));
}

function stringifyContent(content) {
  if (typeof content === 'string') {
    return content;
  }
  if (Array.isArray(content)) {
    return content.map((item) => stringifyContent(item)).join(' ');
  }
  if (content && typeof content === 'object') {
    try {
      return JSON.stringify(content);
    } catch {
      return String(content);
    }
  }
  return content ?? '';
}

class MockOpenAIAdapter extends ProviderAdapter {
  constructor() {
    super('openai', { type: 'cloud' });
  }

  translateRequest(canonical) {
    const prompt = (canonical.messages || [])
      .map((msg) => `[${msg.role}] ${stringifyContent(msg.content)}`)
      .join('\n');

    return {
      model: canonical.model || 'gpt-4-turbo',
      messages: canonical.messages || [],
      prompt
    };
  }

  async invokeTranslated(payload, canonical) {
    if (canonical.debug?.forceProviderFailure) {
      throw new ProviderError('Simulated provider failure', {
        provider: this.name,
        statusCode: 502,
        code: 'UPSTREAM_FAIL'
      });
    }

    const text = `OpenAI mock: ${payload.prompt || canonical.prompt || 'hello'}`.trim();
    const usage = {
      prompt_tokens: approximateTokens(payload.prompt),
      completion_tokens: approximateTokens(text),
      total_tokens: approximateTokens(payload.prompt) + approximateTokens(text)
    };

    return {
      output: text,
      usage,
      finishReason: 'stop'
    };
  }
}

module.exports = {
  MockOpenAIAdapter
};
