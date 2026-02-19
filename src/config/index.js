const { SUPPORTED_PROVIDERS, LOCAL_PROVIDERS, REQUIRED_CREDENTIALS, TOOL_EXECUTION_MODES, ROUTING_STRATEGIES } = require('./constants');
const { ConfigError } = require('./errors');
const pkg = require('../../package.json');

function normalizeProvider(value, defaultValue = 'mock') {
  if (!value) {
    return defaultValue;
  }

  return String(value).trim().toLowerCase();
}

function resolvePort(value) {
  const port = Number(value);
  if (Number.isNaN(port) || port < 0 || port > 65535) {
    throw new ConfigError(`Invalid port: ${value}`);
  }

  return port;
}

function assertSupportedProvider(provider, fieldName) {
  if (provider && !SUPPORTED_PROVIDERS.includes(provider)) {
    throw new ConfigError(`Unsupported provider: ${provider}`, { fieldName, provider });
  }
}

function ensureCredentials(provider, env) {
  const required = REQUIRED_CREDENTIALS[provider] || [];

  for (const key of required) {
    if (!env[key]) {
      throw new ConfigError(`Missing required credential: ${key}`, { provider, credential: key });
    }
  }

  return required.reduce((acc, key) => {
    acc[key] = env[key];
    return acc;
  }, {});
}

function validateToolMode(mode) {
  const normalized = String(mode || '').toLowerCase() || 'server';
  if (!TOOL_EXECUTION_MODES.includes(normalized)) {
    throw new ConfigError(`Unsupported tool execution mode: ${mode}`, { allowed: TOOL_EXECUTION_MODES });
  }

  return normalized;
}

function validateRoutingStrategy(strategy) {
  const normalized = String(strategy || '').toLowerCase() || 'single';
  if (!ROUTING_STRATEGIES.includes(normalized)) {
    throw new ConfigError(`Unsupported routing strategy: ${strategy}`, { allowed: ROUTING_STRATEGIES });
  }

  return normalized;
}

function validateFallback({ routingStrategy, fallbackProvider, primaryProvider }) {
  if (!fallbackProvider) {
    if (routingStrategy === 'hybrid') {
      throw new ConfigError('Hybrid routing requires FALLBACK provider');
    }
    return;
  }

  if (fallbackProvider === primaryProvider) {
    throw new ConfigError('Fallback provider must differ from primary provider');
  }

  assertSupportedProvider(fallbackProvider, 'FALLBACK_PROVIDER');

  if (routingStrategy === 'hybrid' && LOCAL_PROVIDERS.includes(fallbackProvider)) {
    throw new ConfigError('Hybrid routing fallback must target a non-local provider', {
      fallbackProvider
    });
  }
}

function loadConfig(options = {}) {
  const env = Object.assign({}, process.env, options.env);
  const overrides = options.overrides || {};

  const primaryProvider = normalizeProvider(overrides.primaryProvider ?? env.MUXA_PRIMARY_PROVIDER ?? 'mock');
  assertSupportedProvider(primaryProvider, 'MUXA_PRIMARY_PROVIDER');

  const fallbackProvider = normalizeProvider(
    overrides.fallbackProvider ?? env.MUXA_FALLBACK_PROVIDER ?? '',
    ''
  );
  if (fallbackProvider) {
    assertSupportedProvider(fallbackProvider, 'MUXA_FALLBACK_PROVIDER');
  }

  const routingStrategy = validateRoutingStrategy(overrides.routingStrategy ?? env.MUXA_ROUTING_STRATEGY ?? 'single');
  const toolExecutionMode = validateToolMode(overrides.toolExecutionMode ?? env.MUXA_TOOL_EXECUTION_MODE ?? 'server');
  const port = resolvePort(overrides.port ?? env.MUXA_PORT ?? 8081);
  const host = overrides.host ?? env.MUXA_HOST ?? '0.0.0.0';
  const jsonBodyLimit = overrides.jsonBodyLimit ?? env.MUXA_JSON_BODY_LIMIT ?? '1mb';

  validateFallback({ routingStrategy, fallbackProvider, primaryProvider });

  const config = {
    serviceName: env.MUXA_SERVICE_NAME || 'muxa',
    version: pkg.version,
    environment: env.NODE_ENV || 'development',
    port,
    host,
    jsonBodyLimit,
    primaryProvider,
    fallbackProvider: fallbackProvider || null,
    routingStrategy,
    toolExecution: {
      mode: toolExecutionMode
    },
    credentials: {},
    headroom: {
      enabled: (env.MUXA_HEADROOM_ENABLED || '').toLowerCase() === 'true',
      mode: env.MUXA_HEADROOM_MODE || 'audit'
    }
  };

  if (REQUIRED_CREDENTIALS[primaryProvider]) {
    config.credentials[primaryProvider] = ensureCredentials(primaryProvider, env);
  }

  if (fallbackProvider && REQUIRED_CREDENTIALS[fallbackProvider]) {
    config.credentials[fallbackProvider] = ensureCredentials(fallbackProvider, env);
  }

  return Object.freeze(config);
}

module.exports = {
  loadConfig,
  ConfigError,
  constants: {
    SUPPORTED_PROVIDERS,
    LOCAL_PROVIDERS,
    TOOL_EXECUTION_MODES,
    ROUTING_STRATEGIES
  }
};
