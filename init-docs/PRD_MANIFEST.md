# Muxa PRD Manifest

Version: 1.1  
Date: 2026-02-19  
Product Codename: Muxa Universal LLM Proxy

## 1) Purpose
Build a self-hosted proxy service that implements Muxa’s user-facing capabilities and behavior (feature parity), while implementing original code from scratch.

The product must act as a compatibility bridge between AI coding clients (Claude Code, Cursor, Codex CLI, Cline/Kilo/Continue-style OpenAI clients) and multiple cloud/local LLM providers, with tool-calling orchestration, hybrid routing, memory, caching, observability, and production hardening.

## 2) Product Vision
One universal, provider-agnostic proxy endpoint that lets teams route coding-assistant workflows to any preferred model/provider with zero or minimal client-side changes.

## 3) Target Users
- Individual developers who want local/private models and lower cost.
- Teams standardizing one internal AI gateway for multiple IDE/CLI clients.
- Enterprises requiring reliability, policy guardrails, telemetry, and deployment flexibility.

## 4) Jobs To Be Done
- “Use my AI coding tool with a different model provider without changing tool behavior.”
- “Switch or fallback between providers automatically when failures happen.”
- “Cut token costs via caching/compression/tool selection.”
- “Run tools either on server (centralized) or client (passthrough).”
- “Keep long-lived context across sessions through memory retrieval.”

## 5) Scope (In)
### 5.1 API Compatibility
- Anthropic-style endpoint compatibility:
  - `POST /v1/messages`
  - `POST /v1/messages/count_tokens`
- OpenAI-style endpoint compatibility:
  - `POST /v1/chat/completions`
  - `POST /v1/responses`
  - `GET /v1/models`
  - `POST /v1/embeddings`
  - `GET /v1/health`
- Additional operational endpoints:
  - Health (`/health`, `/health/live`, `/health/ready`)
  - Metrics (JSON + Prometheus formats)
  - Routing stats and diagnostics
  - Agent diagnostics (`/v1/agents`, `/v1/agents/stats`, `/v1/agents/:agentId/transcript`, `/v1/agents/:executionId`)
  - Token telemetry (`/api/sessions/:sessionId/tokens`, `/api/tokens/stats`)
  - Provider discovery/config (`/v1/providers`, `/v1/providers/:name`, `/v1/config`)
  - Provider health diagnostics (`/v1/health/providers`, `/v1/health/providers/:name`)
  - Session/debug diagnostics (`/debug/session`)
- Canonical endpoint source of truth: [CANONICAL_ENDPOINTS_MANIFEST.md](CANONICAL_ENDPOINTS_MANIFEST.md)

### 5.2 Provider Support
Replicate support for these provider classes:
- Cloud: Databricks, OpenRouter, Azure OpenAI, Azure Anthropic, OpenAI, AWS Bedrock, Vertex-style Gemini API, Z.AI-like Anthropic-compatible endpoint
- Local/self-hosted: Ollama, llama.cpp server, LM Studio OpenAI-compatible endpoint

### 5.3 Tooling & Agent Loop
- Built-in tool registry categories:
  - Workspace/file tools
  - Shell execution tools
  - Git tools
  - Search/index tools
  - Edits/diff tools
  - Task/test tools
  - Web search/fetch tools
  - MCP tool bridges
- Lazy/on-demand tool category loading based on prompt/tool intent.
- Iterative tool loop with configurable max steps and loop protection threshold.

### 5.4 Execution Modes
- Server mode (default): server executes tools.
- Client/passthrough mode: forward tool calls for client execution.
- Auto behavior based on request tool payload presence and mode config.

### 5.5 Context, Memory, and Optimization
- Long-term memory subsystem:
  - Extraction after responses
  - Surprise/novelty filtering
  - Ranked retrieval and prompt injection
- Prompt cache and optional semantic response cache.
- Token optimization pipeline:
  - Smart tool selection
  - Prompt caching
  - Memory deduplication
  - Tool output truncation
  - Dynamic system prompt shaping
  - Conversation/history compression
- Optional sidecar compression integration (Headroom-like) with Docker-managed lifecycle.

### 5.6 Production Hardening
- Load shedding middleware
- Circuit breaker + retry/backoff
- Rate limiting
- Graceful shutdown
- Request correlation IDs + structured logs
- Prometheus and JSON metrics endpoints
- Config hot-reload from env file

## 6) Scope (Out)
- No requirement to reproduce exact internal implementation details, file names, or code structure.
- No requirement to match historical bugs/quirks unless required for client compatibility.
- No UI/dashboard web app in MVP.

## 7) Functional Requirements
### FR-1: Core Proxy Boot
- Service starts from CLI and listens on configurable port.
- Startup validates provider-specific required credentials.
- Health endpoints are available before production traffic.

