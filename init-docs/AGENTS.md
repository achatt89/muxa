# AGENTS.md

Version: 1.1  
Date: 2026-02-19

## Objective
Run multi-agent, one-shot implementation in Codex with strict parity to the manifests and no human intervention unless blocked by external dependencies (credentials, infrastructure).

## Source of Truth (Read First)
1. [BRD_MANIFEST.md](BRD_MANIFEST.md)
2. [PRD_MANIFEST.md](PRD_MANIFEST.md)
3. [TECHNICAL_MANIFEST.json](TECHNICAL_MANIFEST.json)
4. [IMPLEMENTATION_BACKLOG_MANIFEST.md](IMPLEMENTATION_BACKLOG_MANIFEST.md)
5. [FR_TRACEABILITY_MATRIX.md](FR_TRACEABILITY_MATRIX.md)
6. [PARITY_AUDIT_CHECKLIST.md](PARITY_AUDIT_CHECKLIST.md)
7. [CANONICAL_ENDPOINTS_MANIFEST.md](CANONICAL_ENDPOINTS_MANIFEST.md)
8. [ONE_SHOT_AGENT_PROMPT_PACK.md](ONE_SHOT_AGENT_PROMPT_PACK.md)
9. [ONE_SHOT_AGENT_WORKFLOW.json](ONE_SHOT_AGENT_WORKFLOW.json)
10. [FINAL_SIGNOFF_TEMPLATE.json](FINAL_SIGNOFF_TEMPLATE.json)

---

## Agent Topology
Use 1 coordinator + 6 implementation agents + 1 QA gate agent.

### A0 — Coordinator (single owner)
- Owns planning, sequencing, conflict resolution, and release decision.
- Enforces phase order from [ONE_SHOT_AGENT_WORKFLOW.json](ONE_SHOT_AGENT_WORKFLOW.json).
- Merges only after acceptance tests pass for each completed task.

### A1 — API & Protocol Agent
- Owns Anthropic/OpenAI compatibility surface.
- Scope: Epic 2 + diagnostics endpoints (E2-T4).

### A2 — Provider & Routing Agent
- Owns adapters, model mapping, hybrid routing, fallback.
- Scope: Epic 3.

### A3 — Orchestrator & Tooling Agent
- Owns loop execution, tool registry/lazy loading, client mapping layer, policy controls.
- Scope: Epic 4 + Epic 5.

### A4 — Memory/Cache/Optimization Agent
- Owns memory system, prompt/semantic cache, embeddings override, token optimization path.
- Scope: Epic 6 + compression integration support from Epic 8.

### A5 — Reliability/Observability/Platform Agent
- Owns middleware hardening, retry/circuit/load-shedding, health/metrics/diagnostics, worker pool/hot reload/MCP config wiring.
- Scope: Epic 7 + platform integration concerns.

### A6 — Headroom Sidecar Agent
- Owns sidecar lifecycle, audit/optimize behavior, CCR path, headroom ops endpoints.
- Scope: Epic 8.

### A7 — QA/Parity Gate Agent
- Owns traceability checks, parity checklist execution, evidence packaging, and signoff report.
- Scope: Epic 9 + final release gate.

---

## Work Partition Rules (Critical)
1. Each agent edits only files in its assigned scope.
2. Shared files (`router`, `config`, `orchestrator`) require Coordinator lock before merge.
3. No agent marks task done without test evidence in `TEST_EVIDENCE.md`.
4. No epic closes without passing all listed acceptance criteria in backlog.
5. Any failing critical parity check is release-blocking.

---

## Branch/Session Strategy
If Codex supports sub-agents/parallel sessions, run one session per agent role above.

Recommended branch naming:
- `agent/a1-api-protocol`
- `agent/a2-provider-routing`
- `agent/a3-orchestrator-tooling`
- `agent/a4-memory-cache-opt`
- `agent/a5-reliability-observability`
- `agent/a6-headroom`
- `agent/a7-qa-parity`

Coordinator branch:
- `agent/a0-coordinator`

---

## Required Runtime Artifacts
Must exist and be continuously updated during execution:
- `EXECUTION_LOG.md`
- `TEST_EVIDENCE.md`
- `PARITY_AUDIT_RESULT.md`
- `FINAL_SIGNOFF.json`

Use [FINAL_SIGNOFF_TEMPLATE.json](FINAL_SIGNOFF_TEMPLATE.json) as seed.

---

## Merge Contract
Before any merge into coordinator branch, agent must provide:
1. Completed task IDs (from backlog).
2. Test list executed.
3. Test output summary and failing tests (if any).
4. Files changed.
5. Risk notes + rollback plan.

