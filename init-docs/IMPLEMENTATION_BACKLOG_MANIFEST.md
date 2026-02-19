# Implementation Backlog Manifest (Execution + Acceptance Tests)

Version: 1.1  
Date: 2026-02-19  
Purpose: Execution-ready backlog for building muxa from scratch, with test-first acceptance criteria.

## 0) Usage Guidance for AI IDE Executors
- Implement epics in order unless blocked by dependency constraints.
- For each task:
  - implement feature,
  - add tests listed under Acceptance Criteria,
  - run task-level test command,
  - mark done only when all pass.
- Do not copy source code from original project. Match contracts and observable behavior only.

---

## Epic 1 — Foundation: Runtime, Config, and Process Lifecycle
### E1-T1: Bootstrap HTTP service and CLI entry
**Deliverables**
- Service entrypoint with CLI command and direct node start support.
- Port binding with startup logging.

**Acceptance Criteria (Tests)**
1. Service starts on configured port.
2. CLI `--help` and `--version` commands return expected metadata.
3. Startup fails with non-zero code on invalid critical configuration.

**Tests to implement**
- `test/bootstrap/cli-start.test.js`
- `test/bootstrap/version-help.test.js`
- `test/bootstrap/startup-validation.test.js`

**Suggested command**
- `node --test test/bootstrap/*.test.js`

### E1-T2: Environment configuration parser and validator
**Deliverables**
- Config module with defaults, env parsing, provider-specific validation.
- Validation errors with actionable messages.

**Acceptance Criteria (Tests)**
1. Unsupported provider values are rejected.
2. Required provider credentials are enforced.
3. Tool execution mode enum is validated.
4. Fallback provider rules enforce non-local fallback for hybrid mode.

**Tests to implement**
- `test/config/provider-validation.test.js`
- `test/config/tool-mode-validation.test.js`
- `test/config/fallback-validation.test.js`

---

## Epic 2 — API Surface: Anthropic + OpenAI Compatibility
### E2-T1: Anthropic `/v1/messages` endpoint
**Deliverables**
- Non-streaming and streaming responses with Anthropic event grammar.
- Tool block handling.

**Acceptance Criteria (Tests)**
1. Non-stream response follows Anthropic schema.
2. Stream response emits ordered events: `message_start`, block deltas, `message_stop`.
3. Tool-use blocks are accepted and processed.

**Tests to implement**
- `test/api/anthropic-messages.test.js`
- `test/api/anthropic-streaming.test.js`
- `test/api/anthropic-tools.test.js`

### E2-T2: Anthropic `/v1/messages/count_tokens`
**Deliverables**
- Approximate token counting endpoint.

**Acceptance Criteria (Tests)**
1. Valid request returns `input_tokens` numeric value.
2. Invalid payload returns `400` with normalized error shape.

**Tests to implement**
- `test/api/count-tokens.test.js`

### E2-T3: OpenAI compatibility endpoints
**Deliverables**
- `POST /v1/chat/completions`
- `POST /v1/responses`
- `GET /v1/models`
- `POST /v1/embeddings`
- `GET /v1/health`

**Acceptance Criteria (Tests)**
1. Chat completions support non-stream and stream (`[DONE]`).
2. Responses endpoint supports Codex-compatible response flow semantics.
3. Models endpoint returns OpenAI-compatible list envelope.
4. Embeddings endpoint returns list/data/usage envelope.
5. `/v1/health` returns setup-verification payload for IDE clients.

**Tests to implement**
- `test/api/openai-chat.test.js`
- `test/api/openai-responses.test.js`
- `test/api/openai-streaming.test.js`
- `test/api/openai-models.test.js`
- `test/api/openai-embeddings.test.js`
- `test/api/openai-health.test.js`

### E2-T4: Diagnostics endpoints
**Deliverables**
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
- `POST /api/event_logging/batch` (accept-and-noop)

