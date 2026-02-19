const { invokeAdapter } = require('../providers');
const { ProviderError } = require('../providers/errors');

function computeComplexityScore(canonicalRequest) {
  if (typeof canonicalRequest.complexityScore === 'number') {
    return canonicalRequest.complexityScore;
  }

  const messageCount = (canonicalRequest.messages || []).length;
  const toolUseCount = (canonicalRequest.messages || []).filter(
    (msg) => Array.isArray(msg.content) && msg.content.some((part) => part.type === 'tool_use')
  ).length;

  const textLength = (canonicalRequest.messages || [])
    .map((msg) => (typeof msg.content === 'string' ? msg.content.length : 0))
    .reduce((sum, len) => sum + len, 0);

  return messageCount + toolUseCount * 2 + Math.round(textLength / 500);
}

function selectRoute({ config, canonicalRequest }) {
  const score = computeComplexityScore(canonicalRequest);
  const fallbackEligible = score > 3 || Boolean(canonicalRequest.requiresTools);
  const shouldUseFallback =
    config.routingStrategy === 'hybrid' && config.fallbackProvider && fallbackEligible;

  const provider = shouldUseFallback ? config.fallbackProvider : config.primaryProvider;

  return {
    provider,
    usedFallback: Boolean(shouldUseFallback),
    score
  };
}

async function executeWithRouting({ config, canonicalRequest }) {
  const metadata = {
    attempts: []
  };

  async function attempt(providerName, isFallback = false) {
    metadata.attempts.push({ provider: providerName, fallback: isFallback });
    return invokeAdapter(providerName, canonicalRequest, config);
  }

  const primaryRoute = selectRoute({ config, canonicalRequest });

  try {
    const result = await attempt(primaryRoute.provider, primaryRoute.usedFallback);
    return {
      route: primaryRoute,
      result
    };
  } catch (error) {
    if (
      error instanceof ProviderError &&
      config.fallbackProvider &&
      primaryRoute.provider !== config.fallbackProvider
    ) {
      const fallbackRoute = {
        provider: config.fallbackProvider,
        usedFallback: true,
        score: primaryRoute.score
      };
      const fallbackResult = await attempt(config.fallbackProvider, true);
      return {
        route: fallbackRoute,
        result: fallbackResult
      };
    }
    throw error;
  }
}

module.exports = {
  selectRoute,
  executeWithRouting
};