Coordinator merges only if:
- task acceptance tests pass,
- no critical regressions are introduced,
- traceability row remains satisfied.

---

## Blocker Policy
If blocked by external dependency:
1. Log blocker in `EXECUTION_LOG.md`.
2. Mark related parity item in `PARITY_AUDIT_RESULT.md` as `BLOCKED`.
3. Continue with independent tasks.
4. Re-attempt blocked scope at end of phase.

If blocked by code/test failure:
- auto-remediate up to 3 cycles, then escalate to coordinator as internal blocker.

---

## Codex Launch Prompt (Coordinator)
Copy-paste the full block below into Codex as the initial coordinator prompt.

---
You are the Coordinator Agent (A0) for one-shot autonomous implementation.

Mission:
Implement this project end-to-end with full parity to manifests (MVP + non-MVP), without human intervention unless blocked by external credentials/infrastructure.

Read these files first and treat them as binding contracts:
- BRD_MANIFEST.md
- PRD_MANIFEST.md
- TECHNICAL_MANIFEST.json
- IMPLEMENTATION_BACKLOG_MANIFEST.md
- FR_TRACEABILITY_MATRIX.md
- PARITY_AUDIT_CHECKLIST.md
- CANONICAL_ENDPOINTS_MANIFEST.md
- ONE_SHOT_AGENT_PROMPT_PACK.md
- ONE_SHOT_AGENT_WORKFLOW.json
- AGENTS.md

Execution requirements:
1) Create/maintain runtime artifacts:
- EXECUTION_LOG.md
- TEST_EVIDENCE.md
- PARITY_AUDIT_RESULT.md
- FINAL_SIGNOFF.json (from FINAL_SIGNOFF_TEMPLATE.json)

2) Run multi-agent partitioning exactly as AGENTS.md:
- A1 API/Protocol
- A2 Provider/Routing
- A3 Orchestrator/Tooling
- A4 Memory/Cache/Optimization
- A5 Reliability/Observability/Platform
- A6 Headroom
- A7 QA/Parity

3) Enforce strict sequencing from ONE_SHOT_AGENT_WORKFLOW.json while allowing parallel execution inside a phase when safe.

4) For every task in IMPLEMENTATION_BACKLOG_MANIFEST.md:
- implement,
- run acceptance tests,
- record evidence,
- map completion to FR_TRACEABILITY_MATRIX.md.

5) Hard gates:
- Any failing Critical item in PARITY_AUDIT_CHECKLIST.md => NO-GO.
- Any FR without passing tests => NO-GO.
- Streaming protocol mismatch => NO-GO.
- Fallback reliability unverified => NO-GO.

6) Self-healing policy:
- Up to 3 automated remediation attempts per failure,
- then mark BLOCKED with precise evidence and continue independent tasks.

7) Completion output must include:
- GO/NO-GO
- critical pass ratio
- blockers
- evidence file pointers

Start now by producing:
A) phase plan with explicit agent/task assignment,
B) first implementation wave,
C) immediate test execution.
---

## Agent Prompt Templates (Per Role)
Use these as role-specific prompts after coordinator initializes.

### Template — A1 API/Protocol
- Implement Epic 2 and E2-T4 only.
- Preserve strict Anthropic/OpenAI streaming semantics.
- Add/execute tests listed in backlog for this scope.
- Do not edit unrelated provider/tool internals except for compilation fixes.

### Template — A2 Provider/Routing
- Implement Epic 3 only.
- Validate fallback and routing diagnostics headers.
- Ensure remote endpoint support and provider normalization.

### Template — A3 Orchestrator/Tooling
- Implement Epic 4 and Epic 5 only.
- Build client mapping as reusable layer boundary.
- Enforce policy controls and loop limits.

### Template — A4 Memory/Cache/Optimization
- Implement Epic 6 and optimization concerns.
- Verify memory extraction/retrieval ranking, cache behavior, embeddings override.

### Template — A5 Reliability/Observability/Platform
- Implement Epic 7 and shared config/middleware hardening.
- Ensure diagnostics and observability endpoints satisfy contracts.

### Template — A6 Headroom
- Implement Epic 8 only.
- Ensure fail-open sidecar behavior and CCR path.

### Template — A7 QA/Parity
- Implement Epic 9 + full parity gate run.
- Execute PARITY_AUDIT_CHECKLIST.md and generate FINAL_SIGNOFF.json.

---

## Final GO/NO-GO Rule
Only mark `GO` when all are true:
- all Critical parity checks PASS,
- all FR rows have passing tests,
- integration matrix PASS for Claude/Cursor/Codex,
- fallback resilience PASS,
- diagnostics/observability PASS.
