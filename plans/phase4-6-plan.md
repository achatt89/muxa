# Phase 4-6 Agent Plan

## A3 — Orchestrator & Tooling (Epic 4 + 5)
- **E4-T1 Canonical loop**: build `orchestrator/loop.js` to own step budget + tool result appenders. Tests => `test/orchestrator/loop-success.test.js`, `loop-threshold`, `session-record`.
- **E4-T2 Execution modes**: add `tooling/execution-mode.js` to switch server/client; tests under `test/tools/server-mode.test.js`, `client-mode`.
- **E5-T1 Tool registry/lazy loader**: module for category metadata + dynamic imports with tests `test/tools/lazy-loader-*.test.js`.
- **E5-T2 Client mapping layer**: standalone package folder `packages/client-mapping` to satisfy Codex/Cline/Kilo/Continue/unknown use cases + tests under `test/client-mapping/*.test.js`.
- **E5-T3 Policy controls**: central policy guard exposing workspace boundary/web allowlist/git/test gating + tests `test/policy/*.test.js`.

## A4 — Memory/Cache/Optimization (Epic 6 + Headroom support)
- **E6-T1 Memory pipeline**: `memory/store.js`, `memory/ranker.js`, `memory/injector.js` with tests `test/memory/*.test.js`.
- **E6-T2 Prompt + semantic cache**: `cache/prompt-cache.js`, `cache/semantic-cache.js` with TTL/threshold tests `test/cache/*.test.js`.
- **E6-T3 Embeddings override**: decouple embeddings provider selection + tests `test/embeddings/*.test.js`.
- Coordinate with A6 on Headroom audit/optimize once caches exist.

## A5 — Reliability/Observability/Platform (Epic 7)
- **E7-T1 Middleware stack**: implement pipeline (`middleware/index.js`) for load shedding, request logging, metrics, sessions, validation; tests `test/middleware/*.test.js`.
- **E7-T2 Reliability controls**: circuit breaker + retry/backoff + graceful shutdown logic with tests `test/reliability/*.test.js`.
- **E7-T3 Observability**: extend metrics providers for worker pool/cache/routing plus health probes; tests `test/observability/*.test.js`.

## Sequencing Notes
1. A3 needs base provider orchestration (done) + config; can start immediately focusing on tool loop + registry while A4/A5 work in parallel.
2. A4 should share cache/memory interfaces with A3 to inject context; define TS/JS contracts early to avoid churn.
3. A5’s middleware should wrap the existing server entry once A3 publishes orchestrator entry points; plan for integration harness to avoid regressions.
4. Each agent logs work under their section in `EXECUTION_LOG.md` and appends test evidence rows referencing new suites.
