const { EventEmitter } = require('node:events');

class HeadroomSidecar extends EventEmitter {
  constructor(options = {}) {
    super();
    this.enabled = options.enabled ?? false;
    this.mode = options.mode || 'audit';
    this.status = 'disabled';
  }

  async start() {
    if (!this.enabled) {
      this.status = 'disabled';
      return;
    }

    this.status = 'running';
    this.emit('started', { mode: this.mode });
  }

  async restart() {
    if (!this.enabled) {
      return;
    }
    this.status = 'restarting';
    this.emit('restarting');
    await this.start();
  }

  getStatus() {
    return {
      enabled: this.enabled,
      mode: this.mode,
      status: this.status
    };
  }
}

module.exports = {
  HeadroomSidecar
};