**Acceptance Criteria (Tests)**
1. Routing stats endpoint returns structured diagnostics payload.
2. Debug session endpoint returns guarded session detail (and proper 400/404 behavior).
3. Agent diagnostics endpoints return list/stats/detail/transcript envelopes with proper not-found handling.
4. Session/aggregate token endpoints return structured usage statistics.
5. Provider discovery/config endpoints return operator-usable metadata.
6. Provider health endpoints return list/detail status envelopes.
7. Event logging batch endpoint accepts request and returns success payload.

**Tests to implement**
- `test/api/routing-stats.test.js`
- `test/api/debug-session.test.js`
- `test/api/agents-endpoints.test.js`
- `test/api/token-stats-endpoints.test.js`
- `test/api/providers-discovery-endpoints.test.js`
- `test/api/provider-health-endpoints.test.js`
- `test/api/event-logging-noop.test.js`

---

## Epic 3 — Provider Adapter Framework and Routing
### E3-T1: Adapter abstraction and provider plugins
**Deliverables**
- Adapter contract for request translation, invocation, and response normalization.
- Initial providers: one local + two cloud minimum.

**Acceptance Criteria (Tests)**
1. Provider adapters translate canonical request to provider payload.
2. Provider responses normalize into Anthropic/OpenAI envelopes.
3. Adapter errors normalize with proper error type/status.

**Tests to implement**
- `test/providers/adapter-contract.test.js`
- `test/providers/response-normalization.test.js`
- `test/providers/error-normalization.test.js`

### E3-T2: Hybrid routing + fallback logic
**Deliverables**
- Complexity/tool-count-based routing.
- Primary failure fallback when enabled.
- Routing diagnostics headers.

**Acceptance Criteria (Tests)**
1. Simple request routes local when configured.
2. Complex request routes cloud fallback path.
3. Fallback triggers on primary failure and returns successful result.
4. Routing metadata appears in response headers.

**Tests to implement**
- `test/routing/hybrid-routing.test.js`
- `test/routing/fallback.test.js`
- `test/routing/routing-headers.test.js`

---

## Epic 4 — Orchestrator and Tool Execution Loop
### E4-T1: Canonical orchestration loop
**Deliverables**
- Multi-step loop with max step and loop threshold guards.
- Tool call parse/execute/append cycle.

**Acceptance Criteria (Tests)**
1. Loop completes on final assistant response.
2. Loop terminates with policy error on threshold breach.
3. Session turn append is persisted.

**Tests to implement**
- `test/orchestrator/loop-success.test.js`
- `test/orchestrator/loop-threshold.test.js`
- `test/orchestrator/session-record.test.js`

### E4-T2: Execution modes (server vs client)
**Deliverables**
- Server mode tool execution on proxy host.
- Client mode passthrough tool-call return.

**Acceptance Criteria (Tests)**
1. Server mode executes tool and injects tool_result.
2. Client mode returns tool call without server execution.

**Tests to implement**
- `test/tools/server-mode.test.js`
- `test/tools/client-mode.test.js`

---

## Epic 5 — Tooling Platform and Client Mapping Layer
### E5-T1: Tool registry and lazy loader
**Deliverables**
- Categorized tool registry and lazy loading by prompt/tool hint.
- Core categories loaded at startup.

**Acceptance Criteria (Tests)**
1. Core tool categories load on boot.
2. Non-core categories load only when triggered.
3. Missing tool request triggers category load attempt.

**Tests to implement**
- `test/tools/lazy-loader-core.test.js`
- `test/tools/lazy-loader-trigger.test.js`
- `test/tools/lazy-loader-fallback.test.js`

### E5-T2: Client tool mapping layer (reusable package boundary)
**Deliverables**
- Independent mapping subsystem for Codex/Cline/Kilo/Continue/unknown.
- Canonical tool -> client-specific tool+args mapping.
- Package boundary suitable for reuse in other repos.

**Acceptance Criteria (Tests)**
1. Codex mapping transforms expected tool names/args.
2. Cline/Kilo mappings transform as expected.
3. Continue mapping transforms as expected.
4. Unknown client preserves canonical behavior.
5. Mapping module imports independently without proxy runtime dependency.

