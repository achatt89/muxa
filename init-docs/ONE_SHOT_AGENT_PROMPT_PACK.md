# One-Shot Agentic Development Prompt Pack

Version: 1.1  
Date: 2026-02-19  
Goal: Fully autonomous implementation of the target project from manifests, with no human intervention unless a hard blocker is unavoidable.

## 1) Master Prompt (Paste into the implementation AI IDE)
You are executing a one-shot autonomous build. Implement the project end-to-end using these artifacts as source of truth:
- BRD_MANIFEST.md
- PRD_MANIFEST.md
- TECHNICAL_MANIFEST.json
- IMPLEMENTATION_BACKLOG_MANIFEST.md
- FR_TRACEABILITY_MATRIX.md
- PARITY_AUDIT_CHECKLIST.md
- CANONICAL_ENDPOINTS_MANIFEST.md

Non-negotiable constraints:
1. Do not ask the user questions unless hard-blocked by missing credentials/infrastructure.
2. Execute epics in order and satisfy all acceptance tests for each task before moving on.
3. Keep a deterministic execution log and update status artifacts continuously.
4. Do not skip non-MVP capabilities; implement MVP + non-MVP parity defined in manifests.
5. Never copy source code from this reference project; re-implement behavior independently.
6. Treat any failing Critical parity check as release-blocking.

Required behavior:
- Create and maintain these runtime artifacts during execution:
  - EXECUTION_LOG.md
  - TEST_EVIDENCE.md
  - PARITY_AUDIT_RESULT.md
  - FINAL_SIGNOFF.json
- If a step fails:
  - attempt automated remediation up to 3 cycles,
  - rerun tests,
  - if still failing, continue with other independent tasks,
  - emit a precise blocker entry in EXECUTION_LOG.md and PARITY_AUDIT_RESULT.md.
- Continue until all feasible tasks are completed and all Critical checks are either PASS or explicitly blocked by external dependency.

Success criteria:
- All FR rows in FR_TRACEABILITY_MATRIX.md are backed by implemented behavior and passing tests.
- All Critical items in PARITY_AUDIT_CHECKLIST.md are PASS.
- FINAL_SIGNOFF.json reports GO only when no Critical item fails.

## 2) Deterministic Execution Order
1. Parse manifests and build internal task graph from IMPLEMENTATION_BACKLOG_MANIFEST.md.
2. Implement Epic 1..9 in sequence.
3. After each task:
   - run listed tests,
   - capture output in TEST_EVIDENCE.md,
   - update EXECUTION_LOG.md status.
4. After each epic:
   - run relevant integration/regression tests,
   - execute parity checks for affected components.
5. Run full parity audit using PARITY_AUDIT_CHECKLIST.md.
6. Generate FINAL_SIGNOFF.json.

## 3) Hard Gates
Release is NO-GO if any of these are true:
- Any Critical checklist item is FAIL.
- Any FR in FR_TRACEABILITY_MATRIX.md has no passing automated test evidence.
- API protocol compatibility tests fail for Anthropic/OpenAI stream semantics.
- Fallback reliability path is unverified.
- Diagnostics and observability endpoints are missing or failing contract checks.

## 4) Self-Healing Policy
For each failed test gate:
1. Diagnose root cause from logs/test output.
2. Apply smallest safe fix.
3. Re-run the narrow failing test.
4. Re-run epic-level suite.
5. Stop after 3 unsuccessful repair loops and mark as BLOCKED with evidence.

## 5) Output Contract
By completion, produce:
- Executable implementation.
- Passing test evidence aligned to backlog acceptance criteria.
- Parity audit report with PASS/FAIL per checklist row.
- Final decision file FINAL_SIGNOFF.json.

## 6) Final Completion Statement (agent output)
Return:
- Overall status: GO / NO-GO
- Critical pass summary: X/Y
- Remaining blockers (if any)
- Pointers to evidence files generated.
