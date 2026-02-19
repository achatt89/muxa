const test = require('node:test');
const assert = require('node:assert/strict');
const { request } = require('../helpers/http');

test('Local provider E2E: mock provider returns assistant reply', async () => {
  const res = await request({
    method: 'POST',
    path: '/v1/messages',
    body: { messages: [{ role: 'user', content: 'local provider test' }] },
    configOptions: {
      env: {
        NODE_ENV: 'test',
        MUXA_PRIMARY_PROVIDER: 'mock',
        MUXA_TOOL_EXECUTION_MODE: 'server'
      }
    }
  });

  assert.equal(res.statusCode, 200);
  const payload = JSON.parse(res.body);
  assert.ok(payload.content[0].text.includes('Local'));
});
