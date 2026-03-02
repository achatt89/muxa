---
layout: default
title: Observability
nav_order: 4
---

# Observability & Diagnostics

## Dashboard
Visit `http://localhost:8081/dashboard` (new HTML dashboard) for live health, metrics, routing, compression, and headroom status. Auto-refresh every 5s.

## Endpoints
| Endpoint | Description |
|----------|-------------|
| `/health`, `/health/live`, `/health/ready` | Liveness/readiness probes. |
| `/metrics` | JSON metrics (requests, route stats). |
| `/metrics/prometheus` | Prometheus text format. |
| `/metrics/compression` | Headroom compression stats. |
| `/metrics/semantic-cache` | Prompt/semantic cache hits/misses. |
| `/routing/stats` | Active routing strategy + recent samples. |
| `/debug/session` | Inspect a session transcript via `?sessionId=...`. |
| `/v1/agents/*` | Agent diagnostics (list/stats/transcript). |
| `/headroom/status`, `/headroom/restart`, `/headroom/logs` | Headroom sidecar lifecycle. |

## Structured Logs
Muxa defaults to a silent terminal. To see live traffic and routing decisions, set `MUXA_LOG_RESPONSES=true` in your `.env`.

Set `MUXA_LOG_FORMAT=json` (future env) or use external tooling to tail logs. Example:
```
npm start | npx pino-pretty
```
