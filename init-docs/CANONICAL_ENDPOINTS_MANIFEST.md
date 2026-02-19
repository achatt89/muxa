# Canonical Endpoints Manifest

Version: 1.0  
Date: 2026-02-19  
Purpose: Single source of truth for externally exposed HTTP endpoints used by manifests, backlog, and parity gates.

## 1) Anthropic-Compatible API
- `POST /v1/messages`
- `POST /v1/messages/count_tokens`

## 2) OpenAI-Compatible API
- `POST /v1/chat/completions`
- `POST /v1/responses`
- `GET /v1/models`
- `POST /v1/embeddings`
- `GET /v1/health`

## 3) Provider, Agent, and Diagnostics APIs
- `GET /routing/stats`
- `GET /debug/session`
- `GET /v1/agents`
- `GET /v1/agents/stats`
- `GET /v1/agents/:agentId/transcript`
- `GET /v1/agents/:executionId`
- `GET /api/sessions/:sessionId/tokens`
- `GET /api/tokens/stats`
- `GET /v1/providers`
- `GET /v1/providers/:name`
- `GET /v1/config`
- `GET /v1/health/providers`
- `GET /v1/health/providers/:name`
- `POST /api/event_logging/batch`

## 4) Health and Operations APIs
- `GET /health`
- `GET /health/live`
- `GET /health/ready`
- `GET /health/headroom`
- `GET /metrics`
- `GET /metrics/observability`
- `GET /metrics/prometheus`
- `GET /metrics/compression`
- `GET /metrics/circuit-breakers`
- `GET /metrics/load-shedding`
- `GET /metrics/worker-pool`
- `GET /metrics/semantic-cache`
- `GET /metrics/lazy-tools`
- `GET /headroom/status`
- `POST /headroom/restart`
- `GET /headroom/logs`

## 5) Change Control
- Any endpoint addition/removal must be updated in this file first.
- `PRD_MANIFEST.md`, `TECHNICAL_MANIFEST.json`, `IMPLEMENTATION_BACKLOG_MANIFEST.md`, and `PARITY_AUDIT_CHECKLIST.md` must reference this file and remain consistent.
