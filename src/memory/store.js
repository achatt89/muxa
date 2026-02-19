const DAY_MS = 24 * 60 * 60 * 1000;

class MemoryStore {
  constructor(options = {}) {
    this.entries = [];
    this.maxEntries = options.maxEntries || 200;
    this.surpriseThreshold = options.surpriseThreshold || 0.6;
  }

  addCandidate(payload) {
    const surprise = payload.surprise ?? 0;
    if (surprise < this.surpriseThreshold) {
      return false;
    }

    const entry = {
      id: payload.id || `mem_${Math.random().toString(36).slice(2)}`,
      content: payload.content,
      surprise,
      importance: payload.importance ?? 0.5,
      tags: payload.tags || [],
      createdAt: payload.createdAt || Date.now()
    };

    this.entries.push(entry);
    this.entries.sort((a, b) => b.createdAt - a.createdAt);
    if (this.entries.length > this.maxEntries) {
      this.entries.length = this.maxEntries;
    }

    return true;
  }

  rankEntries(query = '') {
    const now = Date.now();
    return this.entries
      .map((entry) => {
        const recencyScore = 1 / (1 + (now - entry.createdAt) / DAY_MS);
        const relevanceScore = query && entry.content
          ? this.computeRelevance(query, entry.content)
          : 0.5;
        const composite = entry.importance * 0.4 + entry.surprise * 0.3 + recencyScore * 0.2 + relevanceScore * 0.1;
        return { entry, score: composite };
      })
      .sort((a, b) => b.score - a.score);
  }

  computeRelevance(query, content) {
    const qTokens = new Set(query.toLowerCase().split(/\s+/g));
    const cTokens = new Set(content.toLowerCase().split(/\s+/g));
    const intersection = [...qTokens].filter((token) => cTokens.has(token));
    return intersection.length / (qTokens.size || 1);
  }

  retrieveTop({ query = '', limit = 5 } = {}) {
    return this.rankEntries(query)
      .slice(0, limit)
      .map(({ entry }) => entry);
  }
}

function injectMemoriesIntoPrompt(prompt, memories) {
  if (!memories || memories.length === 0) {
    return prompt;
  }

  const serialized = memories.map((mem) => `- ${mem.content}`).join('\n');
  return `${prompt}\n\nRelevant context:\n${serialized}`;
}

module.exports = {
  MemoryStore,
  injectMemoriesIntoPrompt
};
