class HealthStatus {
  constructor() {
    this.state = 'ready';
    this.details = {};
  }

  setState(state, details = {}) {
    this.state = state;
    this.details = details;
  }

  toJson() {
    return {
      status: this.state,
      details: this.details
    };
  }
}

module.exports = {
  HealthStatus
};
