const { createServer } = require('./server');
const { loadConfig, ConfigError } = require('./config');

module.exports = {
  createServer,
  loadConfig,
  ConfigError
};
