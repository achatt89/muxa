'use strict';

const { respondJson, writeSse, respondError } = require('../http/response');
const { recordSessionTokenUsage, randomId } = require('../state/runtime');
const { approximateTokensFromText } = require('./utils');
const { executeWithRouting } = require('../routing');
const { ProviderError } = require('../providers/errors');

function buildCanonicalOpenAIRequest(body) {
  const messages = body.messages || [];
  const promptLength = JSON.stringify(messages).length;
  const requiresTools = Boolean(body.tools && body.tools.length);
  return {
    api: 'openai',
    model: body.model || 'gpt-4-turbo',
    messages,
    requiresTools,
    complexityScore: Math.round(promptLength / 400) + (requiresTools ? 2 : 0),
    stream: Boolean(body.stream),
    metadata: {
      sessionId: body.session_id || body.user || 'demo'
    },
    debug: body.debug
  };
}

function registerOpenAIRoutes(router, { runtime, config }) {
  router.post('/v1/chat/completions', async ({ res, body = {} }) => {
    const canonical = buildCanonicalOpenAIRequest(body);
    try {
      const { route, result } = await executeWithRouting({ config, canonicalRequest: canonical });
      res.setHeader('x-muxa-provider', route.provider);
      res.setHeader('x-muxa-route', route.usedFallback ? 'fallback' : 'primary');
      res.setHeader('x-muxa-routing-score', String(route.score));

      const usage = {
        prompt_tokens: result.normalized.usage.prompt_tokens ?? result.normalized.usage.input_tokens ?? 0,
        completion_tokens:
          result.normalized.usage.completion_tokens ?? result.normalized.usage.output_tokens ?? 0
      };

      recordSessionTokenUsage(runtime, canonical.metadata.sessionId, {
        input: usage.prompt_tokens,
        output: usage.completion_tokens
      });

      if (canonical.stream) {
        res.statusCode = 200;
        res.setHeader('content-type', 'text/event-stream');
        res.setHeader('cache-control', 'no-cache');
        const chunkId = randomId('chatcmpl');
        writeSse(res, null, {
          id: chunkId,
          object: 'chat.completion.chunk',
          created: Math.floor(Date.now() / 1000),
          model: body.model || 'mock-openai',
          choices: [
            {
              index: 0,
              delta: { role: 'assistant', content: result.normalized.content },
              finish_reason: null
            }
          ]
        });
        writeSse(res, null, {
          id: chunkId,
          object: 'chat.completion.chunk',
          created: Math.floor(Date.now() / 1000),
          model: body.model || 'mock-openai',
          choices: [
            {
              index: 0,
              delta: {},
              finish_reason: result.normalized.finishReason || 'stop'
            }
          ]
        });
        writeSse(res, null, '[DONE]');
        res.end();
        return;
      }

      respondJson(res, 200, {
        id: randomId('chatcmpl'),
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model: body.model || 'mock-openai',
        choices: [
          {
            index: 0,
            message: { role: 'assistant', content: result.normalized.content },
            finish_reason: result.normalized.finishReason || 'stop'
          }
        ],
        usage: {
          ...usage,
          total_tokens: usage.prompt_tokens + usage.completion_tokens
        }
      });
    } catch (error) {
      if (error instanceof ProviderError) {
        respondError(res, error.statusCode, error.message, error.code, {
          provider: error.provider
        });
        return;
      }
      respondError(res, 500, error.message || 'Internal error', 'INTERNAL_ERROR');
    }
  });

  router.post('/v1/responses', async ({ res, body = {} }) => {
    const canonical = buildCanonicalOpenAIRequest({
      model: body.model,
      messages: Array.isArray(body.input)
        ? body.input.map((item) => ({ role: item.role || 'user', content: item.content }))
        : [],
      stream: body.stream,
      session_id: body.session_id,
      debug: body.debug
    });

    try {
      const { route, result } = await executeWithRouting({ config, canonicalRequest: canonical });
      res.setHeader('x-muxa-provider', route.provider);
      res.setHeader('x-muxa-route', route.usedFallback ? 'fallback' : 'primary');

      respondJson(res, 200, {
        id: randomId('resp'),
        object: 'response',
        created: Math.floor(Date.now() / 1000),
        model: body.model || 'mock-openai',
        output: [
          {
            id: randomId('item'),
            type: 'message',
            role: 'assistant',
            content: [{ type: 'output_text', text: result.normalized.content }]
          }
        ],
        status: 'completed'
      });
    } catch (error) {
      if (error instanceof ProviderError) {
        respondError(res, error.statusCode, error.message, error.code, {
          provider: error.provider
        });
        return;
      }
      respondError(res, 500, error.message || 'Internal error', 'INTERNAL_ERROR');
    }
  });

  router.get('/v1/models', ({ res }) => {
    respondJson(res, 200, {
      data: [
        { id: 'mock-openai', object: 'model', owned_by: 'system' },
        { id: 'mock-anthropic', object: 'model', owned_by: 'system' }
      ]
    });
  });

  router.post('/v1/embeddings', ({ res, body = {} }) => {
    const input = body.input || '';
    const asString = Array.isArray(input) ? input.join(' ') : String(input);
    const base = approximateTokensFromText(asString);
    respondJson(res, 200, {
      data: [
        {
          object: 'embedding',
          embedding: [base / 10, base / 20, base / 30],
          index: 0
        }
      ],
      usage: {
        prompt_tokens: base,
        total_tokens: base
      }
    });
  });

  router.get('/v1/health', ({ res }) => {
    respondJson(res, 200, {
      status: 'ok',
      upstream: {
        openai: 'reachable',
        anthropic: 'reachable'
      }
    });
  });
}

module.exports = { registerOpenAIRoutes };
