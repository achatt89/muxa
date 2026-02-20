'use strict';

const { readFileSync } = require('node:fs');
const path = require('node:path');

let cachedTemplate = null;

function buildDashboardPage() {
  if (!cachedTemplate) {
    const templatePath = path.join(__dirname, 'template.html');
    cachedTemplate = readFileSync(templatePath, 'utf8');
  }
  return cachedTemplate;
}

module.exports = {
  buildDashboardPage
};