**Tests to implement**
- `test/client-mapping/codex.test.js`
- `test/client-mapping/cline-kilo.test.js`
- `test/client-mapping/continue.test.js`
- `test/client-mapping/unknown-pass-through.test.js`
- `test/client-mapping/package-boundary.test.js`

### E5-T3: Policy controls for tooling
**Deliverables**
- Workspace boundary checks.
- Web allowlist checks.
- Git push/test policy toggles.

**Acceptance Criteria (Tests)**
1. Out-of-root file access is blocked.
2. Disallowed web hosts are blocked.
3. Git push blocked when policy disabled.
4. Commit requires tests when policy enabled.

**Tests to implement**
- `test/policy/workspace-boundary.test.js`
- `test/policy/web-allowlist.test.js`
- `test/policy/git-controls.test.js`

---

## Epic 6 — Memory System and Caching
### E6-T1: Long-term memory store + retrieval
**Deliverables**
- Memory extraction, persistence, retrieval ranking, injection.
- Memory type classification and limits.

**Acceptance Criteria (Tests)**
1. High-surprise content is stored; low-surprise content is filtered.
2. Retrieval ranking uses relevance+importance+recency.
3. Top-N memories are injected according to config.
4. Memory decay changes ranking over time.

**Tests to implement**
- `test/memory/extraction-surprise.test.js`
- `test/memory/retrieval-ranking.test.js`
- `test/memory/injection.test.js`
- `test/memory/decay.test.js`

### E6-T2: Prompt cache + semantic cache
**Deliverables**
- Exact prompt cache with TTL/size bounds.
- Optional semantic cache with embeddings similarity threshold.

**Acceptance Criteria (Tests)**
1. Exact prompt repeat hits cache and bypasses provider call.
2. Expired entries miss cache.
3. Semantic cache hit/miss follows threshold behavior.

**Tests to implement**
- `test/cache/prompt-cache-hit-miss.test.js`
- `test/cache/prompt-cache-ttl.test.js`
- `test/cache/semantic-cache-threshold.test.js`

### E6-T3: Embeddings provider override
**Deliverables**
- Embeddings endpoint backend decoupled from chat provider.

**Acceptance Criteria (Tests)**
1. Embeddings use override provider when configured.
2. Unconfigured embeddings backend returns explicit error.

**Tests to implement**
- `test/embeddings/provider-override.test.js`
- `test/embeddings/unconfigured-error.test.js`

---

## Epic 7 — Production Hardening and Operations
### E7-T1: Middleware hardening stack
**Deliverables**
- Load shedding, request logging, metrics, session, budget/rate limit, validation, error handling.

**Acceptance Criteria (Tests)**
1. Middleware order is deterministic.
2. Overload returns `503` with retry hint.
3. Validation errors return normalized error contracts.

**Tests to implement**
- `test/middleware/order.test.js`
- `test/middleware/load-shedding.test.js`
- `test/middleware/validation-errors.test.js`

### E7-T2: Reliability controls
**Deliverables**
- Circuit breaker and retry strategy.
- Graceful shutdown.

**Acceptance Criteria (Tests)**
1. Circuit opens after threshold failures and transitions through half-open.
2. Retry backoff applies to retryable errors only.
3. Graceful shutdown drains/terminates correctly.

**Tests to implement**
- `test/reliability/circuit-breaker.test.js`
- `test/reliability/retry-policy.test.js`
- `test/reliability/graceful-shutdown.test.js`

### E7-T3: Observability endpoints
**Deliverables**
- JSON and Prometheus metrics endpoints.
- Liveness/readiness/deep health endpoints.

**Acceptance Criteria (Tests)**
1. Metrics endpoints expose required families.
2. Health probes reflect state transitions.
3. Routing/worker/cache metrics endpoints return structured payloads.
4. Diagnostic health/provider endpoints return operator-usable details.
5. Agent and token telemetry endpoints expose stable operator contracts.

**Tests to implement**
- `test/observability/metrics-endpoints.test.js`
- `test/observability/health-endpoints.test.js`
- `test/observability/extended-metrics.test.js`
- `test/observability/provider-diagnostics.test.js`

---

