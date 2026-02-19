const test = require('node:test');
const assert = require('node:assert/strict');
const { MiddlewarePipeline } = require('../../src/middleware');

test('validation errors bubble through pipeline', async () => {
  const pipeline = new MiddlewarePipeline();
  pipeline.use(async () => {
    const error = new Error('Invalid request');
    error.statusCode = 400;
    throw error;
  });

  await assert.rejects(async () => {
    await pipeline.run({}, async () => {});
  }, /Invalid request/);
});
