const nodeHttp = require('node:http');
const { EventEmitter } = require('node:events');
const { loadConfig } = require('./config');
const { createRouter } = require('./http/router');
const { readJson } = require('./http/body');
const { respondError } = require('./http/response');
const { createRuntimeState, recordRequest } = require('./state/runtime');
const { registerCoreRoutes } = require('./api/router');
const { registerOpenAIRoutes } = require('./api/openai-router');
const { registerProviderRoutes } = require('./api/providers-handler');
const { HeadroomSidecar } = require('./headroom/sidecar');
const { CompressionEngine } = require('./headroom/compression');
const { MemoryStore } = require('./memory/store');
const { PromptCache } = require('./cache/prompt-cache');
const { SemanticCache } = require('./cache/semantic-cache');

const shouldLogRequests = /^true|1|yes$/i.test(process.env.MUXA_LOG_RESPONSES || '');

function logRequest(tag, payload) {
  if (shouldLogRequests) {
    console.log(`[muxa:${tag}]`, payload);
  }
}

function buildRequestHandler(config, integrations = {}) {
  const router = createRouter();
  const runtime = createRuntimeState();
  const bootTime = Date.now();

  registerCoreRoutes(router, {
    config,
    runtime,
    bootTime,
    headroomSidecar: integrations.headroomSidecar,
    compressionEngine: integrations.compressionEngine,
    memoryStore: integrations.memoryStore,
    promptCache: integrations.promptCache,
    semanticCache: integrations.semanticCache
  });
  registerOpenAIRoutes(router, {
    config,
    runtime,
    memoryStore: integrations.memoryStore,
    promptCache: integrations.promptCache,
    semanticCache: integrations.semanticCache
  });
  registerProviderRoutes(router, { config, runtime });

  return async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    if (shouldLogRequests) {
      logRequest('request', {
        method: req.method,
        path: url.pathname,
        query: url.search,
        headers: req.headers
      });
    }

    const match = router.match(req.method, url.pathname);

    if (!match) {
      respondError(res, 404, `No route for ${req.method} ${url.pathname}`, 'NOT_FOUND');
      return;
    }

    recordRequest(runtime, `${match.route.method} ${match.route.path}`);

    let body;
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
      try {
        body = await readJson(req);
      } catch (error) {
        respondError(res, 400, error.message || 'Invalid JSON payload', 'INVALID_JSON');
        return;
      }
    }

    await match.route.handler({
      req,
      res,
      params: match.params,
      body,
      url,
      config,
      runtime,
      bootTime
    });
  };
}

function createServer(options = {}) {
  const config = options.config || loadConfig(options.configOptions || {});
  const httpModule = options.httpModule || nodeHttp;
  const emitter = new EventEmitter();
  const headroomSidecar = new HeadroomSidecar({
    enabled: config.headroom.enabled,
    mode: config.headroom.mode
  });
  const compressionEngine = new CompressionEngine({ mode: config.headroom.mode });
  const memoryStore = config.optimization.memory.enabled
    ? new MemoryStore({
      surpriseThreshold: config.optimization.memory.surpriseThreshold,
      maxEntries: config.optimization.memory.maxEntries
    })
    : null;
  const promptCache = config.optimization.promptCache.enabled
    ? new PromptCache({
      ttlMs: config.optimization.promptCache.ttlMs,
      maxEntries: config.optimization.promptCache.maxEntries
    })
    : null;
  const semanticCache = config.optimization.semanticCache.enabled
    ? new SemanticCache({ threshold: config.optimization.semanticCache.threshold })
    : null;
  let server;
  let started = false;

  const handler = buildRequestHandler(config, {
    headroomSidecar,
    compressionEngine,
    memoryStore,
    promptCache,
    semanticCache
  });

  async function start() {
    if (started) {
      return server;
    }

    return new Promise((resolve, reject) => {
      server = httpModule.createServer((req, res) => {
        handler(req, res).catch((error) => {
          respondError(res, 500, error.message || 'Internal error', 'INTERNAL_ERROR');
        });
      });

      const onError = (error) => {
        server?.off('error', onError);
        reject(error);
      };

      server.once('error', onError);

      // eslint-disable-next-line promise/catch-or-return
      headroomSidecar
        .start()
        .catch(() => { })
        .finally(() => {
          server.listen(config.port, config.host, () => {
            server.off('error', onError);
            started = true;
            emitter.emit('started', server.address());
            resolve(server);
          });
        });
    });
  }

  async function stop() {
    if (!server || !started) {
      return;
    }

    await new Promise((resolve, reject) => {
      server.close((err) => {
        if (err) {
          reject(err);
          return;
        }

        started = false;
        emitter.emit('stopped');
        resolve();
      });
    });
  }

  return {
    config,
    start,
    stop,
    on: emitter.on.bind(emitter),
    once: emitter.once.bind(emitter),
    address: () => server?.address() ?? null,
    get httpServer() {
      return server;
    }
  };
}

module.exports = {
  createServer,
  buildRequestHandler
};
