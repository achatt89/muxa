# TEST_EVIDENCE

Version: 1.0  
Date: 2026-02-19

## Purpose
Centralized evidence of all test executions for one-shot implementation. Each entry must map to backlog task IDs and FR rows.

## Evidence Summary
- Total tests executed: 17
- Total passed: 16
- Total failed: 1
- Critical failures: 0 (previous diagnostics parity miss resolved at 15:08Z)

## Evidence Table
| Timestamp | Epic/Task | FR Rows | Test Command | Test Files/Suite | Result | Output Snippet / Artifact |
|---|---|---|---|---|---|---|
| 2026-02-19T14:50:20Z | E1-T1, E1-T2 | FR-1, FR-10, FR-13 | `npm test` | `test/bootstrap/*.test.js`, `test/config/*.test.js` | PASS | 13 tests passing (bootstrap + config suites) |
| 2026-02-19T14:50:41Z | Phase-1 setup (diagnostics preflight) | FR-3, FR-10, FR-24 | `node scripts/endpoint-parity-preflight.js` | `scripts/endpoint-parity-preflight.js` | FAIL | Script runs but reports all 37 canonical endpoints missing (implementation pending) |
| 2026-02-19T15:00:06Z | E1-T1, E1-T2 (post-tooling verification) | FR-1, FR-10, FR-13 | `npm test` | `test/bootstrap/*.test.js`, `test/config/*.test.js` | PASS | Regression run after lint/dev automation; 13/13 tests passing |
| 2026-02-19T15:07:45Z | E2-T1..E2-T4 | FR-3, FR-9, FR-23, FR-24, FR-26 | `npm test` | `test/api/*.test.js`, `test/bootstrap/*.test.js`, `test/config/*.test.js` | PASS | 34 tests covering Anthropic/OpenAI endpoints, diagnostics, providers |
| 2026-02-19T15:08:35Z | Phase-2 parity sweep | FR-3, FR-10, FR-24 | `node scripts/endpoint-parity-preflight.js` | `scripts/endpoint-parity-preflight.js` | PASS | 37/37 canonical endpoints detected (strict parity) |
| 2026-02-19T15:19:19Z | E2-T1..E2-T4 + E3-T1..E3-T2 | FR-3, FR-4, FR-9, FR-23, FR-24, FR-26 | `npm test` | `test/api/*.test.js`, `test/providers/*.test.js`, `test/routing/*.test.js`, `test/bootstrap/*.test.js`, `test/config/*.test.js` | PASS | 41-test suite covering API endpoints, provider adapters, routing/fallback |
| 2026-02-19T15:19:19Z | Phase-2/3 parity sweep | FR-3, FR-10, FR-24 | `node scripts/endpoint-parity-preflight.js` | `scripts/endpoint-parity-preflight.js` | PASS | 37/37 canonical endpoints detected after routing integration |
| 2026-02-19T15:32:19Z | E4-T1..E4-T2 | FR-5, FR-8 | `npm test` | `test/orchestrator/*.test.js`, `test/tools/*.test.js`, existing suites | PASS | 46-test suite including new orchestrator loop + tool mode coverage |
| 2026-02-19T15:34:59Z | Tool registry (E5-T1) | FR-5, FR-8 | `npm test` | `test/tools/lazy-loader-*.test.js`, `test/orchestrator/*.test.js`, existing suites | PASS | 49-test suite covering lazy loader behavior |
| 2026-02-19T15:34:59Z | Phase-2/3 parity sweep | FR-3, FR-10, FR-24 | `node scripts/endpoint-parity-preflight.js` | `scripts/endpoint-parity-preflight.js` | PASS | 37/37 canonical endpoints detected (post-tooling) |
| 2026-02-19T15:45:47Z | E5-T2..E5-T3 | FR-5, FR-8 | `npm test` | `test/client-mapping/*.test.js`, `test/policy/*.test.js`, existing suites | PASS | 57-test suite including client mapping + policy enforcement |
| 2026-02-19T15:36:33Z | Phase-2/3 parity sweep | FR-3, FR-10, FR-24 | `node scripts/endpoint-parity-preflight.js` | `scripts/endpoint-parity-preflight.js` | PASS | 37/37 canonical endpoints detected (post-policy/mapping) |
| 2026-02-19T16:10:49Z | E6-T1..E6-T3 + caches | FR-5, FR-6, FR-7, FR-8, FR-9 | `npm test` | `test/memory/*.test.js`, `test/cache/*.test.js`, `test/embeddings/*.test.js`, existing suites | PASS | 66-test suite covering memory pipeline, prompt/semantic cache, embeddings override |
| 2026-02-19T16:24:23Z | E7-T1..E7-T3 | FR-2, FR-10, FR-12 | `npm test` | `test/middleware/*.test.js`, `test/reliability/*.test.js`, `test/observability/*.test.js`, existing suites | PASS | 74-test suite covering middleware order, load shedding, retry, circuit breaker, metrics/health |
| 2026-02-19T16:24:30Z | Phase-2/7 parity sweep | FR-3, FR-10, FR-24 | `node scripts/endpoint-parity-preflight.js` | `scripts/endpoint-parity-preflight.js` | PASS | 37/37 canonical endpoints detected after reliability/observability additions |
| 2026-02-19T17:35:43Z | E8-T1..E8-T2 | FR-6 | `npm test` | `test/headroom/*.test.js`, existing suites | PASS | 74+ headroom suites verifying disabled/enabled/fail-open/audit/optimize/CCR |
| 2026-02-19T17:35:48Z | Phase-2/8 parity sweep | FR-3, FR-10, FR-24 | `node scripts/endpoint-parity-preflight.js` | `scripts/endpoint-parity-preflight.js` | PASS | 37/37 canonical endpoints detected post-headroom integration |
| 2026-02-19T17:44:30Z | E9-T1..E9-T3 | FR-13, FR-22, FR-23 | `npm test` | `test/integration/*.test.js`, `test/performance/*.test.js`, existing suites | PASS | 74-test suite with client/provider/perf integration coverage |
| 2026-02-19T17:44:39Z | Phase-2/9 parity sweep | FR-3, FR-10, FR-24 | `node scripts/endpoint-parity-preflight.js` | `scripts/endpoint-parity-preflight.js` | PASS | 37/37 canonical endpoints detected after integration tests |
| 2026-02-19T18:23:18Z | Provider expansion + caching integration | FR-4, FR-5, FR-6, FR-7, FR-8 | `npm test` | Entire suite (91 tests) including new provider adapters, caching/memory/headroom integration | PASS | Validates OpenRouter/Ollama adapters, caches, memory injection, headroom ops |
| 2026-02-19T18:23:36Z | Final parity sweep | FR-3, FR-10, FR-24 | `node scripts/endpoint-parity-preflight.js` | `scripts/endpoint-parity-preflight.js` | PASS | 37/37 canonical endpoints detected (wave 4) |

