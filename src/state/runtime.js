const crypto = require('node:crypto');

function createRuntimeState() {
  const sessions = new Map([
    [
      'demo',
      {
        id: 'demo',
        tokens: { input: 42, output: 21 },
        transcript: ['System: demo session initialized']
      }
    ]
  ]);

  const agentExecutions = new Map([
    [
      'agent-alpha',
      {
        id: 'agent-alpha',
        status: 'idle',
        lastRun: null,
        transcript: ['ready']
      }
    ]
  ]);

  const runtime = {
    sessions,
    agentExecutions,
    routingSamples: [],
    metrics: {
      totalRequests: 0,
      perRoute: {}
    },
    providerHealth: new Map()
  };

  return runtime;
}

function recordRequest(runtime, routeKey) {
  runtime.metrics.totalRequests += 1;
  runtime.metrics.perRoute[routeKey] = (runtime.metrics.perRoute[routeKey] || 0) + 1;
}

function recordSessionTokenUsage(runtime, sessionId, usage) {
  const existing = runtime.sessions.get(sessionId) || {
    id: sessionId,
    tokens: { input: 0, output: 0 },
    transcript: []
  };

  existing.tokens.input += usage.input || 0;
  existing.tokens.output += usage.output || 0;
  runtime.sessions.set(sessionId, existing);
}

function recordRoutingSample(runtime, sample) {
  runtime.routingSamples.push({
    ...sample,
    timestamp: Date.now()
  });
  if (runtime.routingSamples.length > 50) {
    runtime.routingSamples.shift();
  }
}

function randomId(prefix) {
  return `${prefix}_${crypto.randomUUID()}`;
}

module.exports = {
  createRuntimeState,
  recordRequest,
  recordSessionTokenUsage,
  recordRoutingSample,
  randomId
};
