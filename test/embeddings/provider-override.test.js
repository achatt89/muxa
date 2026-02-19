const test = require('node:test');
const assert = require('node:assert/strict');
const { generateEmbedding } = require('../../src/providers/embeddings');

test('embeddings use override provider when configured', async () => {
  const result = await generateEmbedding({
    text: 'hello',
    config: { embeddingsProvider: 'anthropic', primaryProvider: 'mock' }
  });
  assert.equal(result.provider, 'anthropic');
});
