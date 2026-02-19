const { EventEmitter } = require('node:events');

class MiddlewarePipeline {
  constructor() {
    this.middlewares = [];
  }

  use(fn) {
    this.middlewares.push(fn);
    return this;
  }

  async run(context, handler) {
    let idx = -1;
    const runner = async (i) => {
      if (i <= idx) {
        throw new Error('next() called multiple times');
      }
      idx = i;
      const fn = this.middlewares[i];
      if (!fn) {
        return handler(context);
      }
      return fn(context, () => runner(i + 1));
    };
    return runner(0);
  }
}

function createLoadSheddingMiddleware(options = {}) {
  const maxConcurrent = options.maxConcurrent ?? 10;
  let inFlight = 0;

  return async (ctx, next) => {
    if (inFlight >= maxConcurrent) {
      ctx.res.statusCode = 503;
      ctx.res.setHeader('retry-after', '1');
      ctx.res.end(JSON.stringify({ error: 'LOAD_SHEDDING' }));
      return;
    }
    inFlight += 1;
    try {
      await next();
    } finally {
      inFlight -= 1;
    }
  };
}

function createLoggingMiddleware(emitter = new EventEmitter()) {
  return async (ctx, next) => {
    const start = Date.now();
    emitter.emit('request:start', ctx);
    await next();
    emitter.emit('request:end', { ctx, duration: Date.now() - start });
  };
}

module.exports = {
  MiddlewarePipeline,
  createLoadSheddingMiddleware,
  createLoggingMiddleware
};
