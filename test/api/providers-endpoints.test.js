const test = require('node:test');
const assert = require('node:assert/strict');
const { request } = require('../helpers/http');

test('provider listing returns supported providers', async () => {
  const res = await request({ method: 'GET', path: '/v1/providers' });
  assert.equal(res.statusCode, 200);
  const payload = JSON.parse(res.body);
  assert.ok(payload.some((provider) => provider.name === 'openai'));
});

test('provider detail returns config status', async () => {
  const res = await request({ method: 'GET', path: '/v1/providers/openai' });
  assert.equal(res.statusCode, 200);
  const payload = JSON.parse(res.body);
  assert.equal(payload.name, 'openai');
});

test('provider health endpoints return statuses', async () => {
  const listRes = await request({ method: 'GET', path: '/v1/health/providers' });
  assert.equal(listRes.statusCode, 200);
  const detailRes = await request({ method: 'GET', path: '/v1/health/providers/openai' });
  assert.equal(detailRes.statusCode, 200);
});

test('runtime config endpoint returns safe view', async () => {
  const res = await request({ method: 'GET', path: '/v1/config' });
  assert.equal(res.statusCode, 200);
  const payload = JSON.parse(res.body);
  assert.equal(payload.routingStrategy, 'single');
});
