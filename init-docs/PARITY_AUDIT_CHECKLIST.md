# Parity Audit Checklist (Release Gate)

Version: 1.1  
Date: 2026-02-19  
Purpose: Final pass checklist to verify full feature parity (MVP + non-MVP) when re-implementing the project from manifests.

## How to Use
- Execute sections in order.
- Mark each item `PASS`, `FAIL`, or `N/A` with evidence links (test output, logs, screenshots, curl output).
- Release is blocked if any **Critical** item fails.
- Use with:
  - [BRD_MANIFEST.md](BRD_MANIFEST.md)
  - [PRD_MANIFEST.md](PRD_MANIFEST.md)
  - [TECHNICAL_MANIFEST.json](TECHNICAL_MANIFEST.json)
  - [IMPLEMENTATION_BACKLOG_MANIFEST.md](IMPLEMENTATION_BACKLOG_MANIFEST.md)
  - [FR_TRACEABILITY_MATRIX.md](FR_TRACEABILITY_MATRIX.md)
  - [CANONICAL_ENDPOINTS_MANIFEST.md](CANONICAL_ENDPOINTS_MANIFEST.md)

---

## 1) Governance & Traceability Gate (Critical)
- [ ] **Critical** BRD exists and maps business goals to product requirements.
- [ ] **Critical** PRD FRs are fully mapped to backlog tasks.
- [ ] **Critical** Every FR row in traceability matrix has at least one automated test.
- [ ] **Critical** No feature in technical manifest lacks a backlog task owner.
- [ ] Evidence captured for all gates in a parity report artifact.

## 2) API Contract Gate (Critical)
### Anthropic Compatibility
- [ ] **Critical** `POST /v1/messages` non-streaming contract matches schema.
- [ ] **Critical** `POST /v1/messages` streaming event order matches contract.
- [ ] **Critical** Tool blocks (`tool_use`, `tool_result`) round-trip correctly.
- [ ] `POST /v1/messages/count_tokens` returns valid envelope and error shape.

### OpenAI Compatibility
- [ ] **Critical** `POST /v1/chat/completions` non-streaming contract matches schema.
- [ ] **Critical** `POST /v1/responses` contract matches Codex-compatible response semantics.
- [ ] **Critical** streaming emits `data:` chunks and terminal `[DONE]`.
- [ ] `GET /v1/models` returns OpenAI list envelope.
- [ ] `POST /v1/embeddings` returns list/data/usage envelope.
- [ ] `GET /v1/health` supports IDE setup verification.

### Operational/Diagnostics Endpoints
- [ ] `GET /health`, `/health/live`, `/health/ready` implemented.
- [ ] `GET /routing/stats` returns structured routing diagnostics.
- [ ] `GET /debug/session` returns guarded diagnostics with proper 400/404 behavior.
- [ ] `GET /v1/agents`, `/v1/agents/stats`, `/v1/agents/:agentId/transcript`, `/v1/agents/:executionId` implemented.
- [ ] `GET /api/sessions/:sessionId/tokens` and `GET /api/tokens/stats` implemented.
- [ ] `GET /v1/providers`, `GET /v1/providers/:name`, and `GET /v1/config` implemented.
- [ ] `GET /v1/health/providers` and `/v1/health/providers/:name` implemented.
- [ ] `POST /api/event_logging/batch` accept-and-noop compatibility path implemented.

## 3) Provider Parity Gate (Critical)
- [ ] **Critical** At least 1 local provider passes E2E (Ollama/llama.cpp/LM Studio).
- [ ] **Critical** At least 2 cloud providers pass E2E.
- [ ] **Critical** Provider error normalization is consistent across adapters.
- [ ] **Critical** Fallback triggers on primary failure and recovers response path.
- [ ] Model mapping behavior from client model IDs to provider model IDs verified.
- [ ] Remote endpoint support validated (localhost + LAN IP + hostname/domain).

## 4) Orchestration & Tool Loop Gate (Critical)
- [ ] **Critical** Multi-step tool loop executes end-to-end.
- [ ] **Critical** Loop guard threshold prevents infinite loops.
- [ ] Server mode tool execution works.
- [ ] Client/passthrough mode tool return works.
- [ ] Tool truncation and timeout safeguards work under large outputs.

## 5) Client Compatibility Gate (Critical)
### Claude Code CLI
- [ ] **Critical** Works with `ANTHROPIC_BASE_URL` and dummy API key.
- [ ] Tool and streaming behavior matches expected CLI workflows.

