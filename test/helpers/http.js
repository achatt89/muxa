const { Readable, Writable } = require('node:stream');
const { buildRequestHandler } = require('../../src/server');
const { loadConfig } = require('../../src/config');

function createMockRequest({ method, path, body, headers }) {
  const stream = new Readable({
    read() {
      if (this._consumed) {
        this.push(null);
        return;
      }
      this._consumed = true;
      if (body) {
        this.push(Buffer.from(body));
      }
      this.push(null);
    }
  });

  stream.method = method;
  stream.url = path;
  stream.headers = Object.assign({ host: 'localhost' }, headers);
  return stream;
}

class MockResponse extends Writable {
  constructor() {
    super();
    this.statusCode = 200;
    this.headers = {};
    this.chunks = [];
    this.finishedPromise = new Promise((resolve) => {
      this.once('finish', () => resolve());
    });
  }

  setHeader(key, value) {
    this.headers[key.toLowerCase()] = value;
  }

  write(chunk, encoding, callback) {
    const normalized = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, encoding);
    this.chunks.push(normalized);
    if (callback) {
      callback();
    }
    return true;
  }

  end(chunk, encoding, callback) {
    if (chunk) {
      this.write(chunk, encoding);
    }
    super.end(callback);
  }

  get body() {
    return Buffer.concat(this.chunks).toString('utf8');
  }
}

async function request(options) {
  const config = loadConfig(
    options.configOptions || {
      overrides: {
        port: 0
      },
      env: {
        NODE_ENV: 'test',
        MUXA_PRIMARY_PROVIDER: 'openai',
        OPENAI_API_KEY: 'sk-test',
        MUXA_ROUTING_STRATEGY: 'single'
      }
    }
  );

  const handler = buildRequestHandler(config);
  const req = createMockRequest({
    method: options.method,
    path: options.path,
    body: options.body ? JSON.stringify(options.body) : undefined,
    headers: options.headers
  });
  const res = new MockResponse();
  await handler(req, res);
  await res.finishedPromise;
  return res;
}

module.exports = {
  request,
  MockResponse
};
