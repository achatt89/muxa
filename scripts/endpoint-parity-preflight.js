const fs = require('node:fs');
const path = require('node:path');

const root = process.cwd();

function read(file) {
  const primary = path.join(root, file);
  if (fs.existsSync(primary)) {
    return fs.readFileSync(primary, 'utf8');
  }

  const fallback = path.join(root, 'init-docs', file);
  return fs.readFileSync(fallback, 'utf8');
}

function parseCanonicalEndpoints(markdown) {
  const endpoints = new Set();
  const regex = /-\s+`(GET|POST|PUT|PATCH|DELETE)\s+([^`]+)`/g;
  let match;
  while ((match = regex.exec(markdown)) !== null) {
    endpoints.add(`${match[1]} ${match[2]}`);
  }
  return endpoints;
}

function parseCodeRoutes(filePath, mountPrefix = '') {
  const text = read(filePath);
  const routes = new Set();
  const regex = /(app|router)\.(get|post|put|patch|delete)\(\s*["'`]([^"'`]+)["'`]/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    const method = match[2].toUpperCase();
    const rawPath = match[3];
    const fullPath = `${mountPrefix}${rawPath}`.replaceAll('//', '/');
    routes.add(`${method} ${fullPath}`);
  }

  return routes;
}

const canonical = parseCanonicalEndpoints(read('CANONICAL_ENDPOINTS_MANIFEST.md'));

const codeRoutes = new Set();
const routeSources = [
  { file: 'src/server.js', prefix: '' },
  { file: 'src/api/router.js', prefix: '' },
  { file: 'src/api/openai-router.js', prefix: '' },
  { file: 'src/api/providers-handler.js', prefix: '' }
];

for (const source of routeSources) {
  for (const route of parseCodeRoutes(source.file, source.prefix)) {
    codeRoutes.add(route);
  }
}

const sortCompare = (left, right) => left.localeCompare(right);
const missingInCode = [...canonical].filter((route) => !codeRoutes.has(route)).sort(sortCompare);
const missingInManifest = [...codeRoutes].filter((route) => !canonical.has(route)).sort(sortCompare);

const result = {
  generatedAt: new Date().toISOString(),
  canonicalCount: canonical.size,
  codeCount: codeRoutes.size,
  missingInCode,
  missingInManifest,
  pass: missingInCode.length === 0 && missingInManifest.length === 0,
  sources: routeSources.map((source) => source.file)
};

console.log(JSON.stringify(result, null, 2));
