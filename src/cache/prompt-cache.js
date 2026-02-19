class PromptCache {
  constructor(options = {}) {
    this.ttlMs = options.ttlMs || 60 * 1000;
    this.maxEntries = options.maxEntries || 100;
    this.store = new Map();
  }

  keyOf(prompt, provider) {
    return `${provider || 'default'}::${prompt}`;
  }

  set(prompt, provider, response) {
    const key = this.keyOf(prompt, provider);
    this.store.set(key, {
      response,
      expiresAt: Date.now() + this.ttlMs
    });
    if (this.store.size > this.maxEntries) {
      const oldestKey = this.store.keys().next().value;
      this.store.delete(oldestKey);
    }
  }

  get(prompt, provider) {
    const key = this.keyOf(prompt, provider);
    const entry = this.store.get(key);
    if (!entry) {
      return null;
    }
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.response;
  }
}

module.exports = {
  PromptCache
};