### FR-2: Request Intake
- Parse JSON request bodies with configurable size limits.
- Apply middleware in deterministic order:
  1. Load shedding
  2. Request ID/logging
  3. Metrics
  4. Session handling
  5. Budget/rate/policy checks
  6. Route handling
  7. Error normalization

### FR-3: API Format Translation
- Anthropic messages ↔ internal canonical format ↔ provider format.
- OpenAI chat completions ↔ canonical format ↔ provider format.
- Streaming translation must preserve protocol semantics:
  - Anthropic event stream structure
  - OpenAI `data:` chunk stream and `[DONE]`

### FR-4: Provider Invocation & Routing
- Support static provider selection (`MODEL_PROVIDER`).
- Support hybrid routing based on request complexity/tool count.
- Support fallback provider on primary failure (configurable enable/disable).
- Keep routing decision observable via headers and metrics.

### FR-5: Tool Calling Loop
- Detect tool calls in model output.
- Execute tool calls under policy constraints.
- Append tool results and continue loop until completion or max limits.
- Prevent infinite loops with explicit thresholds.

### FR-6: Client-Specific Tool Mapping
- This needs to be a flexible subsystem that can evolve as we discover client-specific quirks and requirements. Also this has to be an independent layer that can be installed on multiple repos. I have a need for this in other projects as well.
- Detect calling client family (Codex/Cline/Kilo/Continue/unknown).
- Map canonical tool names and args to client-specific schemas where needed.

### FR-7: Memory System
- Store durable memories with type, importance, timestamps, and session scope.
- Perform ranked retrieval using relevance + recency + importance.
- Inject top-N memories into request context.
- Enable explicit memory search/add/forget tooling.

### FR-8: Caching
- Prompt cache with TTL and bounded size.
- Optional semantic response cache using embeddings and similarity threshold.

### FR-9: Embeddings
- Implement OpenAI-compatible embeddings endpoint.
- Allow provider override for embeddings independent of chat provider.
- Support local and cloud embeddings backends.

### FR-10: Observability
- Expose machine-readable metrics and Prometheus exposition format.
- Track request counts, latency, errors, token usage, cache hits/misses, circuit state, load shedding events.

### FR-11: Security & Policy
- Enforce workspace boundaries for file operations.
- Configurable web host allowlists for fetch/search tools.
- Policy controls for git behavior and test-before-commit gates.

### FR-12: Operational Reliability
- Circuit breakers around provider calls.
- Exponential backoff retries with jitter for retryable failures.
- Graceful shutdown of server, workers, and sidecars.

## 8) Non-Functional Requirements
- Runtime: Node.js 20+.
- API responsiveness: streaming starts quickly for stream requests.
- Reliability: no process crash on provider transient failures.
- Throughput: support concurrent requests with protective load shedding.
- Safety: sanitize/validate input payloads and tool parameters.
- Portability: local, Docker, and remote-network provider endpoints.

## 9) External Interfaces
- CLI command to run service.
- HTTP APIs compatible with Anthropic/OpenAI clients.
- Environment-variable-first configuration model.
- Optional Docker Compose profile for sidecar services.

## 10) Configuration Contract (High-Level)
Required categories:
- Provider selection and credentials
- Routing/fallback controls
- Tool execution mode
- Memory/caching controls
- Token optimization controls
- Retry/circuit/load-shed thresholds
- Hot reload flags
- Headroom/sidecar flags
- Agent execution controls
- MCP manifest/discovery controls
- Workspace test orchestration profiles
- Security/audit logging and oversized-error controls

## 11) Acceptance Criteria (Feature Parity)
- Claude-style client can call `/v1/messages` including streaming and tool loops.
- OpenAI-style client can call `/v1/chat/completions` including streaming.
- At least one local and one cloud provider run end-to-end.
- Provider fallback activates on simulated primary failure.
- Tool execution works in both server and passthrough modes.
- Memory retrieval injects context and changes model responses across turns.
- Metrics endpoints expose request/token/cache data.
- Health/readiness probes return expected operational states.

## 12) Implementation Milestones
1. Bootstrap server, config loader, health + basic routing.
2. Canonical message model + Anthropic/OpenAI adapters.
3. Provider abstraction + initial providers + fallback logic.
4. Tool registry + execution loop + policy enforcement.
5. Memory store/retrieval + prompt cache + semantic cache.
6. Observability, load shedding, circuit breakers, retries.
7. Embeddings endpoint + index/search support + docs/tests hardening.

## 13) Risks
- Protocol mismatch edge cases in streaming transforms.
- Provider-specific tool-calling incompatibilities.
- Complexity creep from too many provider-specific branches.
- Security risks in shell/file tools when policies are weak.