## Epic Gates
### Epic 1
- Gate status: COMPLETE (bootstrap + config suites green)
- Evidence: `npm test` rows dated 2026-02-19T14:50:20Z and 2026-02-19T15:00:06Z

### Epic 2
- Gate status: COMPLETE (API surface + diagnostics parity passing)
- Evidence: `npm test` rows dated 2026-02-19T15:07:45Z and 2026-02-19T15:19:19Z, parity sweeps at 15:08:35Z and 15:19:19Z

### Epic 3
- Gate status: COMPLETE (provider adapters + routing framework implemented/tests passing)
- Evidence: `npm test` row dated 2026-02-19T15:19:19Z

### Epic 4
- Gate status: IN_PROGRESS (orchestrator loop + execution modes implemented/tests passing)
- Evidence: `npm test` row dated 2026-02-19T15:32:19Z

### Epic 5
- Gate status: IN_PROGRESS (tool registry + client mapping + policies underway)
- Evidence: `npm test` rows dated 2026-02-19T15:34:59Z and 2026-02-19T15:45:47Z

### Epic 6
- Gate status: IN_PROGRESS (memory pipeline + caches + embeddings override implemented/tests passing)
- Evidence: `npm test` row dated 2026-02-19T16:10:49Z

### Epic 7
- Gate status: IN_PROGRESS (middleware, reliability controls, observability endpoints implemented/tests passing)
- Evidence: `npm test` row dated 2026-02-19T16:24:23Z

### Epic 8
- Gate status: IN_PROGRESS (headroom sidecar/compression lifecycle implemented/tests passing)
- Evidence: `npm test` row dated 2026-02-19T17:35:43Z

### Epic 9
- Gate status: IN_PROGRESS (client/provider/performance integration suites executing)
- Evidence: `npm test` row dated 2026-02-19T17:44:30Z

## Critical Contract Tests
| Contract | Test Reference | Status | Notes |
|---|---|---|---|
| Anthropic streaming protocol | `test/api/anthropic-streaming.test.js` | PASS | Verified event ordering (start → stop). |
| OpenAI streaming protocol | `test/api/openai-streaming.test.js` | PASS | Verified chunked deltas + `[DONE]`. |
| Fallback reliability | `test/routing/fallback.test.js` | PASS | Primary failure triggers fallback execution. |
| Diagnostics endpoints | `test/api/diagnostics-endpoints.test.js`, `scripts/endpoint-parity-preflight.js` | PASS | Routing/agents/tokens + canonical endpoint parity validated. |
| Observability endpoints | `test/api/diagnostics-endpoints.test.js` | PASS | Metrics/headroom endpoints return structured payloads. |

## Failed Tests and Remediation Links
| Failure Ref | Related Task | Remediation Attempt(s) | Current Status |
|---|---|---|---|
| FAIL-20260219-001 | Phase-1 foundation bootstrap | Node scaffolding + config implemented; reran diagnostics script | RESOLVED |
| FAIL-20260219-002 | Diagnostics parity (Phase-2 dependency) | Implemented canonical routes + updated parity script for init-docs location; reran successfully | RESOLVED |
