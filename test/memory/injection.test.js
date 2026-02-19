const test = require('node:test');
const assert = require('node:assert/strict');
const { injectMemoriesIntoPrompt } = require('../../src/memory/store');

test('inject memories appends serialized context', () => {
  const prompt = 'Answer the question';
  const memories = [{ content: 'Project uses Muxa proxy' }];
  const output = injectMemoriesIntoPrompt(prompt, memories);
  assert.match(output, /Relevant context/);
  assert.match(output, /Muxa proxy/);
});