### Cursor
- [ ] **Critical** Works with OpenAI base URL ending `/v1`.
- [ ] Chat and edit workflows function.
- [ ] `@Codebase` works when embeddings are configured.

### Codex
- [ ] **Critical** `responses` wire mode works.
- [ ] Fallback `chat` wire mode works.
- [ ] Tool execution behavior aligns with trust/sandbox mode expectations.

### Mapped Clients
- [ ] Cline/Kilo/Continue mappings validated for tool names and arg schemas.
- [ ] Unknown clients degrade to standards-compliant behavior.

## 6) Memory, Cache, and Optimization Gate (Critical)
- [ ] **Critical** Memory extraction stores high-surprise and filters low-surprise content.
- [ ] **Critical** Memory retrieval ranking uses relevance + importance + recency.
- [ ] Prompt cache hit/miss/TTL behavior verified.
- [ ] Semantic cache behavior verified (if enabled).
- [ ] Token optimization stages demonstrably active.
- [ ] Compression/tokens-saved metrics observable.

## 7) Headroom & Sidecar Gate (Non-MVP but Required for Full Parity)
- [ ] Sidecar disabled mode works (no hard dependency).
- [ ] Sidecar enabled mode works with health status.
- [ ] Fail-open behavior works if sidecar unavailable.
- [ ] Audit mode vs optimize mode behaviors validated.
- [ ] CCR retrieval flow validated.
- [ ] Headroom ops endpoints (`/health/headroom`, `/headroom/*`, `/metrics/compression`) validated.

## 8) Reliability & Safety Gate (Critical)
- [ ] **Critical** Circuit breaker transitions `CLOSED -> OPEN -> HALF_OPEN -> CLOSED` validated.
- [ ] **Critical** Retry policy applied only to retryable failures.
- [ ] **Critical** Load shedding returns `503` + retry hint under pressure.
- [ ] **Critical** Graceful shutdown drains in-flight work and exits cleanly.
- [ ] Workspace boundary enforcement blocks out-of-scope file access.
- [ ] Web allowlist policy blocks disallowed hosts.
- [ ] Git/test policy gates enforced.

## 9) Observability Gate (Critical)
- [ ] **Critical** Structured logs include request/session correlation IDs.
- [ ] **Critical** Metrics include requests, latency, errors, tokens, cache, circuit, load shedding.
- [ ] Worker pool, lazy-loader, semantic cache metrics endpoints validated.
- [ ] Health probes return correct liveness/readiness/deep states.

## 10) Config Contract Gate (Critical)
- [ ] **Critical** Unsupported provider values are rejected.
- [ ] **Critical** Required provider credentials enforced.
- [ ] **Critical** Tool execution mode validation enforced.
- [ ] **Critical** Hybrid fallback validation prevents invalid local fallback setup.
- [ ] Hot-reload behavior validated (if enabled).
- [ ] MCP and sandbox config group validated.
- [ ] MCP manifest/discovery config group validated.
- [ ] Agent execution config group validated.
- [ ] Security/audit and oversized-error config groups validated.
- [ ] Policy safe-command and web-retry config groups validated.
- [ ] Worker pool config group validated.

## 11) Deployment Profiles Gate
### Local Dev
- [ ] Startup, health, and core workflows pass.

### Docker Compose
- [ ] Containers start cleanly with volumes/network.
- [ ] Health checks and logs are accessible.

### Production-like
- [ ] Probe/readiness behavior verified.
- [ ] Metrics scraping verified.
- [ ] Shutdown and restart behavior verified.

## 12) Performance Gate
- [ ] Baseline P95 latency captured for key endpoints.
- [ ] Stress behavior validated with load shedding protection.
- [ ] Memory footprint stable during sustained workload.

## 13) Security & Privacy Gate
- [ ] No secrets leaked in logs/errors.
- [ ] Local-only mode validated with no cloud dependency.
- [ ] Data retention and purge behavior for session/memory stores verified.
- [ ] Sandbox mode behavior validated for MCP/tooling where applicable.

## 14) Final Release Decision
- [ ] **Critical** All critical checks pass.
- [ ] Any non-critical failures have approved waivers and remediation plan.
- [ ] Parity report signed off by engineering owner.

---

## Parity Report Template
Use this structure when running the audit:

- Build/commit/ref:
- Environment:
- Providers tested:
- Clients tested:
- Checklist summary: `X/Y Critical`, `A/B Non-Critical`
- Failing items:
- Waivers:
- Final decision: `GO` / `NO-GO`
