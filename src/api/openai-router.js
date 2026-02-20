'use strict';

const { respondJson, writeSse, respondError } = require('../http/response');
const { recordSessionTokenUsage, randomId } = require('../state/runtime');
const { approximateTokensFromText, extractTextFromMessages } = require('./utils');
const { injectMemoriesIntoPrompt } = require('../memory/store');
const { executeWithRouting } = require('../routing');
const { ProviderError } = require('../providers/errors');

const shouldLogResponses = /^true|1|yes$/i.test(process.env.MUXA_LOG_RESPONSES || '');

const logResponses = (tag, data) => {
  if (shouldLogResponses) {
    console.log(`[responses:${tag}]`, data);
  }
};

function emitSse(res, event, payload) {
  if (shouldLogResponses) {
    const printable = typeof payload === 'string' ? payload : JSON.stringify(payload);
    console.log(`[responses:sse] ${event || 'message'} ${printable}`);
  }
  writeSse(res, event, payload);
}

const TRUE_VALUES = new Set(['true', '1', 'yes', 'on']);
const FALSE_VALUES = new Set(['false', '0', 'no', 'off']);
const DEFAULT_MODEL_IDS = [
  'gpt-5.3-codex',
  'gpt-5.2-codex',
  'gpt-5.1-codex',
  'gpt-5.2',
  'gpt-5.1',
  'gpt-4.1',
  'gpt-4.1-mini',
  'gpt-4.1-nano',
  'gpt-4o',
  'gpt-4o-mini',
  'gpt-4o-mini-2024-07-18',
  'gpt-5-mini',
  'gpt-5-mini-2025-08-07'
];

function coerceBoolean(value, defaultValue) {
  if (value === undefined || value === null) {
    return defaultValue;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (TRUE_VALUES.has(normalized)) {
      return true;
    }
    if (FALSE_VALUES.has(normalized)) {
      return false;
    }
  }
  return Boolean(value);
}

function buildCanonicalOpenAIRequest(body, options = {}) {
  const defaultStream = options.defaultStream ?? false;
  const messages = body.messages || [];
  const promptLength = JSON.stringify(messages).length;
  const requiresTools = Boolean(body.tools && body.tools.length);
  const stream = coerceBoolean(body.stream, defaultStream);
  return {
    api: 'openai',
    model: body.model || 'gpt-4-turbo',
    messages,
    tools: body.tools,
    tool_choice: body.tool_choice,
    requiresTools,
    complexityScore: Math.round(promptLength / 400) + (requiresTools ? 2 : 0),
    stream,
    metadata: {
      sessionId: body.session_id || body.user || 'demo'
    },
    debug: body.debug
  };
}

function streamResponsesSse(res, payload, text, options = {}) {
  const timestamp = Math.floor(Date.now() / 1000);
  let sequenceNumber = 0;
  const responseId = payload.id;
  const messageId = randomId('msg');
  const outputIndex = 0;
  const contentText = text || '';
  const baseResponse = {
    id: responseId,
    object: payload.object,
    created: payload.created || timestamp,
    model: payload.model,
    status: 'in_progress',
    output: [],
    metadata: payload.metadata || {},
    usage: payload.usage || null
  };

  const sendEvent = (event, extra) => {
    emitSse(res, event, {
      type: event,
      sequence_number: sequenceNumber++,
      ...extra
    });
  };

  sendEvent('response.created', { response: baseResponse });
  sendEvent('response.in_progress', { response: baseResponse });

  sendEvent('response.output_item.added', {
    output_index: outputIndex,
    item: {
      id: messageId,
      type: 'message',
      status: 'in_progress',
      role: 'assistant',
      content: []
    }
  });

  sendEvent('response.content_part.added', {
    item_id: messageId,
    output_index: outputIndex,
    content_index: 0,
    part: {
      type: 'output_text',
      text: ''
    }
  });

  const chunks = contentText ? contentText.match(/[\s\S]{1,40}/g) || [] : [];
  if (chunks.length === 0) {
    chunks.push('');
  }
  for (const chunk of chunks) {
    sendEvent('response.output_text.delta', {
      item_id: messageId,
      output_index: outputIndex,
      content_index: 0,
      delta: chunk
    });
  }

  sendEvent('response.output_text.done', {
    item_id: messageId,
    output_index: outputIndex,
    content_index: 0,
    text: contentText
  });

  sendEvent('response.content_part.done', {
    item_id: messageId,
    output_index: outputIndex,
    content_index: 0,
    part: {
      type: 'output_text',
      text: contentText
    }
  });

  const completedMessage = {
    id: messageId,
    type: 'message',
    status: 'completed',
    role: 'assistant',
    content: [
      {
        type: 'output_text',
        text: contentText
      }
    ]
  };

  sendEvent('response.output_item.done', {
    output_index: outputIndex,
    item: completedMessage
  });

  sendEvent('response.completed', {
    response: {
      ...payload,
      status: 'completed',
      output: [completedMessage],
      metadata: payload.metadata || {},
      usage: payload.usage || null
    }
  });

  emitSse(res, null, '[DONE]');
  res.end();
}

