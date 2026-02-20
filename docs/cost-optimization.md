<!-- docs/cost-optimization.md -->

# Cost Optimization & Multi-Model Playbook

Muxa’s proxy layer sits between IDE clients and upstream providers, which means every request flows through the same optimization pipeline. This document explains how the pieces interact, how to enable them, and what to expect as you accumulate traffic.

## Optimization Stack

| Layer | What it does | When it helps |
|-------|--------------|---------------|
| Prompt Cache (`MUXA_PROMPT_CACHE_*`) | Exact request → response reuse; 0ms turnaround | Repeated Codex/Continue prompts, regressions, CI bots |
| Semantic Cache (`MUXA_SEMANTIC_CACHE_*` + embeddings provider) | Vector similarity reuse with tolerance | Follow-up prompts that paraphrase previous asks |
| Memory Store (`MUXA_MEMORY_*`) | Extracts reusable snippets & appends as system context | Long-lived sessions, collaboration between IDEs |
| Headroom Compression (`MUXA_HEADROOM_*`) | Compresses chat history, removes redundancy | Large conversations, “o1-style” debugging sessions |
| Hybrid Routing (`MUXA_ROUTING_STRATEGY=hybrid`) | Routes complex prompts/tool calls to fallback provider | Expensive requests, vendor-specific tools |

### How Requests Flow
1. **Ingress** – `/v1/messages` (Anthropic) or `/v1/responses` (OpenAI) lands on the proxy.
2. **Cache checks** – Prompt cache first, then semantic cache (if configured). Cache hits short-circuit the request.
3. **Memory injection** – When enabled, the memory store injects top-K snippets before routing.
4. **Routing & Provider Execution** – `executeWithRouting` scores complexity and selects the configured provider (single or hybrid).
5. **Headroom Compression** – For long conversations, the compression engine rewrites the prompt before calling upstream.
6. **Persistence & Metrics** – Token usage is recorded for `/api/tokens/*` endpoints and `/metrics`.

## Enabling the Features

```bash
# Common toggles (usually added to .env)
export MUXA_PROMPT_CACHE_ENABLED=true
export MUXA_PROMPT_CACHE_TTL_MS=120000

export MUXA_SEMANTIC_CACHE_ENABLED=true
export MUXA_SEMANTIC_CACHE_THRESHOLD=0.9
export OLLAMA_BASE_URL=http://localhost:11434        # or OPENAI/OPENROUTER embeddings
export OLLAMA_EMBEDDINGS_MODEL=nomic-embed-text

export MUXA_MEMORY_ENABLED=true
export MUXA_MEMORY_TOPK=3

export MUXA_HEADROOM_ENABLED=true
export MUXA_HEADROOM_MODE=optimize                  # audit | optimize

export MUXA_ROUTING_STRATEGY=hybrid                 # single | hybrid
export MUXA_FALLBACK_PROVIDER=openai                # e.g., openai, openrouter
```

Restart `npm start` (or Docker) after updating the environment. Headroom starts a sidecar automatically; if it crashes, `POST /headroom/restart` revives it.

## When You’ll See Results

| Feature | Time-to-value | Notes |
|---------|---------------|-------|
| Prompt Cache | Immediate after a second identical prompt | Ideal for “run tests”, “summarize file” loops |
| Semantic Cache | After ~10 prompts (enough vectors to compare) | Requires embeddings provider; watch `/metrics/semantic-cache` |
| Memory Store | After at least one answer deemed “surprising” (by length/threshold) | Use `/api/tokens/stats` to confirm extra context is added |
| Headroom Compression | Visible once conversations exceed ~1,500 tokens | `/metrics/compression` reports saved tokens/dollars |
| Hybrid Routing | As soon as `complexityScore` crosses thresholds | `/routing/stats` lists the last 25 decisions |

> Actual savings depend entirely on workload, prompt mix, and provider pricing. Use `/metrics` + upstream billing to validate improvements in your own environment.

