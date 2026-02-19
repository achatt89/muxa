class MetricsRegistry {
  constructor() {
    this.counters = new Map();
  }

  inc(name, value = 1) {
    this.counters.set(name, (this.counters.get(name) || 0) + value);
  }

  snapshot() {
    const result = {};
    for (const [key, value] of this.counters.entries()) {
      result[key] = value;
    }
    return result;
  }
}

module.exports = {
  MetricsRegistry
};