function registerOpenAIRoutes(router, { runtime, config, memoryStore, promptCache, semanticCache }) {
  const listAvailableModels = () => {
    const timestamp = Math.floor(Date.now() / 1000);
    const models = [];
    const seen = new Set();
    const addModel = (id, ownedBy = config.primaryProvider || 'openai') => {
      if (!id || typeof id !== 'string') {
        return;
      }
      const trimmed = id.trim();
      if (!trimmed) {
        return;
      }
      const key = trimmed.toLowerCase();
      if (seen.has(key)) {
        return;
      }
      seen.add(key);
      models.push({
        id: trimmed,
        object: 'model',
        created: timestamp,
        owned_by: ownedBy,
        root: trimmed,
        parent: null,
        permission: []
      });
    };

    const openaiConfig = config.providers?.openai || {};
    addModel(openaiConfig.model);
    (openaiConfig.fallbackModels || []).forEach((modelId) => addModel(modelId));
    const aliases = openaiConfig.modelAliases || {};
    Object.keys(aliases).forEach((alias) => addModel(alias));
    Object.values(aliases).forEach((target) => addModel(target));
    DEFAULT_MODEL_IDS.forEach((modelId) => addModel(modelId, 'openai'));

    if (!models.length) {
      addModel('mock-openai', 'system');
    }

    return models;
  };

  const cacheKeyFromMessages = (messages = []) => JSON.stringify(messages);

  const getCachedResponse = (key, query, model) => {
    const promptHit = promptCache?.get(key, model);
    if (promptHit) {
      return promptHit;
    }
    if (semanticCache && query) {
      const semanticHit = semanticCache.get(query);
      if (semanticHit) {
        return semanticHit.response;
      }
    }
    return null;
  };

  const storeCaches = (key, query, model, payload) => {
    promptCache?.set(key, model, payload);
    if (semanticCache && query) {
      semanticCache.set(query, payload);
    }
  };

  const injectMemoriesIfNeeded = (body) => {
    if (!memoryStore || !memoryStore.retrieveTop) {
      return { query: '' };
    }
    const query = Array.isArray(body.messages) ? extractTextFromMessages(body.messages) : '';
    if (!query) {
      return { query };
    }
    const memories = memoryStore.retrieveTop({ query, limit: config.optimization.memory.topK });
    if (memories.length) {
      const injection = injectMemoriesIntoPrompt('', memories);
      body.messages = [{ role: 'system', content: injection }, ...(body.messages || [])];
    }
    return { query };
  };
  router.post('/v1/chat/completions', async ({ res, body = {} }) => {
    const { query } = injectMemoriesIfNeeded(body);
    const cacheKey = cacheKeyFromMessages(body.messages || []);
    const canonical = buildCanonicalOpenAIRequest(body, { defaultStream: false });
    try {
      if (!canonical.stream) {
        const cached = getCachedResponse(cacheKey, query, canonical.model);
        if (cached) {
          respondJson(res, 200, cached);
          return;
        }
      }

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

      const payload = {
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
      };

      respondJson(res, 200, payload);

      if (!canonical.stream) {
        storeCaches(cacheKey, query, canonical.model, payload);
      }
      if (memoryStore && query && result.normalized.content) {
        memoryStore.addCandidate({
          content: `Q: ${query}\nA: ${result.normalized.content}`,
          surprise: Math.min(1, result.normalized.content.length / 400),
          importance: 0.5
        });
      }
    } catch (error) {
      if (error instanceof ProviderError) {
        const meta = { provider: error.provider };
        if (error.metadata) {
          meta.details = error.metadata;
        }
        respondError(res, error.statusCode, error.message, error.code, meta);
        return;
      }
      respondError(res, 500, error.message || 'Internal error', 'INTERNAL_ERROR');
    }
  });

  router.post('/v1/responses', async ({ req, res, body = {} }) => {
    logResponses('request', {
      headers: req.headers,
      stream: body?.stream,
      wire_api: body?.wire_api,
      client: body?.client
    });
    const normalizedInput = Array.isArray(body.input)
      ? body.input.map((item) => ({ role: item.role || 'user', content: item.content }))
      : [];
    const memoryPayload = { messages: normalizedInput };
    const { query } = injectMemoriesIfNeeded(memoryPayload);
    const cacheKey = cacheKeyFromMessages(memoryPayload.messages || []);
    const canonical = buildCanonicalOpenAIRequest({
      model: body.model,
      messages: memoryPayload.messages,
      stream: body.stream,
      session_id: body.session_id,
      debug: body.debug
    }, { defaultStream: false });

    try {
      const cached = getCachedResponse(cacheKey, query, canonical.model);
      if (cached) {
        const acceptsSse = String(req.headers.accept || '').toLowerCase().includes('text/event-stream');
        const enableStream = canonical.stream === true && acceptsSse;
        logResponses('streaming-check', {
          prefersJson: !canonical.stream,
          acceptsSse,
          canonicalStream: canonical.stream,
          enableStream,
          cached: true
        });
        if (!enableStream) {
          respondJson(res, 200, cached);
        } else {
          res.statusCode = 200;
          res.setHeader('content-type', 'text/event-stream');
          res.setHeader('cache-control', 'no-cache');
          streamResponsesSse(res, cached, cached.output[0]?.content[0]?.text || '');
        }
        return;
      }

      const { route, result } = await executeWithRouting({ config, canonicalRequest: canonical });
      res.setHeader('x-muxa-provider', route.provider);
      res.setHeader('x-muxa-route', route.usedFallback ? 'fallback' : 'primary');


      const payload = {
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
      };
      const acceptsSse = String(req.headers.accept || '').toLowerCase().includes('text/event-stream');
      const enableStream = canonical.stream === true && acceptsSse;
      logResponses('streaming-check', {
        prefersJson: !canonical.stream,
        acceptsSse,
        canonicalStream: canonical.stream,
        enableStream
      });

      if (!enableStream) {
        respondJson(res, 200, payload);
      } else {
        res.statusCode = 200;
        res.setHeader('content-type', 'text/event-stream');
        res.setHeader('cache-control', 'no-cache');
        streamResponsesSse(res, payload, result.normalized.content);
      }

      storeCaches(cacheKey, query, canonical.model, payload);
    } catch (error) {
      if (error instanceof ProviderError) {
        const meta = { provider: error.provider };
        if (error.metadata) {
          meta.details = error.metadata;
        }
        respondError(res, error.statusCode, error.message, error.code, meta);
        return;
      }
      respondError(res, 500, error.message || 'Internal error', 'INTERNAL_ERROR');
    }
  });

  router.get('/v1/models', ({ res }) => {
    const data = listAvailableModels();
    respondJson(res, 200, {
      object: 'list',
      data
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
