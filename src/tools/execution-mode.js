const { createOrchestrator } = require('../orchestrator');

function createToolExecutor(options) {
  const { mode = 'server', toolExecutor, sessionRecorder } = options;
  const orchestrator = createOrchestrator({
    toolExecutor,
    sessionRecorder,
    executionMode: mode
  });

  return orchestrator;
}

module.exports = {
  createToolExecutor
};