## 14) Success Metrics
- Compatibility: ≥95% pass rate on scripted Anthropic/OpenAI integration tests.
- Reliability: fallback recovers from primary provider outages automatically.
- Efficiency: measurable token reduction vs no-optimization baseline.
- Operability: production metrics + health checks usable by orchestration systems.

## 15) Replication Rule
The implementation must match externally observable behavior and features, not source code. Rebuild architecture and logic independently while preserving API contracts, workflows, and operational characteristics described above.

## 16) Client Compatibility Matrix (Detailed)
### 16.1 Claude Code CLI
- Backend override via `ANTHROPIC_BASE_URL` with dummy `ANTHROPIC_API_KEY` accepted.
- Must preserve Anthropic message semantics, tool loop behavior, and SSE event ordering.
- Must support shell/file/git workflows expected by Claude Code agents.
- Must preserve non-blocking streaming for text-only requests and acceptable behavior for tool-heavy requests.

### 16.2 Cursor IDE
- OpenAI-compatible base URL required with `/v1` suffix.
- Must support `chat/completions`, `models`, `embeddings`, and health endpoint for setup verification.
- Must support Cursor chat and edit operations via OpenAI-compatible transport.
- Must provide embeddings behavior compatible with `@Codebase` semantic workflows.

### 16.3 Codex CLI
- Must support OpenAI wire formats used by Codex (`responses` and fallback-compatible chat semantics).
- Must allow local trust-model workflows where tool execution is client-side.
- Must handle long agentic sessions with raised tool-loop thresholds when configured.

### 16.4 Cline / Kilo / Continue-like Clients
- Must implement client fingerprint detection (headers / user-agent heuristics).
- Must map canonical tool names + arguments to client-specific contracts where required.
- Unknown clients should default to standards-compliant OpenAI behavior.

## 17) User Journeys (End-to-End)
### Journey A: Claude CLI with Cloud Provider
1. User exports Anthropic base URL to local proxy.
2. User sends prompt with coding task and tools.
3. Proxy normalizes request, injects context/tools, routes provider.
4. Tool loop executes until completion.
5. Streamed answer returns; memory extracted asynchronously.

### Journey B: Cursor with Local Embeddings + Cloud Chat
1. User configures Cursor OpenAI endpoint to proxy.
2. Chat route goes to configured cloud provider.
3. Embeddings endpoint uses override provider (e.g., local Ollama).
4. `@Codebase` requests retrieve semantic context successfully.

### Journey C: Hybrid Routing with Local-First + Fallback
1. Simple request routes to local model.
2. Complex request or local failure routes to fallback provider.
3. Response includes routing metadata; metrics reflect selected path.

### Journey D: Headroom Optimization
1. Request crosses compression threshold.
2. Proxy invokes sidecar transforms (cache aligner/crusher/rolling window/CCR).
3. Compressed prompt sent to provider; optional retrieval tool exposed for compressed payload access.

## 18) Expanded Functional Requirements
### FR-13: Installation & Runtime Modes
- Must support local npm/global CLI installation, source checkout, and Docker deployment profiles.
- Must support direct process run and containerized orchestration.

### FR-14: Model Discovery and Mapping
- Must expose model listing endpoint for OpenAI-compatible clients.
- Must translate externally requested model IDs into provider-specific actual model/deployment identifiers.

### FR-15: Embeddings Quality/Provider Profiles
- Must support local embeddings endpoints (Ollama/llama.cpp) and cloud embeddings (OpenAI/OpenRouter).
- Must fail gracefully with explicit error when embeddings are unconfigured.

### FR-16: Config Hot Reload
- Must monitor environment source (e.g., `.env`) and apply safe runtime config updates.
- Must avoid destabilizing active requests while reloading configuration.

### FR-17: Worker Pool Offload
- Must support optional worker thread pool for expensive internal operations.
- Must surface worker stats and readiness state in metrics endpoints.

### FR-18: Rate Limiting and Budget Controls
- Must support configurable request rate limits and keying strategy.
- Must support budget middleware for key routes with configurable enforcement.

### FR-19: Load Shedding Policy
- Must reject requests with `503` and retry hints when thresholds are exceeded.
- Must include monitoring hooks for shed reason counts.

### FR-20: Sidecar Lifecycle Management
- Must support optional sidecar container startup/shutdown/restart integration.
- Must provide sidecar health/status/log endpoints (or equivalent operational control APIs).

### FR-21: MCP Discovery & Sandboxed Execution
- Must support MCP server discovery from workspace path, user path, and env-configured path.
- Must support dynamic MCP tool registration and optional sandbox execution mode.

### FR-22: Remote Endpoint Compatibility
- Must support provider/model endpoints on localhost, LAN IPs, hostnames, and remote domains.
- Must not hard-code localhost assumptions for local-provider connectors.

