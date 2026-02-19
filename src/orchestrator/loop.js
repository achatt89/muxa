const { randomUUID } = require('node:crypto');

class LoopGuardError extends Error {
  constructor(message, meta = {}) {
    super(message);
    this.name = 'LoopGuardError';
    this.meta = meta;
  }
}

function createOrchestrator(options = {}) {
  const defaultMaxSteps = options.maxSteps ?? 8;
  const toolExecutor = options.toolExecutor;
  const sessionRecorder = options.sessionRecorder;

  function appendSession(message) {
    if (sessionRecorder && typeof sessionRecorder.append === 'function') {
      sessionRecorder.append(message);
    }
  }

  async function runLoop(loopOptions) {
    const {
      messages = [],
      decide,
      executionMode = options.executionMode || 'server',
      maxSteps = defaultMaxSteps
    } = loopOptions;

    if (typeof decide !== 'function') {
      throw new Error('decide function is required');
    }

    const transcript = [...messages];

    for (let step = 0; step < maxSteps; step += 1) {
      const action = await decide({
        step,
        messages: [...transcript]
      });

      if (!action) {
        throw new Error('decide returned no action');
      }

      if (action.type === 'respond') {
        const message = action.message || { role: 'assistant', content: '' };
        transcript.push(message);
        appendSession(message);
        return {
          outcome: 'response',
          steps: step + 1,
          response: message,
          transcript
        };
      }

      if (action.type === 'tool') {
        const toolCall = {
          id: action.tool?.id || `tool_${randomUUID()}`,
          name: action.tool?.name,
          arguments: action.tool?.arguments || {}
        };

        if (executionMode === 'client') {
          return {
            outcome: 'tool_delegated',
            steps: step + 1,
            toolCall,
            transcript
          };
        }

        if (!toolExecutor) {
          throw new Error('No toolExecutor provided for server mode');
        }

        transcript.push({
          role: 'assistant',
          type: 'tool_use',
          name: toolCall.name,
          input: toolCall.arguments,
          id: toolCall.id
        });

        const result = await toolExecutor(toolCall, { step, transcript: [...transcript] });
        transcript.push({
          role: 'tool',
          name: toolCall.name,
          content: result?.output || '',
          id: toolCall.id
        });
        continue;
      }

      throw new Error(`Unsupported action type: ${action.type}`);
    }

    throw new LoopGuardError('Loop guard exceeded maximum steps', { maxSteps });
  }

  return {
    runLoop
  };
}

module.exports = {
  createOrchestrator,
  LoopGuardError
};
