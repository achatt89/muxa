const test = require('node:test');
const assert = require('node:assert/strict');
const { createLoadSheddingMiddleware } = require('../../src/middleware');

test('load shedding middleware protects under stress', async () => {
  const middleware = createLoadSheddingMiddleware({ maxConcurrent: 0 });
  const ctx = {
    res: {
      statusCode: 200,
      headers: {},
      setHeader(key, value) {
        this.headers[key.toLowerCase()] = value;
      },
      end(body) {
        this.body = body;
      }
    }
  };

  await middleware(ctx, async () => {});
  assert.equal(ctx.res.statusCode, 503);
});
