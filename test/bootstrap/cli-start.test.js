const test = require('node:test');
const assert = require('node:assert/strict');
const { createServer } = require('../../src/server');
const { loadConfig } = require('../../src/config');

function createStubHttp() {
  const stub = {
    lastServer: null,
    createServer(handler) {
      const server = {
        handler,
        _addr: null,
        once(event, listener) {
          if (event === 'error') {
            this._errorListener = listener;
          }
        },
        off(event, listener) {
          if (event === 'error' && this._errorListener === listener) {
            this._errorListener = undefined;
          }
        },
        listen(port, host, callback) {
          this._addr = {
            address: host || '0.0.0.0',
            port: port === 0 ? 4000 : port
          };
          setImmediate(callback);
        },
        close(callback) {
          setImmediate(() => callback && callback());
        },
        address() {
          return this._addr;
        }
      };

      stub.lastServer = server;
      return server;
    }
  };

  return stub;
}

test('service starts on configured port and responds to health checks', async (t) => {
  const config = loadConfig({
    overrides: {
      port: 0
    },
    env: {
      NODE_ENV: 'test',
      MUXA_PRIMARY_PROVIDER: 'mock'
    }
  });

  const httpModule = createStubHttp();
  const server = createServer({ config, httpModule });
  await server.start();

  t.after(async () => {
    await server.stop();
  });

  const address = server.address();
  assert.ok(address);
  assert.ok(address.port > 0, 'port should be assigned');

  const resPayload = await new Promise((resolve) => {
    const fakeRes = {
      headers: {},
      setHeader(key, value) {
        this.headers[key.toLowerCase()] = value;
      },
      end(body) {
        const normalized = typeof body === 'string' ? body : Buffer.from(body).toString('utf8');
        resolve(JSON.parse(normalized));
      }
    };

    httpModule.lastServer.handler(
      { method: 'GET', url: '/health', headers: { host: 'localhost' } },
      fakeRes
    );
  });

  const payload = resPayload;
  assert.equal(payload.status, 'ok');
  assert.equal(payload.service, config.serviceName);
});
