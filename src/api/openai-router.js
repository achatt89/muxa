'use strict';

const { respondJson, writeSse, respondError } = require('../http/response');
const { recordSessionTokenUsage, recordRoutingSample, randomId } = require('../state/runtime');
const { approximateTokensFromText, extractTextFromMessages } = require('./utils');
const { injectMemoriesIntoPrompt } = require('../memory/store');
const { executeWithRouting } = require('../routing');
const { ProviderError } = require('../providers/errors');
// eslint-disable-next-line n/no-unpublished-require
const { mapToolCall } = require('../../packages/client-mapping');
const { executeToolCall } = require('../tools/server-executor');
const { convertResponsesToChat } = require('./responses-format');

const logResponses = (config, tag, data) => {
  if (config.logging) {
    console.log(`[responses:${tag}]`, data);
  }
};

function emitSse(config, res, event, payload) {
  if (config.logging) {
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

function normalizeResponsesTools(tools) {
  if (!Array.isArray(tools)) {
    return undefined;
  }
  return tools
    .map((tool) => {
      if (!tool || typeof tool !== 'object') {
        return null;
      }
      const type = typeof tool.type === 'string' ? tool.type.toLowerCase() : '';
      const isFunctionLike = !type || type === 'function' || type === 'custom';
      if (!isFunctionLike) {
        const customPayload =
          tool.custom && typeof tool.custom === 'object' ? { ...tool.custom } : {};
        if (!customPayload.kind) {
          customPayload.kind = tool.type || 'custom';
        }
        if (customPayload.name === undefined) {
          customPayload.name = tool.name || customPayload.kind;
        }
        if (tool.description && customPayload.description === undefined) {
          customPayload.description = tool.description;
        }
        if (tool.parameters && customPayload.parameters === undefined) {
          customPayload.parameters = tool.parameters;
        }
        return {
          ...tool,
          type: 'custom',
          custom: customPayload
        };
      }
      if (tool.function && typeof tool.function === 'object' && type !== 'custom') {
        return {
          ...tool,
          type: 'function'
        };
      }
      const normalized = { ...tool, type: 'function' };
      const fn = {
        name: tool.name || tool.function?.name || '',
        description: tool.description || tool.function?.description,
        parameters:
          tool.parameters ||
          tool.function?.parameters ||
          tool.input_schema ||
          tool.schema ||
          tool.parameters_schema
      };
      if (!fn.name) {
        return tool;
      }
      const cleanedFunction = {};
      cleanedFunction.name = fn.name;
      if (fn.description !== undefined) {
        cleanedFunction.description = fn.description;
      }
      if (fn.parameters !== undefined) {
        cleanedFunction.parameters = fn.parameters;
      }
      normalized.function = cleanedFunction;
      return normalized;
    })
    .filter(Boolean);
}

// removed helper functions now handled by responses-format

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

function detectClient(headers = {}) {
  const ua = String(headers['user-agent'] || '').toLowerCase();
  const clientHeader = String(headers['x-client'] || headers['x-client-name'] || '').toLowerCase();
  if (ua.includes('codex') || clientHeader.includes('codex')) return 'codex';
  if (ua.includes('cursor') || clientHeader.includes('cursor')) return 'cursor';
  if (ua.includes('cline') || clientHeader.includes('cline') || ua.includes('kilo')) return 'cline';
  if (ua.includes('continue') || clientHeader.includes('continue')) return 'continue';
  return 'unknown';
}

function mapToolCallsForClient(toolCalls = [], clientType = 'unknown') {
  if (!toolCalls.length || clientType === 'unknown') {
    return toolCalls;
  }

  return toolCalls.map((call, index) => {
    const fnName = call.function?.name || call.name || '';
    let args = call.function?.arguments || call.arguments || '{}';
    if (typeof args !== 'string') {
      try {
        args = JSON.stringify(args);
      } catch {
        args = '{}';
      }
    }

    let mapped;
    try {
      mapped = mapToolCall(clientType, { name: fnName, arguments: JSON.parse(args) });
    } catch {
      mapped = mapToolCall(clientType, { name: fnName, arguments: args });
    }

    const normalizedArgs =
      typeof mapped.arguments === 'string'
        ? mapped.arguments
        : JSON.stringify(mapped.arguments || {});

    return {
      ...call,
      id: call.id || randomId(`call_${index}`),
      function: {
        ...(call.function || {}),
        name: mapped.name,
        arguments: normalizedArgs
      }
    };
  });
}

function buildCanonicalOpenAIRequest(config, body, options = {}) {
  const defaultStream = options.defaultStream ?? false;
  const messages = body.messages || [];
  const promptLength = JSON.stringify(messages).length;
  const tools = normalizeResponsesTools(body.tools);
  const requiresTools = Boolean(tools && tools.length);
  const stream = coerceBoolean(body.stream, defaultStream);
  const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
  const msgContext = lastUserMsg
    ? typeof lastUserMsg.content === 'string'
      ? lastUserMsg.content
      : JSON.stringify(lastUserMsg.content)
    : '';
  const msgScore = Math.ceil(msgContext.length / 500);
  const historyScore = Math.floor(promptLength / 40000); // 40k tokens per point
  const complexityScore = msgScore + historyScore + (requiresTools ? 1 : 0);
  if (config.logging) {
    console.log(
      `\n>>> [muxa:score] MSG: ${msgScore} | HISTORY: ${historyScore} | TOOLS: ${requiresTools ? 1 : 0} | TOTAL: ${complexityScore} (threshold: 3)`
    );
    console.log(`>>> [muxa:info] promptLength: ${promptLength.toLocaleString()} chars\n`);
  }
  return {
    api: 'openai',
    model: body.model || 'gpt-4-turbo',
    messages,
    tools,
    tool_choice: body.tool_choice,
    requiresTools,
    complexityScore,
    stream,
    metadata: {
      sessionId: body.session_id || body.user || 'demo'
    },
    debug: body.debug
  };
}

function normalizeUsageMetrics(raw = {}) {
  const input = Math.ceil(raw.input_tokens ?? raw.prompt_tokens ?? 0);
  const output = Math.ceil(raw.output_tokens ?? raw.completion_tokens ?? 0);
  const total = Math.ceil(raw.total_tokens ?? input + output);
  return {
    input_tokens: input,
    output_tokens: output,
    total_tokens: total
  };
}

function createResponsePayload({ model, text, toolCalls = [], toolResults = [], usage }) {
  const responseId = randomId('resp');
  const createdAt = Math.floor(Date.now() / 1000);
  const normalizedUsage = normalizeUsageMetrics(usage || {});
  const toolCallItems = toolCalls.map((call, idx) => ({
    id: call.id || randomId(`call_${idx}`),
    type: 'function_call',
    status: 'completed',
    name: call.function?.name || call.name || 'function',
    arguments: call.function?.arguments || call.arguments || '{}',
    call_id: call.id || randomId(`call_ref_${idx}`)
  }));
  let messageItem = null;
  if (text) {
    messageItem = {
      id: randomId('msg'),
      type: 'message',
      status: 'completed',
      role: 'assistant',
      content: [
        {
          type: 'output_text',
          text
        }
      ]
    };
  }
  const toolResultItems = (toolResults || [])
    .filter((result) => result && typeof result.text === 'string')
    .map((result, idx) => ({
      id: result.id || randomId(`toolres_${idx}`),
      type: 'message',
      role: result.role || 'tool',
      status: 'completed',
      metadata: result.toolCallId ? { tool_call_id: result.toolCallId } : undefined,
      content: [
        {
          type: 'output_text',
          text: result.text
        }
      ]
    }));
  const outputItems = [...toolCallItems, ...toolResultItems, ...(messageItem ? [messageItem] : [])];
  const payload = {
    id: responseId,
    object: 'response',
    created: createdAt,
    created_at: createdAt,
    model,
    status: 'completed',
    output: outputItems,
    usage: normalizedUsage,
    metadata: {}
  };
  return { payload, toolCallItems, toolResultItems, messageItem, text };
}

function extractResponseParts(payload = {}) {
  const result = {
    toolCallItems: [],
    toolResultItems: [],
    messageItem: null,
    text: ''
  };
  for (const item of payload.output || []) {
    if (item.type === 'function_call') {
      result.toolCallItems.push(item);
    } else if (item.type === 'message' && item.role === 'tool') {
      result.toolResultItems.push(item);
    } else if (!result.messageItem && item.type === 'message') {
      result.messageItem = item;
    }
  }
  if (result.messageItem) {
    const textPart = (result.messageItem.content || []).find((part) => part.type === 'output_text');
    result.text = textPart?.text || '';
  }
  return result;
}

function streamResponsesSse(config, res, payload, parts = {}) {
  const timestamp = payload.created_at || payload.created || Math.floor(Date.now() / 1000);
  let sequenceNumber = 0;
  let outputIndex = 0;
  const buildLegacyOutput = () => {
    const legacy = [];
    (parts.toolCallItems || []).forEach((item) => legacy.push(item));
    (parts.toolResultItems || []).forEach((item) => legacy.push(item));
    if (parts.messageItem) {
      legacy.push(parts.messageItem);
    }
    return legacy;
  };
  const outputItems =
    Array.isArray(payload.output) && payload.output.length ? payload.output : buildLegacyOutput();
  const baseResponse = {
    id: payload.id,
    object: payload.object,
    created_at: timestamp,
    created: timestamp,
    model: payload.model,
    status: 'in_progress',
    output: [],
    metadata: payload.metadata || {},
    usage: payload.usage || null
  };

  const sendEvent = (event, extra) => {
    emitSse(config, res, event, {
      type: event,
      sequence_number: sequenceNumber++,
      ...extra
    });
  };

  const streamFunctionCall = (item) => {
    const callId = item.id || randomId('call');
    const normalized = {
      id: callId,
      type: 'function_call',
      status: item.status || 'completed',
      name: item.name || item.function?.name || 'function',
      arguments: item.arguments || item.function?.arguments || '{}',
      call_id: item.call_id || callId
    };

    sendEvent('response.output_item.added', {
      output_index: outputIndex,
      item: normalized
    });
    sendEvent('response.function_call_arguments.delta', {
      item_id: normalized.id,
      output_index: outputIndex,
      delta: normalized.arguments
    });
    sendEvent('response.function_call_arguments.done', {
      item_id: normalized.id,
      output_index: outputIndex,
      arguments: normalized.arguments
    });
    sendEvent('response.output_item.done', {
      output_index: outputIndex,
      item: normalized
    });
    outputIndex += 1;
  };

  const streamMessageItem = (item) => {
    const itemId = item.id || randomId('msg');
    const metadata = item.metadata ? { metadata: item.metadata } : {};
    const textPart =
      (Array.isArray(item.content) ? item.content : []).find(
        (part) => part.type === 'output_text'
      ) || null;
    const textContent = typeof textPart?.text === 'string' ? textPart.text : '';
    const addedItem = {
      id: itemId,
      type: 'message',
      status: 'in_progress',
      role: item.role || 'assistant',
      content: [],
      ...metadata
    };

    sendEvent('response.output_item.added', {
      output_index: outputIndex,
      item: addedItem
    });
    sendEvent('response.content_part.added', {
      item_id: itemId,
      output_index: outputIndex,
      content_index: 0,
      part: {
        type: 'output_text',
        text: ''
      }
    });

    const chunks = textContent ? textContent.match(/[\s\S]{1,40}/g) || [] : [''];
    for (const chunk of chunks) {
      sendEvent('response.output_text.delta', {
        item_id: itemId,
        output_index: outputIndex,
        content_index: 0,
        delta: chunk
      });
    }

    sendEvent('response.output_text.done', {
      item_id: itemId,
      output_index: outputIndex,
      content_index: 0,
      text: textContent
    });
    sendEvent('response.content_part.done', {
      item_id: itemId,
      output_index: outputIndex,
      content_index: 0,
      part: {
        type: 'output_text',
        text: textContent
      }
    });
    const completedItem = {
      ...item,
      id: itemId,
      content:
        Array.isArray(item.content) && item.content.length
          ? item.content
          : [{ type: 'output_text', text: textContent }]
    };

    sendEvent('response.output_item.done', {
      output_index: outputIndex,
      item: completedItem
    });
    outputIndex += 1;
  };

  sendEvent('response.created', { response: baseResponse });
  sendEvent('response.in_progress', { response: baseResponse });

  for (const item of outputItems) {
    if (!item || typeof item !== 'object') {
      continue;
    }
    if (item.type === 'function_call') {
      streamFunctionCall(item);
      continue;
    }
    if (item.type === 'message') {
      streamMessageItem(item);
    }
  }

  sendEvent('response.completed', {
    response: {
      ...payload,
      created_at: payload.created_at || payload.created || timestamp,
      created: payload.created || timestamp
    }
  });

  emitSse(config, res, null, '[DONE]');
  res.end();
}

function registerOpenAIRoutes(
  router,
  { runtime, config, memoryStore, promptCache, semanticCache }
) {
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
    const canonical = buildCanonicalOpenAIRequest(config, body, { defaultStream: false });
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

      if (config.logging) {
        console.log(
          `[muxa:routing] decision: ${route.usedFallback ? 'FALLBACK' : 'PRIMARY'} (provider: ${route.provider}, score: ${route.score}, threshold: 3)`
        );
      }
      recordRoutingSample(runtime, {
        provider: route.provider,
        usedFallback: route.usedFallback,
        latencyMs: 0, // Latency tracking not fully implemented in router yet
        score: route.score
      });

      const usage = {
        prompt_tokens:
          result.normalized.usage.prompt_tokens ?? result.normalized.usage.input_tokens ?? 0,
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
        const streamModel = body.model || 'mock-openai';
        const created = Math.floor(Date.now() / 1000);
        const toolCalls = result.normalized.toolCalls || [];
        for (const toolCall of toolCalls) {
          writeSse(res, null, {
            id: chunkId,
            object: 'chat.completion.chunk',
            created,
            model: streamModel,
            choices: [
              {
                index: 0,
                delta: {
                  tool_calls: [
                    {
                      index: 0,
                      id: toolCall.id || randomId('call'),
                      type: toolCall.type || 'function',
                      function: {
                        name: toolCall.function?.name || '',
                        arguments: toolCall.function?.arguments || ''
                      }
                    }
                  ]
                },
                finish_reason: null
              }
            ]
          });
        }
        if (result.normalized.content) {
          writeSse(res, null, {
            id: chunkId,
            object: 'chat.completion.chunk',
            created,
            model: streamModel,
            choices: [
              {
                index: 0,
                delta: { role: 'assistant', content: result.normalized.content },
                finish_reason: null
              }
            ]
          });
        }
        writeSse(res, null, {
          id: chunkId,
          object: 'chat.completion.chunk',
          created,
          model: streamModel,
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
            message: {
              role: 'assistant',
              content: result.normalized.content,
              tool_calls:
                result.normalized.toolCalls && result.normalized.toolCalls.length
                  ? result.normalized.toolCalls
                  : undefined
            },
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
    logResponses(config, 'request', {
      method: req.method,
      path: req.pathname || '/v1/responses',
      stream: body?.stream
    });
    const converted = convertResponsesToChat(body);
    const memoryPayload = { messages: converted.messages };
    const { query } = injectMemoriesIfNeeded(memoryPayload);
    const cacheKey = cacheKeyFromMessages(memoryPayload.messages || []);
    const canonical = buildCanonicalOpenAIRequest(
      config,
      {
        model: converted.model || body.model,
        messages: memoryPayload.messages,
        tools: converted.tools || body.tools,
        tool_choice: converted.tool_choice || body.tool_choice,
        stream: converted.stream ?? body.stream,
        session_id: body.session_id,
        debug: body.debug
      },
      { defaultStream: false }
    );

    try {
      const cached = getCachedResponse(cacheKey, query, canonical.model);
      if (cached) {
        const acceptsSse = String(req.headers.accept || '')
          .toLowerCase()
          .includes('text/event-stream');
        const enableStream = canonical.stream === true && acceptsSse;
        logResponses(config, 'streaming-check', {
          cached: true,
          enableStream
        });
        if (!enableStream) {
          respondJson(res, 200, cached);
        } else {
          res.statusCode = 200;
          res.setHeader('content-type', 'text/event-stream');
          res.setHeader('cache-control', 'no-cache');
          const cachedParts = extractResponseParts(cached);
          streamResponsesSse(res, cached, cachedParts);
        }
        return;
      }

      const { route, result } = await executeWithRouting({ config, canonicalRequest: canonical });
      res.setHeader('x-muxa-provider', route.provider);
      res.setHeader('x-muxa-route', route.usedFallback ? 'fallback' : 'primary');
      if (config.logging) {
        console.log(
          `[muxa:routing] decision: ${route.usedFallback ? 'FALLBACK' : 'PRIMARY'} (provider: ${route.provider}, score: ${route.score}, threshold: 3)`
        );
      }
      recordRoutingSample(runtime, {
        provider: route.provider,
        usedFallback: route.usedFallback,
        latencyMs: 0,
        score: route.score
      });

      const clientType = detectClient(req.headers);
      const serverToolCalls = result.normalized.toolCalls || [];
      const toolResults = [];
      for (const call of serverToolCalls) {
        try {
          const text = await executeToolCall(call);
          toolResults.push({ toolCallId: call.id, text });
        } catch (toolError) {
          toolResults.push({
            toolCallId: call.id,
            text: `Tool "${call.function?.name || call.name}" failed: ${toolError.message}`
          });
        }
      }
      const normalizedToolCalls = mapToolCallsForClient(serverToolCalls, clientType);
      const resultText = result.normalized.content || '';
      if (config.logging) {
        console.log(`[muxa:router] resultText length: ${resultText.length}`);
        if (resultText.length === 0) {
          console.log('[muxa:router] WARNING: resultText is EMPTY');
        }
      }
      const { payload, toolCallItems, toolResultItems, messageItem } = createResponsePayload({
        model: body.model || 'mock-openai',
        text: resultText,
        toolCalls: normalizedToolCalls,
        toolResults,
        usage: result.normalized.usage
      });
      const acceptsSse = String(req.headers.accept || '')
        .toLowerCase()
        .includes('text/event-stream');
      const enableStream = canonical.stream === true && acceptsSse;
      logResponses(config, 'streaming-check', {
        enableStream,
        clientType,
        toolCallCount: normalizedToolCalls.length
      });

      if (!enableStream) {
        respondJson(res, 200, payload);
      } else {
        res.statusCode = 200;
        res.setHeader('content-type', 'text/event-stream');
        res.setHeader('cache-control', 'no-cache');
        streamResponsesSse(config, res, payload, {
          toolCallItems,
          toolResultItems,
          messageItem,
          text: resultText
        });
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

module.exports = {
  registerOpenAIRoutes,
  normalizeResponsesTools,
  buildCanonicalOpenAIRequest
};
