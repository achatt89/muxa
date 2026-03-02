'use strict';

const { respondJson, respondError, writeSse } = require('../http/response');
const { recordSessionTokenUsage, recordRoutingSample, randomId } = require('../state/runtime');
const { extractTextFromMessages, approximateTokensFromText } = require('./utils');
const { injectMemoriesIntoPrompt } = require('../memory/store');
const { executeWithRouting } = require('../routing');
const { ProviderError } = require('../providers/errors');
const { buildDashboardPage } = require('../dashboard/page');
const { getDashboardCss, getDashboardScript } = require('../dashboard/assets');

function buildCanonicalAnthropicRequest(body) {
  const contentScore = (body.messages || [])
    .map((msg) => (typeof msg.content === 'string' ? msg.content.length : 0))
    .reduce((sum, len) => sum + len, 0);

  const requiresTools = (body.messages || []).some((msg) =>
    Array.isArray(msg.content) ? msg.content.some((part) => part.type === 'tool_use') : false
  );

  return {
    api: 'anthropic',
    model: body.model || 'claude-3',
    messages: body.messages || [],
    system: body.system || '',
    requiresTools,
    complexityScore: Math.round(contentScore / 400) + (requiresTools ? 2 : 0),
    metadata: {
      sessionId: body.session_id || 'demo'
    },
    stream: Boolean(body.stream),
    debug: body.debug
  };
}

function sanitizeAnthropicMessages(messages = []) {
  const sanitized = [];
  let pendingToolIds = new Set();

  for (const entry of messages || []) {
    if (!entry || typeof entry !== 'object') {
      continue;
    }
    const clone = {
      ...entry,
      content: Array.isArray(entry.content)
        ? entry.content.map((part) => (part && typeof part === 'object' ? { ...part } : part))
        : entry.content
    };

    if (clone.role === 'assistant') {
      if (Array.isArray(clone.content)) {
        const toolIds = new Set();
        clone.content = clone.content.map((part) => {
          if (part && part.type === 'tool_use') {
            const toolId = part.id || randomId('tool');
            toolIds.add(toolId);
            return { ...part, id: toolId };
          }
          return part;
        });
        pendingToolIds = toolIds;
      } else {
        pendingToolIds = new Set();
      }
    }

    if (clone.role === 'tool') {
      const toolId = clone.tool_use_id || clone.id;
      if (!toolId || !pendingToolIds.has(toolId)) {
        clone.role = 'assistant';
        delete clone.tool_use_id;
      } else {
        const nextPending = new Set(pendingToolIds);
        nextPending.delete(toolId);
        pendingToolIds = nextPending;
      }
    } else if (clone.role !== 'assistant') {
      pendingToolIds = new Set();
    }

    sanitized.push(clone);
  }

  return sanitized;
}

