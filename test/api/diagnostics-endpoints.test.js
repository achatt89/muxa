const test = require('node:test');
const assert = require('node:assert/strict');
const { request } = require('../helpers/http');

test('routing stats endpoint returns structured payload', async () => {
  const res = await request({ method: 'GET', path: '/routing/stats' });
  assert.equal(res.statusCode, 200);
  const payload = JSON.parse(res.body);
  assert.equal(payload.primaryProvider, 'openai');
});

test('debug session endpoint validates query params', async () => {
  const res = await request({ method: 'GET', path: '/debug/session?sessionId=demo' });
  assert.equal(res.statusCode, 200);
  const payload = JSON.parse(res.body);
  assert.equal(payload.id, 'demo');
});

test('agents endpoints report summaries', async () => {
  const listRes = await request({ method: 'GET', path: '/v1/agents' });
  assert.equal(listRes.statusCode, 200);
  const statsRes = await request({ method: 'GET', path: '/v1/agents/stats' });
  assert.equal(statsRes.statusCode, 200);
});

test('token telemetry endpoints respond', async () => {
  const sessionRes = await request({ method: 'GET', path: '/api/sessions/demo/tokens' });
  assert.equal(sessionRes.statusCode, 200);
  const statsRes = await request({ method: 'GET', path: '/api/tokens/stats' });
  assert.equal(statsRes.statusCode, 200);
});

test('event logging batch is accepted', async () => {
  const res = await request({
    method: 'POST',
    path: '/api/event_logging/batch',
    body: { events: [{ type: 'ping' }] }
  });
  assert.equal(res.statusCode, 202);
});

test('metrics + headroom endpoints return data', async () => {
  const endpoints = [
    '/metrics',
    '/metrics/observability',
    '/metrics/prometheus',
    '/metrics/circuit-breakers',
    '/metrics/load-shedding',
    '/metrics/worker-pool',
    '/metrics/semantic-cache',
    '/metrics/lazy-tools',
    '/metrics/compression',
    '/health/headroom',
    '/headroom/status',
    '/headroom/logs'
  ];

  for (const path of endpoints) {
    const res = await request({ method: 'GET', path });
    assert.equal(res.statusCode, 200);
  }
});
