const pathToRegexp = (path) => {
  const keys = [];
  const pattern = path
    .replace(/\//g, '\\/')
    .replace(/:(\w+)/g, (_, key) => {
      keys.push(key);
      return '([^\\/]+)';
    });
  const regex = new RegExp(`^${pattern}$`);
  return { regex, keys };
};

function createRouter() {
  const routes = [];

  function addRoute(method, path, handler) {
    const { regex, keys } = pathToRegexp(path);
    routes.push({ method: method.toUpperCase(), path, handler, regex, keys });
    return router;
  }

  function match(method, pathname) {
    for (const route of routes) {
      if (route.method !== method.toUpperCase()) {
        continue;
      }

      const matchResult = pathname.match(route.regex);
      if (!matchResult) {
        continue;
      }

      const params = {};
      route.keys.forEach((key, index) => {
        params[key] = decodeURIComponent(matchResult[index + 1]);
      });

      return { route, params };
    }

    return null;
  }

  const router = {
    get: (path, handler) => addRoute('GET', path, handler),
    post: (path, handler) => addRoute('POST', path, handler),
    put: (path, handler) => addRoute('PUT', path, handler),
    delete: (path, handler) => addRoute('DELETE', path, handler),
    routes,
    match
  };

  return router;
}

module.exports = { createRouter };
