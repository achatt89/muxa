class ProviderError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = 'ProviderError';
    this.statusCode = options.statusCode || 500;
    this.code = options.code || 'PROVIDER_ERROR';
    this.provider = options.provider;
    this.metadata = options.metadata || {};
  }
}

module.exports = {
  ProviderError
};