function registerCoreRoutes(router, context) {
  const {
    config,
    runtime,
    bootTime,
    headroomSidecar,
    compressionEngine,
    memoryStore,
    promptCache,
    semanticCache
  } = context;

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

    const query = extractTextFromMessages(body.messages || []);
    if (!query) {
      return { query };
    }

    const memories = memoryStore.retrieveTop({
      query,
      limit: config.optimization.memory.topK
    });

    if (memories.length) {
      const injection = injectMemoriesIntoPrompt('', memories);
      body.messages = [{ role: 'system', content: injection }, ...(body.messages || [])];
    }

    return { query };
  };

  router.get('/health', ({ res }) => {
    respondJson(res, 200, {
      status: 'ok',
      service: config.serviceName,
      version: config.version,
      uptimeMs: Date.now() - bootTime
    });
  });

  router.get('/health/live', ({ res }) => {
    respondJson(res, 200, { status: 'ok' });
  });

  router.get('/health/ready', ({ res }) => {
    respondJson(res, 200, { status: 'ready', checks: [] });
  });

  router.get('/health/headroom', ({ res }) => {
    const status = headroomSidecar?.getStatus?.() || { status: 'disabled' };
    respondJson(res, 200, status);
  });

  router.get('/metrics', ({ res }) => {
    respondJson(res, 200, {
      requests: runtime.metrics.totalRequests,
      perRoute: runtime.metrics.perRoute
    });
  });

  router.get('/metrics/observability', ({ res }) => {
    respondJson(res, 200, {
      structuredLogging: true,
      metricsFamilies: ['requests', 'latency', 'tokens']
    });
  });

  router.get('/metrics/prometheus', ({ res }) => {
    res.statusCode = 200;
    res.setHeader('content-type', 'text/plain; version=0.0.4');
    res.end(`muxa_requests_total ${runtime.metrics.totalRequests}\n`);
  });

  router.get('/metrics/compression', ({ res }) => {
    const metrics = compressionEngine?.getMetrics?.() || { mode: 'audit', totalSavings: 0 };
    respondJson(res, 200, metrics);
  });

  router.get('/metrics/circuit-breakers', ({ res }) => {
    respondJson(res, 200, { states: [] });
  });

  router.get('/metrics/load-shedding', ({ res }) => {
    respondJson(res, 200, { windowRps: 0, dropped: 0 });
  });

  router.get('/metrics/worker-pool', ({ res }) => {
    respondJson(res, 200, { size: 0, busy: 0 });
  });

  router.get('/metrics/semantic-cache', ({ res }) => {
    respondJson(res, 200, { hits: 0, misses: 0 });
  });

  router.get('/metrics/lazy-tools', ({ res }) => {
    respondJson(res, 200, { loadedTools: [] });
  });

  router.get('/routing/stats', ({ res }) => {
    respondJson(res, 200, {
      strategy: config.routingStrategy,
      primaryProvider: config.primaryProvider,
      fallbackProvider: config.fallbackProvider,
      samples: runtime.routingSamples.slice(-25)
    });
  });

  router.get('/debug/session', ({ res, url }) => {
    const sessionId = url.searchParams.get('sessionId');
    if (!sessionId) {
      respondError(res, 400, 'sessionId query param required', 'BAD_REQUEST');
      return;
    }

    const session = runtime.sessions.get(sessionId);
    if (!session) {
      respondError(res, 404, 'Session not found', 'NOT_FOUND');
      return;
    }

    respondJson(res, 200, session);
  });

  router.get('/v1/agents', ({ res }) => {
    respondJson(res, 200, Array.from(runtime.agentExecutions.values()));
  });

  router.get('/v1/agents/stats', ({ res }) => {
    const stats = {
      total: runtime.agentExecutions.size,
      active: Array.from(runtime.agentExecutions.values()).filter(
        (agent) => agent.status === 'running'
      ).length
    };
    respondJson(res, 200, stats);
  });

  router.get('/v1/agents/:agentId/transcript', ({ res, params }) => {
    const agent = runtime.agentExecutions.get(params.agentId);
    if (!agent) {
      respondError(res, 404, 'Agent not found', 'NOT_FOUND');
      return;
    }

    respondJson(res, 200, { agentId: agent.id, transcript: agent.transcript });
  });

  router.get('/v1/agents/:executionId', ({ res, params }) => {
    const agent = runtime.agentExecutions.get(params.executionId);
    if (!agent) {
      respondError(res, 404, 'Execution not found', 'NOT_FOUND');
      return;
    }

    respondJson(res, 200, agent);
  });

  router.get('/api/sessions/:sessionId/tokens', ({ res, params }) => {
    const session = runtime.sessions.get(params.sessionId);
    if (!session) {
      respondError(res, 404, 'Session not found', 'NOT_FOUND');
      return;
    }

    respondJson(res, 200, session.tokens);
  });

  router.get('/api/tokens/stats', ({ res }) => {
    const totals = { input: 0, output: 0 };
    for (const session of runtime.sessions.values()) {
      totals.input += session.tokens.input;
      totals.output += session.tokens.output;
    }
    respondJson(res, 200, totals);
  });

  router.post('/api/event_logging/batch', ({ res, body = {} }) => {
    respondJson(res, 202, {
      status: 'accepted',
      received: Array.isArray(body.events) ? body.events.length : 0
    });
  });

  router.get('/dashboard', ({ res }) => {
    res.setHeader('content-type', 'text/html; charset=utf-8');
    res.end(buildDashboardPage());
  });

  router.get('/dashboard/app.css', ({ res }) => {
    res.setHeader('content-type', 'text/css; charset=utf-8');
    res.end(getDashboardCss());
  });

  router.get('/dashboard/app.js', ({ res }) => {
    res.setHeader('content-type', 'application/javascript; charset=utf-8');
    res.end(getDashboardScript());
  });

  router.get('/headroom/status', ({ res }) => {
    const status = headroomSidecar?.getStatus?.() || { status: 'disabled' };
    respondJson(res, 200, status);
  });

  router.get('/headroom/logs', ({ res }) => {
    respondJson(res, 200, { entries: [] });
  });

  router.post('/headroom/restart', async ({ res }) => {
    await headroomSidecar?.restart?.();
    respondJson(res, 202, { status: 'restarting' });
  });

  router.post('/v1/messages', async ({ res, body = {} }) => {
    body.messages = sanitizeAnthropicMessages(body.messages || []);
    const { query } = injectMemoriesIfNeeded(body);
    const cacheKey = cacheKeyFromMessages(body.messages || []);
    const canonical = buildCanonicalAnthropicRequest(body);
    try {
      if (!canonical.stream) {
        const cached = getCachedResponse(cacheKey, query, canonical.model);
        if (cached) {
          respondJson(res, 200, cached.payload);
          return;
        }
      }

      const { route, result } = await executeWithRouting({ config, canonicalRequest: canonical });

      res.setHeader('x-muxa-provider', route.provider);
      res.setHeader('x-muxa-route', route.usedFallback ? 'fallback' : 'primary');
      res.setHeader('x-muxa-routing-score', String(route.score));

      recordRoutingSample(runtime, {
        provider: route.provider,
        usedFallback: route.usedFallback,
        latencyMs: 0,
        score: route.score
      });

      const usage = {
        input_tokens:
          result.normalized.usage.input_tokens ?? result.normalized.usage.prompt_tokens ?? 0,
        output_tokens:
          result.normalized.usage.output_tokens ?? result.normalized.usage.completion_tokens ?? 0
      };

      recordSessionTokenUsage(runtime, canonical.metadata.sessionId, {
        input: usage.input_tokens,
        output: usage.output_tokens
      });

      const responseText = result.normalized.content;
      const finishReason = result.normalized.finishReason || 'end_turn';
      const stopReason = finishReason === 'stop' ? 'end_turn' : finishReason;

      if (canonical.stream) {
        res.statusCode = 200;
        res.setHeader('content-type', 'text/event-stream');
        res.setHeader('cache-control', 'no-cache');
        const msgId = randomId('msg');
        writeSse(res, 'message_start', { message: { id: msgId, role: 'assistant' } });
        writeSse(res, 'content_block_start', { index: 0, content_block: { type: 'text' } });
        writeSse(res, 'content_block_delta', {
          index: 0,
          delta: { type: 'text_delta', text: responseText }
        });
        writeSse(res, 'content_block_stop', { index: 0 });
        writeSse(res, 'message_delta', { delta: { stop_reason: stopReason } });
        writeSse(res, 'message_stop', { id: msgId });
        res.end();
        return;
      }

      const payload = {
        id: randomId('msg'),
        type: 'message',
        role: 'assistant',
        model: body.model || 'mock-anthropic',
        content: [{ type: 'text', text: responseText }],
        usage,
        stop_reason: stopReason
      };

      respondJson(res, 200, payload);

      if (!canonical.stream) {
        storeCaches(cacheKey, query, canonical.model, payload);
      }

      if (memoryStore && query && responseText) {
        memoryStore.addCandidate({
          content: `Q: ${query}\nA: ${responseText}`,
          surprise: Math.min(1, responseText.length / 400),
          importance: 0.5
        });
      }
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

  router.post('/v1/messages/count_tokens', ({ res, body = {} }) => {
    const input = approximateTokensFromText(JSON.stringify(body));
    respondJson(res, 200, {
      input_tokens: input,
      output_tokens: 0,
      total_tokens: input
    });
  });
}

module.exports = { registerCoreRoutes, sanitizeAnthropicMessages };
