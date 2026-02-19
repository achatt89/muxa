class ConfigError extends Error {
  constructor(message, meta = {}) {
    super(message);
    this.name = 'ConfigError';
    this.meta = meta;
  }
}

module.exports = { ConfigError };
