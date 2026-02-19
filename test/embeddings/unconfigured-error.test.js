const test = require('node:test');
const assert = require('node:assert/strict');
const { generateEmbedding } = require('../../src/providers/embeddings');
const { ProviderError } = require('../../src/providers/errors');

test('missing embeddings provider throws explicit error', async () => {
  await assert.rejects(
    () => generateEmbedding({ text: 'hello', config: {} }),
    (error) => {
      assert.ok(error instanceof ProviderError);
      assert.equal(error.code, 'EMBEDDINGS_PROVIDER_MISSING');
      return true;
    }
  );
});
