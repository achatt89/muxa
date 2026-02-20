const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeResponsesTools } = require('../../src/api/openai-router');

test('normalizeResponsesTools keeps valid definitions as-is', () => {
  const tools = [
    {
      type: 'function',
      function: {
        name: 'read_file',
        description: 'Read file contents',
        parameters: { type: 'object' }
      }
    }
  ];
  const normalized = normalizeResponsesTools(tools);
  assert.equal(normalized.length, 1);
  assert.equal(normalized[0].function.name, 'read_file');
  assert.equal(normalized[0].function.description, 'Read file contents');
});

test('normalizeResponsesTools wraps legacy responses definitions', () => {
  const tools = [
    {
      type: 'function',
      name: 'shell_command',
      description: 'Run shell command',
      parameters: { type: 'object', properties: { command: { type: 'string' } } }
    }
  ];
  const normalized = normalizeResponsesTools(tools);
  assert.equal(normalized.length, 1);
  assert.ok(normalized[0].function);
  assert.equal(normalized[0].function.name, 'shell_command');
  assert.equal(normalized[0].function.description, 'Run shell command');
  assert.equal(normalized[0].function.parameters.properties.command.type, 'string');
});

test('normalizeResponsesTools converts non-function tool entries to custom', () => {
  const tools = [
    { type: 'file_search', max_depth: 3, description: 'Search files' },
    { type: 'function', name: 'list_dir', input_schema: { type: 'object' } }
  ];
  const normalized = normalizeResponsesTools(tools);
  assert.equal(normalized[0].type, 'custom');
  assert.equal(normalized[0].custom.kind, 'file_search');
  assert.equal(normalized[0].custom.name, 'file_search');
  assert.equal(normalized[0].custom.description, 'Search files');
  assert.equal(normalized[1].function.name, 'list_dir');
  assert.deepEqual(normalized[1].function.parameters, { type: 'object' });
});

test('normalizeResponsesTools coerces custom tools into functions', () => {
  const tools = [
    {
      type: 'custom',
      name: 'list_dir',
      description: 'List directory contents',
      schema: { type: 'object', properties: { path: { type: 'string' } } }
    }
  ];
  const normalized = normalizeResponsesTools(tools);
  assert.equal(normalized[0].type, 'function');
  assert.equal(normalized[0].function.name, 'list_dir');
  assert.equal(normalized[0].function.description, 'List directory contents');
  assert.deepEqual(normalized[0].function.parameters.properties.path.type, 'string');
});
