const { ProviderAdapter } = require('../base');
const { ProviderError } = require('../errors');

class OpenAIAdapter extends ProviderAdapter {
  constructor(options = {}) {
    super('openai', { type: 'cloud' });
    this.apiKey = options.apiKey;
    this.baseUrl = (options.baseUrl || 'https://api.openai.com/v1').replace(/\/$/, '');
    this.organization = options.organization || null;
    this.defaultModel = options.model || 'gpt-4o-mini';
    this.modelAliases = options.modelAliases || {};
    this.fetch = options.fetch || global.fetch;
    this.fallbackModels = Array.isArray(options.fallbackModels) ? options.fallbackModels : [];
    if (!this.apiKey) {
      throw new ProviderError('Missing OpenAI API key', {
        provider: this.name,
        code: 'OPENAI_CREDENTIALS'
      });
    }
    if (typeof this.fetch !== 'function') {
      throw new ProviderError('Fetch API unavailable for OpenAI adapter', {
        provider: this.name,
        code: 'OPENAI_FETCH_MISSING'
      });
    }
  }

  translateRequest(canonical) {
    const requestedModel = canonical.model || this.defaultModel;
    const resolvedModel = this.modelAliases[requestedModel] || requestedModel || this.defaultModel;
    if (!resolvedModel) {
      throw new ProviderError('OpenAI model not configured', {
        provider: this.name,
        code: 'OPENAI_MODEL_MISSING'
      });
    }
    const normalizeContent = (content) => {
      if (content === null) {
        return null;
      }
      if (typeof content === 'string') {
        return content;
      }
      if (Array.isArray(content)) {
        return content
          .map((part) => normalizeContent(part))
          .filter(Boolean)
          .join('\n');
      }
      if (!content || typeof content !== 'object') {
        return content === undefined ? '' : String(content);
      }
      if (typeof content.text === 'string') {
        return content.text;
      }
      if (content.content !== undefined) {
        return normalizeContent(content.content);
      }
      return JSON.stringify(content);
    };
    const messages = (canonical.messages || []).map((message) => {
      const msg = {
        role: message.role || 'user',
        content: normalizeContent(message.content)
      };
      if (message.tool_calls) {
        msg.tool_calls = message.tool_calls;
      }
      if (message.tool_call_id) {
        msg.tool_call_id = message.tool_call_id;
      }
      return msg;
    });
    const payload = {
      model: resolvedModel,
      messages,
      stream: false
    };
    if (canonical.tools) {
      payload.tools = canonical.tools;
      payload.tool_choice = canonical.tool_choice || 'auto';
    }
    return payload;
  }

  async invokeTranslated(payload, canonical) {
    if (canonical?.debug?.forceProviderFailure) {
      throw new ProviderError('Simulated provider failure', {
        provider: this.name,
        statusCode: 502,
        code: 'UPSTREAM_FAIL'
      });
    }

    const headers = {
      'content-type': 'application/json',
      authorization: `Bearer ${this.apiKey}`
    };
    if (this.organization) {
      headers['OpenAI-Organization'] = this.organization;
    }

    const candidateModels = Array.from(
      new Set([payload.model, ...(this.fallbackModels || [])].filter(Boolean))
    );

    let lastError;
    for (const modelName of candidateModels) {
      const attemptPayload = { ...payload, model: modelName };
      try {
        const response = await this.fetch(`${this.baseUrl}/chat/completions`, {
          method: 'POST',
          headers,
          body: JSON.stringify(attemptPayload)
        });

        if (!response.ok) {
          let details = {};
          try {
            details = await response.json();
          } catch {
            details = { message: await response.text() };
          }
          const shouldRetry =
            (response.status === 404 || details?.error?.code === 'model_not_found') &&
            modelName !== candidateModels.at(-1);
          lastError = new ProviderError('OpenAI request failed', {
            provider: this.name,
            statusCode: response.status,
            code: 'OPENAI_HTTP_ERROR',
            metadata: { ...details, attemptedModel: modelName }
          });
          if (shouldRetry) {
            continue;
          }
          throw lastError;
        }

        const data = await response.json();
        const choice = data.choices?.[0];
        const toolCalls =
          (choice?.message?.tool_calls || []).map((call) => ({
            id: call.id,
            type: call.type,
            function: {
              name: call.function?.name || '',
              arguments: call.function?.arguments || ''
            }
          })) || [];
        return {
          output: choice?.message?.content || '',
          toolCalls,
          usage: data.usage || {},
          finishReason: choice?.finish_reason || 'stop'
        };
      } catch (error) {
        if (error instanceof ProviderError && error.code === 'OPENAI_HTTP_ERROR') {
          lastError = error;
          const shouldRetry =
            (error.statusCode === 404 ||
              error.metadata?.error?.code === 'model_not_found' ||
              /model/i.test(String(error.metadata?.message || ''))) &&
            modelName !== candidateModels.at(-1);
          if (shouldRetry) {
            continue;
          }
        }
        throw error;
      }
    }

    throw (
      lastError ||
      new ProviderError('OpenAI request failed', {
        provider: this.name,
        code: 'OPENAI_UNKNOWN_ERROR'
      })
    );
  }
}

module.exports = {
  OpenAIAdapter
};
