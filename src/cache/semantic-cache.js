function tokenize(text) {
  return new Set(String(text || '').toLowerCase().split(/\s+/g));
}

function cosine(listA, listB) {
  if (!listA.size || !listB.size) {
    return 0;
  }
  const intersection = [...listA].filter((token) => listB.has(token));
  return intersection.length / Math.sqrt(listA.size * listB.size);
}

class SemanticCache {
  constructor(options = {}) {
    this.threshold = options.threshold || 0.7;
    this.entries = [];
  }

  set(prompt, response) {
    const tokens = tokenize(prompt);
    this.entries.push({ tokens, response });
  }

  get(prompt) {
    const tokens = tokenize(prompt);
    for (const entry of this.entries) {
      const score = cosine(tokens, entry.tokens);
      if (score >= this.threshold) {
        return { response: entry.response, score };
      }
    }
    return null;
  }
}

module.exports = {
  SemanticCache
};
