# FR Traceability Matrix

Version: 1.1  
Date: 2026-02-19  
Purpose: Map PRD functional requirements to backlog tasks, technical manifest sections, and acceptance tests.

## Legend
- PRD: `PRD_MANIFEST.md`
- TECH: `TECHNICAL_MANIFEST.json`
- Backlog: `IMPLEMENTATION_BACKLOG_MANIFEST.md`
- Endpoints: `CANONICAL_ENDPOINTS_MANIFEST.md`

| PRD FR | Requirement Summary | Backlog Mapping | TECH Mapping | Primary Acceptance Tests |
|---|---|---|---|---|
| FR-1 | Core boot + startup validation | E1-T1, E1-T2 | `architecture.startupSequence`, `configurationContract` | `test/bootstrap/*.test.js`, `test/config/*.test.js` |
| FR-2 | Deterministic request intake middleware | E7-T1 | `reliabilityAndSafety.middlewareOrder` | `test/middleware/order.test.js` |
| FR-3 | Anthropic/OpenAI format translation + stream semantics (chat + responses) | E2-T1, E2-T3 | `apiContract.anthropicCompatible`, `apiContract.openAICompatible`, `canonicalRequestModel` | `test/api/anthropic-*.test.js`, `test/api/openai-*.test.js`, `test/api/openai-responses.test.js` |
| FR-4 | Provider invocation + hybrid/fallback routing | E3-T1, E3-T2 | `providerAbstraction` | `test/routing/*.test.js`, `test/providers/*.test.js` |
| FR-5 | Tool calling loop with limits | E4-T1 | `orchestrator.agentLoop` | `test/orchestrator/loop-*.test.js` |
| FR-6 | Client-specific mapping layer (reusable) | E5-T2 | `toolingSystem.clientToolMapping` | `test/client-mapping/*.test.js` |
| FR-7 | Long-term memory subsystem | E6-T1 | `memoryPipeline`, `stateAndPersistence.memorySchema` | `test/memory/*.test.js` |
| FR-8 | Prompt + semantic cache | E6-T2 | `caching` | `test/cache/*.test.js` |
| FR-9 | Embeddings endpoint + provider override | E2-T3, E6-T3 | `apiContract.openAICompatible`, `configurationContract.envSchema` | `test/api/openai-embeddings.test.js`, `test/embeddings/*.test.js` |
| FR-10 | Observability + metrics | E7-T3 | `observability`, `apiContract.opsEndpoints` | `test/observability/*.test.js` |
| FR-11 | Security/policies | E5-T3 | `reliabilityAndSafety.policies` | `test/policy/*.test.js` |
| FR-12 | Reliability (circuit/retry/shutdown) | E7-T2 | `reliabilityAndSafety.circuitBreaker`, `retry`, `loadShedding` | `test/reliability/*.test.js` |
| FR-13 | Installation/runtime modes | E1-T1, E9-T1 | `installationProfiles`, `deploymentProfiles` | `test/bootstrap/cli-start.test.js`, integration smoke tests |
| FR-14 | Model discovery and mapping | E2-T3, E3-T1 | `apiContract.openAICompatible`, `providerAbstraction.adapterResponsibilities` | `test/api/openai-models.test.js` |
| FR-15 | Embedding quality/provider profiles | E6-T3 | `providerAbstraction.providerSpecificNotes`, `configurationContract.envSchema` | `test/embeddings/*.test.js` |
| FR-16 | Hot reload | E1-T2, E7-T3 | `architecture.startupSequence`, `configurationContract.envSchema.hotReload` | `test/config/hot-reload.test.js` *(to add)* |
| FR-17 | Worker pool offload + stats | E7-T3 | `architecture.startupSequence`, `apiContract.opsEndpoints`, `configurationContract.envSchema.workerPool` | `test/observability/extended-metrics.test.js` |
| FR-18 | Rate limit + budget controls | E7-T1 | `reliabilityAndSafety.middlewareOrder`, `configurationContract` | `test/middleware/load-shedding.test.js`, rate/budget tests *(to add)* |
| FR-19 | Load shedding behavior | E7-T1, E9-T3 | `reliabilityAndSafety.loadShedding` | `test/middleware/load-shedding.test.js`, `test/performance/load-shedding-protection.test.js` |
| FR-20 | Sidecar lifecycle | E8-T1 | `optimizationPipeline.headroomSidecar`, `apiContract.opsEndpoints` | `test/headroom/*.test.js` |
| FR-21 | MCP discovery + sandbox | E5-T1, E5-T3 | `toolingSystem.mcp`, `configurationContract.envSchema.mcp` | `test/tools/mcp-discovery.test.js` *(to add)*, `test/policy/*.test.js` |
| FR-22 | Remote endpoint compatibility | E3-T2, E9-T2 | `providerAbstraction.routing.guardrails` | `test/integration/cloud-provider-e2e.test.js`, remote-url validation tests *(to add)* |
| FR-23 | Auxiliary compatibility endpoints | E2-T4 | `clientCompatibility.auxiliaryEndpoints`, `apiContract.opsEndpoints` | `test/api/event-logging-noop.test.js` |
| FR-24 | Provider/session diagnostics | E2-T4, E7-T3 | `apiContract.opsEndpoints`, `runbooks` | `test/api/provider-health-endpoints.test.js`, `test/api/debug-session.test.js` |
| FR-25 | Provider discovery + runtime config diagnostics | E2-T4 | `apiContract.opsEndpoints`, `providerAbstraction`, `configurationContract` | `test/api/providers-discovery-endpoints.test.js` |
| FR-26 | Agent execution + token telemetry diagnostics | E2-T4, E7-T3 | `apiContract.opsEndpoints`, `observability` | `test/api/agents-endpoints.test.js`, `test/api/token-stats-endpoints.test.js` |

## Coverage Notes
- “*(to add)*” marks tests defined at matrix level that should be added as part of implementation to close strict FR coverage.
- Release should be blocked if any FR row lacks at least one passing automated test.
