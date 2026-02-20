# Muxa Context Manifest
Last updated: 2026-02-20

## Proxy Capabilities
- Serves Anthropic (`/v1/messages`) and OpenAI Responses (`/v1/responses`) with shared optimization: prompt cache, semantic cache, memory injection, headroom compression, hybrid routing.
- Logging toggle: `MUXA_LOG_RESPONSES=true` prints every HTTP request (global hook) plus `/v1/responses` SSE events.
- Dashboard under `/dashboard` with dedicated assets (`/dashboard/app.css`, `/dashboard/app.js`); manual refresh button replaces auto-refresh. Shows summary cards, routing samples, token usage, and raw metrics.
- `/v1/models` now returns realistic OpenAI IDs (aliases, fallbacks, defaults) so Copilot/IDEs accept the proxy.

## Client Overrides (quick commands)
- **Claude Code CLI**: `ANTHROPIC_BASE_URL=http://localhost:8081 ANTHROPIC_API_KEY=sk-muxa claude "Prompt"`
- **Codex CLI**: `codex -c model_provider='"muxa"' -c model='"gpt-5.2-codex"' -c 'model_providers.muxa={name="Muxa Proxy",base_url="http://localhost:8081/v1",wire_api="responses",api_key="sk-muxa"}'`
- **VS Code Copilot (inline)**: export `GITHUB_COPILOT_PROXY_URL=http://localhost:8081/v1`, `GITHUB_COPILOT_PROXY_KEY=dummy`, then launch VS Code from that shell so inline completions route through Muxa.
- **Cursor/Cline/Continue**: set custom OpenAI endpoint to `http://localhost:8081/v1` with key `sk-muxa`.

## Cost Optimization Notes
- Enable caches/headroom/memory via README table; see `docs/cost-optimization.md` for full playbook (setup env vars, timelines, hybrid routing behavior, observability endpoints, troubleshooting).
- Observability endpoints: `/metrics`, `/metrics/compression`, `/metrics/semantic-cache`, `/routing/stats`, `/api/tokens/stats`, `/headroom/status`.

## Recent Changes (for continuity)
1. `/v1/models` now lists real models + aliases; tests updated (`test/api/openai-models.test.js`).
2. JSON body reader hardened (handles undefined/ArrayBuffer) to fix Claude errors.
3. Global request logging hook in `src/server.js`.
4. Dashboard modularization (`src/dashboard/` assets + template) and manual refresh.
5. README + new `docs/cost-optimization.md` describe optimization/multi-model strategy; disclaimer added re: workload-dependent savings.

## Testing
- Run `npm test` (all suites pass) after server/doc updates.

## Outstanding Work
- None tracked; proxy, docs, and dashboard reflect current features. Add new tasks here if future work arises.
