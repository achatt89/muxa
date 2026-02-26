'use strict';

const { respondJson, respondError } = require('../http/response');
const { SUPPORTED_PROVIDERS, LOCAL_PROVIDERS } = require('../config/constants');

function registerProviderRoutes(router, { config }) {
  router.get('/v1/providers', ({ res }) => {
    const providers = SUPPORTED_PROVIDERS.map((provider) => ({
      name: provider,
      type: LOCAL_PROVIDERS.includes(provider) ? 'local' : 'cloud'
    }));
    respondJson(res, 200, providers);
  });

  router.get('/v1/providers/:name', ({ res, params }) => {
    if (!SUPPORTED_PROVIDERS.includes(params.name)) {
      respondError(res, 404, 'Provider not found', 'NOT_FOUND');
      return;
    }

    respondJson(res, 200, {
      name: params.name,
      type: LOCAL_PROVIDERS.includes(params.name) ? 'local' : 'cloud',
      configured: config.primaryProvider === params.name || config.fallbackProvider === params.name
    });
  });

  router.get('/v1/config', ({ res }) => {
    respondJson(res, 200, {
      serviceName: config.serviceName,
      environment: config.environment,
      port: config.port,
      routingStrategy: config.routingStrategy,
      toolExecution: config.toolExecution
    });
  });

  router.get('/v1/health/providers', ({ res }) => {
    const statuses = SUPPORTED_PROVIDERS.map((provider) => ({
      name: provider,
      status: provider === config.primaryProvider ? 'healthy' : 'idle'
    }));
    respondJson(res, 200, statuses);
  });

  router.get('/v1/health/providers/:name', ({ res, params }) => {
    if (!SUPPORTED_PROVIDERS.includes(params.name)) {
      respondError(res, 404, 'Provider not found', 'NOT_FOUND');
      return;
    }

    const status =
      params.name === config.primaryProvider || params.name === config.fallbackProvider
        ? 'healthy'
        : 'idle';
    respondJson(res, 200, {
      name: params.name,
      status,
      lastCheckedAt: new Date().toISOString()
    });
  });
}

module.exports = { registerProviderRoutes };
