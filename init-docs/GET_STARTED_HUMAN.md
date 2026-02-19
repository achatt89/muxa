# Get Started (Human Operator Guide)

Version: 1.0  
Date: 2026-02-19
Audience: You (human operator). This guide is not a source-of-truth spec for Codex implementation logic.

## 1) What You Already Have
You now have a complete one-shot package in repo root:
- BRD_MANIFEST.md
- PRD_MANIFEST.md
- TECHNICAL_MANIFEST.json
- IMPLEMENTATION_BACKLOG_MANIFEST.md
- FR_TRACEABILITY_MATRIX.md
- PARITY_AUDIT_CHECKLIST.md
- ONE_SHOT_AGENT_PROMPT_PACK.md
- ONE_SHOT_AGENT_WORKFLOW.json
- FINAL_SIGNOFF_TEMPLATE.json
- AGENTS.md
- EXECUTION_LOG.md
- TEST_EVIDENCE.md
- PARITY_AUDIT_RESULT.md

## 2) Before You Launch Codex
1. Ensure the repo opens as workspace root.
2. Confirm Codex has file write permission in workspace.
3. Decide whether real provider credentials are available now:
   - If yes, put them in environment or .env.
   - If not, Codex should continue with mock/local/integration-safe paths and mark external blockers.
4. Optionally create an empty branch for coordinator run.

## 3) Launch Sequence (Human Steps)
1. Open AGENTS.md.
2. Copy the entire section titled: Codex Launch Prompt (Coordinator).
3. Paste it as the first prompt in Codex.
4. Do not provide additional constraints unless necessary; let coordinator spawn role agents as specified.

## 4) What You Should Expect During Run
Codex should automatically create/update:
- EXECUTION_LOG.md (timeline, assignments, blockers)
- TEST_EVIDENCE.md (all tests and outputs)
- PARITY_AUDIT_RESULT.md (PASS/FAIL/BLOCKED ledger)
- FINAL_SIGNOFF.json (final GO/NO-GO)

If Codex asks questions, they should only be about true external blockers (credentials/infrastructure).

## 5) Monitoring Checklist (Human)
Every so often, verify:
1. EXECUTION_LOG.md is moving through phases.
2. TEST_EVIDENCE.md has task-level test entries.
3. PARITY_AUDIT_RESULT.md is being populated from checklist.
4. No Critical checks remain silently untested.

## 6) Release Decision Rules (Human)
Accept GO only if all are true:
- All Critical parity checks are PASS.
- FR coverage has passing tests for every row.
- Claude/Cursor/Codex integrations pass.
- Fallback reliability is verified.
- Diagnostics/observability endpoints pass.

Reject and request rerun/remediation if any Critical item is FAIL or missing evidence.

## 7) Fast Troubleshooting (Human)
- If run stalls on one failure, verify remediation attempts are happening (max 3).
- If blocked by credentials, provide only required secrets and ask Codex to resume from current phase.
- If artifacts are not updated, ask coordinator to refresh runtime artifacts before proceeding.

## 8) Final Hand-Off Package You Should Receive
- Implemented codebase
- Updated runtime artifacts with evidence
- Completed parity audit
- FINAL_SIGNOFF.json with GO/NO-GO and rationale

## 9) Important Note
This file is operator guidance. Codex implementation behavior must still follow the source-of-truth manifests and AGENTS.md.

## 10) Local Tooling Quickstart
- Install dev dependencies once via `npm install` to enable lint/format/dev scripts.
- Use `npm run dev` (nodemon) for iterative testing; it reloads `bin/muxa.js` whenever files in `src/` or `bin/` change.
- Run `npm run lint`, `npm run format:check`, or the aggregate `npm run check` before handing off changes.
- Copy `.env.example` to `.env` (or export variables) to seed provider credentials, routing strategy, and policy toggles expected by the config validator.
