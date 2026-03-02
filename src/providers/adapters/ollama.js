const { ProviderAdapter } = require('../base');
const { ProviderError } = require('../errors');

class OllamaAdapter extends ProviderAdapter {
  constructor(options = {}) {
    super('ollama', { type: 'local' });
    this.baseUrl = (options.baseUrl || 'http://localhost:11434').replace(/\/$/, '');
    this.logging = options.logging;
  }

  translateRequest(canonical) {
    const messages = (canonical.messages || []).map((msg) => ({
      role: msg.role,
      content: Array.isArray(msg.content)
        ? msg.content.map((part) => (typeof part === 'string' ? part : part.text || '')).join('\n')
        : msg.content || ''
    }));

    return {
      model: process.env.OLLAMA_MODEL || canonical.model || 'llama3.1',
      messages,
      stream: false
    };
  }

  async invokeTranslated(payload) {
    const timeoutSignal = AbortSignal.timeout(300000); // 5 minute timeout for local models

    try {
      if (this.logging) {
        console.log(
          `[muxa:ollama] sending request to ${this.baseUrl}/api/chat for model: ${payload.model}`
        );
      }
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify(payload),
        signal: timeoutSignal
      });

      if (this.logging) {
        console.log(`[muxa:ollama] response status: ${response.status}`);
      }

      if (!response.ok) {
        const text = await response.text();
        throw new ProviderError(`Ollama request failed (${response.status})`, {
          provider: this.name,
          statusCode: response.status,
          code: 'OLLAMA_HTTP_ERROR',
          metadata: { body: text }
        });
      }

      const data = await response.json();
      if (this.logging) {
        console.log(`[muxa:ollama] response data: ${JSON.stringify(data).slice(0, 200)}...`);
      }

      const message = data.message || data.response || {};
      const content = Array.isArray(message.content)
        ? message.content.map((part) => part.text).join(' ')
        : typeof message.content === 'string'
          ? message.content
          : message.content || message.text || data.response || '';

      if (this.logging) {
        console.log(`[muxa:ollama] extracted content length: ${content.length}`);
        console.log(`[muxa:ollama] extracted content: "${content.slice(0, 100)}..."`);
      }

      return {
        output: content,
        usage: {
          input_tokens: payload.messages?.length || 0,
          output_tokens: Math.ceil(content.length / 4)
        },
        finishReason: 'stop'
      };
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new ProviderError(
          'Ollama request timed out (300s). The model is taking too long to respond.',
          {
            provider: this.name,
            statusCode: 408,
            code: 'OLLAMA_TIMEOUT'
          }
        );
      }
      throw error;
    }
  }
}

module.exports = {
  OllamaAdapter
};
