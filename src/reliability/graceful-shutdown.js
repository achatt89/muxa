class ShutdownManager {
  constructor() {
    this.handlers = [];
  }

  register(handler) {
    this.handlers.push(handler);
  }

  async shutdown() {
    for (const handler of this.handlers) {
      await handler();
    }
  }
}

module.exports = {
  ShutdownManager
};
