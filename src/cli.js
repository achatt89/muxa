const process = require('node:process');
const { loadConfig, ConfigError } = require('./config');
const { createServer } = require('./server');
const pkg = require('../package.json');

function printHelp(stream = process.stdout) {
  stream.write(`muxa v${pkg.version}\n`);
  stream.write('Usage: muxa [options]\n');
  stream.write('\n');
  stream.write('Options:\n');
  stream.write('  -h, --help            Show this help text\n');
  stream.write('  -v, --version         Show version\n');
  stream.write('  -p, --port <number>   Override listen port\n');
  stream.write('\n');
  stream.write('Environment overrides documented in PRD/TECH manifests.\n');
}

function parseArgs(argv) {
  const args = { _: [] };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];

    if (token === '--help' || token === '-h') {
      args.help = true;
      continue;
    }

    if (token === '--version' || token === '-v') {
      args.version = true;
      continue;
    }

    if (token === '--port' || token === '-p') {
      const next = argv[i + 1];
      if (!next) {
        throw new ConfigError('Missing value for --port flag');
      }
      args.port = Number(next);
      i += 1;
      continue;
    }

    if (token.startsWith('--port=')) {
      args.port = Number(token.split('=')[1]);
      continue;
    }

    args._.push(token);
  }

  return args;
}

async function runCli(rawArgv = process.argv.slice(2)) {
  const args = parseArgs(rawArgv);

  if (args.help) {
    printHelp();
    return { exitCode: 0 };
  }

  if (args.version) {
    process.stdout.write(`${pkg.version}\n`);
    return { exitCode: 0 };
  }

  const config = loadConfig({
    overrides: {
      port: args.port !== undefined ? args.port : undefined
    }
  });

  const server = createServer({ config });
  await server.start();

  const addr = server.address();
  const displayAddress =
    typeof addr === 'string' ? addr : `${addr.address}:${addr.port}`;

  process.stdout.write(`[muxa] listening on ${displayAddress}\n`);

  const shutdown = async () => {
    await server.stop();
    // eslint-disable-next-line n/no-process-exit
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  return { exitCode: 0, server };
}

async function startCli(rawArgv = process.argv.slice(2)) {
  try {
    await runCli(rawArgv);
  } catch (error) {
    if (error instanceof ConfigError) {
      process.stderr.write(`Configuration error: ${error.message}\n`);
    } else {
      process.stderr.write(`${error.stack || error.message}\n`);
    }

    // eslint-disable-next-line n/no-process-exit
    process.exit(1);
  }
}

module.exports = {
  runCli,
  startCli,
  parseArgs,
  printHelp
};