## Epic 8 — Headroom Sidecar and Compression Pipeline
### E8-T1: Sidecar lifecycle integration
**Deliverables**
- Optional sidecar startup, status, restart, logs hooks.

**Acceptance Criteria (Tests)**
1. Service starts without sidecar when disabled.
2. Service starts with sidecar when enabled and healthy.
3. Sidecar failure degrades gracefully (fail-open).

**Tests to implement**
- `test/headroom/disabled-mode.test.js`
- `test/headroom/enabled-healthy.test.js`
- `test/headroom/fail-open.test.js`

### E8-T2: Compression behavior
**Deliverables**
- Audit/optimize modes.
- CCR retrieval integration.

**Acceptance Criteria (Tests)**
1. Audit mode records metrics without mutating payload.
2. Optimize mode mutates payload and tracks token savings.
3. CCR retrieval path returns original compressed content.

**Tests to implement**
- `test/headroom/audit-mode.test.js`
- `test/headroom/optimize-mode.test.js`
- `test/headroom/ccr-retrieve.test.js`

---

## Epic 9 — Integration Matrix and Regression Pack
### E9-T1: Client integration matrix
**Deliverables**
- Reproducible scripts/tests for Claude, Cursor, Codex integration.

**Acceptance Criteria (Tests)**
1. Claude flow validates `/v1/messages` stream + tools.
2. Cursor flow validates `/v1/chat/completions`, `/v1/models`, `/v1/embeddings`, `/v1/health`.
3. Codex flow validates `responses` and `chat` wire modes.

**Tests to implement**
- `test/integration/claude-cli-flow.test.js`
- `test/integration/cursor-flow.test.js`
- `test/integration/codex-flow.test.js`

### E9-T2: Provider matrix and fallback resilience
**Deliverables**
- Local provider + cloud providers matrix with fallback checks.

**Acceptance Criteria (Tests)**
1. At least one local provider passes end-to-end.
2. At least two cloud providers pass end-to-end.
3. Forced primary failure triggers fallback success.

**Tests to implement**
- `test/integration/local-provider-e2e.test.js`
- `test/integration/cloud-provider-e2e.test.js`
- `test/integration/fallback-resilience-e2e.test.js`

### E9-T3: Performance and scalability checks
**Deliverables**
- Baseline latency/throughput, load shedding behavior, memory footprint checks.

**Acceptance Criteria (Tests)**
1. P95 latency baseline captured for core routes.
2. Under stress, load shedding protects process stability.
3. No unbounded memory growth in sustained scenario.

**Tests to implement**
- `test/performance/baseline-latency.test.js`
- `test/performance/load-shedding-protection.test.js`
- `test/performance/memory-stability.test.js`

---

## 10) Global Acceptance Gate (Release Candidate)
Release candidate is acceptable only if all are true:
1. **Protocol parity:** Anthropic/OpenAI streaming and non-streaming compatibility tests pass.
2. **Client parity:** Claude CLI, Cursor, Codex integration tests pass.
3. **Provider parity:** minimum 3-provider matrix (1 local + 2 cloud) passes.
4. **Reliability parity:** circuit/retry/load-shedding/graceful-shutdown tests pass.
5. **Optimization parity:** cache/memory/token-optimization tests demonstrate expected behavior.
6. **Observability parity:** metrics and health endpoints pass contract checks.

---

## 11) Suggested CI Pipeline Stages
1. `lint` / static checks
2. `unit` (fast, isolated)
3. `integration` (mocked providers)
4. `provider-smoke` (optional real providers via secrets)
5. `performance-smoke`
6. `manifest-contract-check` (ensure endpoint and config schema still match manifests)
7. `diagnostics-contract-check` (routing/provider/session diagnostics endpoint contract)

---

## 12) Traceability Map
- `PRD_MANIFEST.md` FR items map to this backlog’s epics/tasks.
- `TECHNICAL_MANIFEST.json` contracts map to corresponding test files listed in each task.
- `CANONICAL_ENDPOINTS_MANIFEST.md` is the endpoint source of truth for API-surface tasks and tests.
- Any feature addition must update all related manifests and include matching acceptance tests.
