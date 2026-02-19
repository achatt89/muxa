const test = require('node:test');
const assert = require('node:assert/strict');
const { MiddlewarePipeline } = require('../../src/middleware');

test('middleware pipeline enforces deterministic order', async () => {
  const pipeline = new MiddlewarePipeline();
  const order = [];
  pipeline.use(async (ctx, next) => {
    order.push('A');
    await next();
    order.push('A_end');
  });
  pipeline.use(async (ctx, next) => {
    order.push('B');
    await next();
    order.push('B_end');
  });

  await pipeline.run({}, async () => {
    order.push('handler');
  });

  assert.deepEqual(order, ['A', 'B', 'handler', 'B_end', 'A_end']);
});
