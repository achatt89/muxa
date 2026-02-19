const { ProviderAdapter } = require('../base');
const { ProviderError } = require('../errors');

class OllamaAdapter extends ProviderAdapter {
  constructor(options = {}) {
    super('ollama', { type: 'local' });
    this.baseUrl = (options.baseUrl || 'http://localhost:11434').replace(/\/$/, '');
  }

  translateRequest(canonical) {
    return {
      model: canonical.model || 'llama3.1',
      messages: canonical.messages || [],
      stream: false
    };
  }

  async invokeTranslated(payload) {
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const text = await response.text();
      throw new ProviderError('Ollama request failed', {
        provider: this.name,
        statusCode: response.status,
        code: 'OLLAMA_HTTP_ERROR',
        metadata: { body: text }
      });
    }

    const data = await response.json();
    const message = data.message || data.response || {};
    const content = Array.isArray(message.content)
      ? message.content.map((part) => part.text).join(' ')
      : message.content || message.text || '';

    return {
      output: content,
      usage: {
        input_tokens: payload.messages?.length || 0,
        output_tokens: content.length / 4
      },
      finishReason: 'stop'
    };
  }
}

module.exports = {
  OllamaAdapter
};
