/* eslint-env browser */
const $ = (id) => document.getElementById(id);
const state = {
  busy: false
};

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('Request failed: ' + url);
  }
  return res.json();
}

function formatNumber(num) {
  return Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(num || 0);
}

function toCurrency(value = 0) {
  const dollars = Number(value) || 0;
  return '$' + formatNumber(dollars);
}

function updateSummary(metrics, routing, headroom, compression) {
  $('summary-requests').textContent = formatNumber(metrics.requests || 0);
  const routeCount = Object.keys(metrics.perRoute || {}).length;
  $('summary-routes').textContent = routeCount ? routeCount : '0';
  $('summary-headroom').textContent = headroom.status || 'disabled';
  $('summary-headroom').className = headroom.status === 'running' ? 'value success' : 'value';
  $('summary-savings').textContent = toCurrency(compression.totalSavings || 0);

  $('routing-mode').textContent = routing.strategy || 'single';
  $('routing-mode').className = 'pill ' + (routing.strategy === 'hybrid' ? 'warning' : 'success');
  $('routing-providers').textContent = routing.primaryProvider
    ? 'Primary: ' + routing.primaryProvider + (routing.fallbackProvider ? ' · Fallback: ' + routing.fallbackProvider : '')
    : 'No provider configured';
}

function renderRoutes(perRoute) {
  const tbody = $('route-table').querySelector('tbody');
  tbody.innerHTML = '';
  const entries = Object.entries(perRoute || {}).sort((a, b) => b[1] - a[1]);
  if (!entries.length) {
    tbody.innerHTML = '<tr><td colspan="2" class="muted">No traffic yet.</td></tr>';
    return;
  }

  for (const [route, count] of entries.slice(0, 8)) {
    const row = document.createElement('tr');
    row.innerHTML = '<td>' + route + '</td><td>' + formatNumber(count) + '</td>';
    tbody.appendChild(row);
  }
}

function renderRoutingSamples(samples) {
  const container = $('routing-log');
  if (!samples || !samples.length) {
    container.textContent = 'No routing samples yet.';
    return;
  }

  container.innerHTML = samples
    .slice(-6)
    .reverse()
    .map((sample) => {
      const provider = sample.provider || 'unknown';
      const latency = sample.latencyMs ? formatNumber(sample.latencyMs) + ' ms' : '—';
      const route = sample.usedFallback ? 'fallback' : 'primary';
      return '[' + provider + '] (' + route + ') ' + latency;
    })
    .join('\n');
}

function updateTokens(stats) {
  $('tokens-input').textContent = formatNumber(stats.input || 0);
  $('tokens-output').textContent = formatNumber(stats.output || 0);
  const ratio = stats.input ? (stats.output || 0) / stats.input : 0;
  $('tokens-ratio').textContent = stats.input ? ratio.toFixed(2) : '0';
}

async function refreshDashboard() {
  if (state.busy) {
    return;
  }
  state.busy = true;
  try {
    const [metrics, routing, headroom, compression, tokenStats] = await Promise.all([
      fetchJson('/metrics'),
      fetchJson('/routing/stats'),
      fetchJson('/headroom/status'),
      fetchJson('/metrics/compression'),
      fetchJson('/api/tokens/stats')
    ]);

    updateSummary(metrics, routing, headroom, compression);
    renderRoutes(metrics.perRoute);
    renderRoutingSamples(routing.samples || []);
    updateTokens(tokenStats);
    $('raw-metrics').textContent = JSON.stringify({ metrics, compression, headroom }, null, 2);
    $('last-refresh').textContent = new Date().toLocaleTimeString();
  } catch (error) {
    $('raw-metrics').textContent = 'Error loading data: ' + error.message;
  } finally {
    state.busy = false;
  }
}
document.addEventListener('DOMContentLoaded', () => {
  $('refresh-btn').addEventListener('click', () => refreshDashboard());
  refreshDashboard();
});
