const { ProviderAdapter } = require('../base');
const { ProviderError } = require('../errors');

class OpenRouterAdapter extends ProviderAdapter {
  constructor(options = {}) {
    super('openrouter', { type: 'cloud' });
    this.apiKey = options.apiKey;
    this.baseUrl = (options.baseUrl || 'https://openrouter.ai/api/v1').replace(/\/$/, '');
    if (!this.apiKey) {
      throw new ProviderError('Missing OpenRouter API key', {
        provider: 'openrouter',
        code: 'OPENROUTER_CREDENTIALS'
      });
    }
  }

  translateRequest(canonical) {
    return {
      model: canonical.model,
      messages: canonical.messages,
      stream: false
    };
  }

  async invokeTranslated(payload) {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${this.apiKey}`,
        'http-referer': 'muxa'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const text = await response.text();
      throw new ProviderError('OpenRouter request failed', {
        provider: this.name,
        statusCode: response.status,
        code: 'OPENROUTER_HTTP_ERROR',
        metadata: { body: text }
      });
    }

    const data = await response.json();
    const choice = data.choices?.[0];
    return {
      output: choice?.message?.content || '',
      usage: data.usage || {},
      finishReason: choice?.finish_reason || 'stop'
    };
  }
}

module.exports = {
  OpenRouterAdapter
};