Typical pattern:
1. **Day 0** – Prompt cache and hybrid routing reduce spike costs immediately.
2. **Day 1–2** – Semantic cache kicks in as embeddings accumulate; memory store injects helpful reminders.
3. **Week 1** – Compression/Headroom reports measurable reductions (10–40% of prompt tokens in long sessions).

## Multi-Model & Provider Strategy

- **Single routing (`MUXA_ROUTING_STRATEGY=single`)** – All traffic goes to `MUXA_PRIMARY_PROVIDER`. Use when latency & deterministic behavior matter most.
- **Hybrid routing** – Requests are scored by prompt length + tool usage:
  - `complexityScore <= 5` → primary provider (often cheaper/faster)
  - `complexityScore > 5` or tool-heavy payloads → fallback provider
- **Fallback semantics** – If the primary provider errors, the fallback is used regardless of strategy.
- **Model aliases & fallbacks** – `OPENAI_MODEL_ALIASES` and `OPENAI_MODEL_FALLBACKS` let you map IDE-only names (e.g., `gpt-5.3-codex`) to real upstream SKUs without editing client configs.

### Example Layout

```env
MUXA_PRIMARY_PROVIDER=openrouter
OPENROUTER_API_KEY=sk-...
OPENROUTER_MODEL=gpt-4o-mini

MUXA_FALLBACK_PROVIDER=openai
OPENAI_API_KEY=sk-live...
OPENAI_MODEL=gpt-4o-mini
OPENAI_MODEL_FALLBACKS=gpt-4o-mini-2024-07-18,gpt-5.2
```

Cursor or Codex can request `gpt-5.3-codex`; the alias map in `src/config/index.js` transparently reroutes it to the configured provider + fallback chain.

## Observability & Verification

- `/dashboard` – Summaries, routing log, token ratios, and manual refresh button.
- `/metrics/compression` – Headroom stats: `totalSavings`, `compressedRequests`.
- `/metrics/semantic-cache` – Hit/miss counts (0 until embeddings configured).
- `/api/tokens/stats` – Aggregate input/output tokens for ROI calculations.
- `/routing/stats` – Last 25 routing decisions, providers involved, latency.
- `/metrics/prometheus` – Scrape-friendly totals for dashboards/alerts.

Recommended workflow:
1. Enable logging with `MUXA_LOG_RESPONSES=true` when onboarding a new client (Codex, Continue, Claude Code) to ensure requests hit the proxy.
2. Drive a realistic workload for a day.
3. Capture snapshots of `/metrics`, `/metrics/compression`, `/metrics/semantic-cache`, and `/routing/stats`.
4. Compare against baseline provider invoices to quantify token savings.

## Best Practices

1. **Warm caches intentionally** – Seed semantic/prompt caches by replaying regression suites or “common tasks” via Codex CLI.
2. **Name sessions** – Supply `session_id`/`user` fields when possible so memory + token stats attribute usage cleanly.
3. **Monitor fallback cost** – If fallback traffic stays high, tune `MUXA_ROUTING_STRATEGY` thresholds or adjust providers.
4. **Disable noisy logs in production** – Use `MUXA_LOG_RESPONSES` only for debugging; rely on `/metrics` for steady-state observability.
5. **Document provider contracts** – When multiple teams share the proxy, agree on which IDEs use which models to avoid surprise bills.

## Troubleshooting

- **Cache miss rate remains 100%** – Verify `MUXA_PROMPT_CACHE_ENABLED=true` and clients aren’t randomizing prompts (some IDEs append timestamps).
- **Semantic cache never initializes** – Ensure embeddings provider env vars are set; check `/metrics/semantic-cache` for `configured: false`.
- **Compression savings = 0** – Headroom sidecar may be disabled; hit `/headroom/status` and restart via `POST /headroom/restart`.
- **Fallback provider never used** – Hybrid routing only triggers when the score crosses thresholds; confirm `MUXA_ROUTING_STRATEGY=hybrid`.

With the optimization stack enabled and observed, Muxa becomes a centralized “brain” for IDE assistants: switch providers once, gain savings everywhere, and monitor costs in one place.
