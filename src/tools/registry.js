const TOOL_CATEGORIES = {
  workspace: async () => ({ name: 'workspace' }),
  git: async () => ({ name: 'git' }),
  shell: async () => ({ name: 'shell' })
};

const eagerCategories = new Set(['workspace']);
const cache = new Map();

async function loadCategory(name) {
  if (cache.has(name)) {
    return cache.get(name);
  }

  const loader = TOOL_CATEGORIES[name];
  if (!loader) {
    return null;
  }

  const module = await loader();
  cache.set(name, module);
  return module;
}

async function ensureEagerLoaded() {
  await Promise.all(Array.from(eagerCategories).map((name) => loadCategory(name)));
}

module.exports = {
  loadCategory,
  ensureEagerLoaded,
  TOOL_CATEGORIES,
  eagerCategories,
  cache
};
