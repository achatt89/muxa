'use strict';

const { readFileSync } = require('node:fs');
const path = require('node:path');

const cache = {
  css: null,
  js: null
};

function getDashboardCss() {
  if (!cache.css) {
    const cssPath = path.join(__dirname, 'app.css');
    cache.css = readFileSync(cssPath, 'utf8');
  }
  return cache.css;
}

function getDashboardScript() {
  if (!cache.js) {
    const jsPath = path.join(__dirname, 'app.js');
    cache.js = readFileSync(jsPath, 'utf8');
  }
  return cache.js;
}

module.exports = {
  getDashboardCss,
  getDashboardScript
};