### FR-23: Auxiliary Compatibility Endpoints
- Must include compatibility/event stub endpoints required by integrated clients (e.g., event logging batch sink).
- Must accept and safely no-op non-critical telemetry ingestion requests from clients.

### FR-24: Provider and Session Diagnostics
- Must expose provider-level health diagnostics endpoints for operator visibility.
- Must expose session debug endpoint with safe access controls.

### FR-25: Provider Discovery and Runtime Config Surface
- Must expose provider list/details endpoints for operator and integration introspection.
- Must expose configuration introspection endpoint suitable for diagnostics without leaking secrets.

### FR-26: Agent Execution and Token Telemetry Endpoints
- Must expose agent execution listings/stats and transcript lookup diagnostics.
- Must expose session token-usage and aggregate token-statistics endpoints for observability workflows.

## 19) Explicit Constraints and Guardrails
- Workspace tool actions must be constrained to configured roots unless explicitly allowed.
- Web fetch/search must support host allowlists with optional broad-mode override.
- Git push may be disabled by policy; commit can be gated behind required test execution.
- Tool execution timeout and output truncation must protect service stability.

## 20) API Behavior Requirements (Granular)
### 20.1 Anthropic Endpoint
- Accept standard message blocks (`text`, `tool_use`, `tool_result`, image blocks where supported).
- Return Anthropic-compatible usage + stop reason semantics.
- For stream mode, preserve event sequence: start/block deltas/stop/message stop.

### 20.2 OpenAI Chat Endpoint
- Accept standard chat message roles and tool/function call structures.
- Return choices array with finish reasons and token usage fields.
- For stream mode, emit chunked deltas and terminal `[DONE]` marker.

### 20.2b OpenAI Responses Endpoint
- Accept OpenAI Responses API payloads and translate to canonical orchestration request model.
- Return OpenAI-compatible response envelope supporting assistant output and tool interactions.
- Preserve compatibility with Codex CLI response flow expectations.

### 20.3 Embeddings Endpoint
- Accept single or batched input strings.
- Return OpenAI-compatible embedding object list and usage object.

### 20.4 Error Contract
- Normalize provider/tool/internal failures into client-compatible JSON error shape.
- Avoid leaking secrets or sensitive internals in error responses.

### 20.5 OpenAI Compatibility Health
- Provide OpenAI-namespace health endpoint(s) used by IDE integrations for fast setup verification.

## 21) Observability & SRE Requirements
- Structured logs must include request correlation IDs, provider, status code, duration, and token stats.
- Metrics must include request volume, latency distributions, error counts, cache hit/miss, and optimization impact.
- Health endpoints must separate liveness vs readiness semantics.
- Readiness deep checks should include DB/provider/resource pressure/circuit states.

## 22) Security, Compliance, and Privacy Requirements
- Credential material must only be read from secure runtime env/config paths.
- Local-only operation must be possible with no cloud dependencies.
- Data-at-rest paths (sessions/memory/index) must be clearly configurable.
- Explicitly document data retention and deletion controls for memory/session stores.

## 23) Test & Verification Requirements
### 23.1 Required Automated Suites
- Protocol compatibility tests (Anthropic/OpenAI, stream + non-stream).
- Provider adapter tests (success, timeout, auth error, malformed responses).
- Tool loop and policy enforcement tests.
- Memory extraction/retrieval/ranking tests.
- Cache behavior tests (prompt and semantic).
- Reliability tests (circuit breaker, retries, load shedding, graceful shutdown).

### 23.2 Required Manual Scenarios
- Claude CLI smoke test from clean shell session.
- Cursor chat/edit + `@Codebase` scenario.
- Codex CLI with local and remote proxy targets.
- Docker profile startup and health endpoint validation.

## 24) Migration & Handoff Expectations
- Manifest consumers (other AI IDE agents) should be able to implement in phases from this PRD without inspecting original source.
- Each FR should map to one or more implementation tickets with acceptance tests.
- API compatibility and operational parity are prioritized above internal architecture mimicry.

## 25) Definition of Done (Strict)
- All critical FRs pass corresponding acceptance tests.
- Client compatibility validated for Claude CLI, Cursor, and Codex workflows.
- At least 3 providers validated (1 local + 2 cloud, including fallback path).
- Metrics + health + logs operational in both local and Docker deployments.
- Memory/caching/optimization features demonstrably active and configurable.

## 26) Parity Checkpoints (Must-Not-Miss)
- Anthropic and OpenAI stream protocol parity including terminal events.
- `@Codebase`/embeddings path works with local and cloud embedding providers.
- Lazy tool loader is enabled by default with safe eager fallback mode.
- MCP integration supports dynamic tool registration and sandbox toggle.
- Headroom-style compression operates in audit and optimize modes with fail-open behavior.
- Client-specific tool name/argument mapping layer remains independently packageable/reusable.
