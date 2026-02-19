const { ProviderError } = require('./errors');

class ProviderAdapter {
  constructor(name, options = {}) {
    this.name = name;
    this.type = options.type || 'cloud';
  }

  translateRequest(canonical) {
    return {
      model: canonical.model,
      prompt: canonical.prompt || '',
      messages: canonical.messages || []
    };
  }

  async invokeTranslated(/* payload */) {
    throw new ProviderError('invokeTranslated not implemented', {
      provider: this.name
    });
  }

  normalizeResponse(canonical, providerResponse) {
    return {
      content: providerResponse.output,
      usage: providerResponse.usage || { input_tokens: 0, output_tokens: 0 },
      finishReason: providerResponse.finishReason || 'stop'
    };
  }

  async invoke(canonical) {
    const payload = this.translateRequest(canonical);
    const response = await this.invokeTranslated(payload, canonical);
    const normalized = this.normalizeResponse(canonical, response);
    return {
      provider: this.name,
      payload,
      response,
      normalized
    };
  }
}

module.exports = {
  ProviderAdapter
};
