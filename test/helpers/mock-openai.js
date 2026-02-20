let originalFetch = null;
let applied = false;
const requests = [];

function ensureMockOpenAI() {
  if (applied) {
    return { requests };
  }
  originalFetch = global.fetch;
  global.fetch = async (url, options = {}) => {
    const target = String(url || '');
    if (target.includes('/chat/completions') && options?.method === 'POST') {
      const body = options.body ? JSON.parse(options.body) : {};
      requests.push({ url: target, body });
      return {
        ok: true,
        json: async () => ({
          id: 'mock-openai',
          choices: [{ message: { content: 'mock-openai response' }, finish_reason: 'stop' }],
          usage: { prompt_tokens: 10, completion_tokens: 4 }
        })
      };
    }
    if (originalFetch) {
      return originalFetch(url, options);
    }
    throw new Error(`Unexpected fetch target: ${target}`);
  };
  applied = true;
  return { requests };
}

process.on('exit', () => {
  if (applied && originalFetch) {
    global.fetch = originalFetch;
  }
});

module.exports = {
  ensureMockOpenAI,
  mockOpenAIRequests: requests
};
