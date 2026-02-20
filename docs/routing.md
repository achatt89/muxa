---
layout: default
title: Hybrid Routing
nav_order: 6
---

# Hybrid Routing & Cost Optimization

Muxa can steer each request to different providers without requiring any IDE changes. Set `MUXA_ROUTING_STRATEGY=hybrid` and point local tools at `http://localhost:8081`. The proxy inspects every request, computes a **complexity score**, and decides whether to stay on the primary provider or pivot to the fallback.

## Configuration recap

```ini
MUXA_ROUTING_STRATEGY=hybrid      # or single
MUXA_PRIMARY_PROVIDER=openrouter  # cheap/fast model
MUXA_FALLBACK_PROVIDER=anthropic  # premium model
```

Hybrid mode requires both providers to be defined. The fallback must be a cloud provider (Ollama cannot be the fallback).

## How complexity is calculated

Two request builders feed into the router:

| Path | Score formula |
|------|---------------|
| `/v1/responses` (OpenAI wire API) | `score = round(promptLength / 400) + (requiresTools ? +2 : 0)` |
| `/v1/messages` (Anthropic wire API) | `score = messageCount + (toolUseCount * 2) + round(textLength / 500)` |

- `promptLength`/`textLength` is the total character count of assistant + user content.
- `requiresTools`/`toolUseCount` is detected by scanning `tool_use` / `function_call` blocks.

The router marks a request as “complex” when `score > 3` or when the request explicitly requires tools. Complex requests automatically route to the fallback provider. Simple requests stay on the primary provider.

## Example scenarios

| Scenario | Details | Computed score | Route |
|----------|---------|----------------|-------|
| Quick prompt | `messages=[{user: "hello"}]` | `round(5/400)=0` | Primary |
| Medium edit | 2 messages, ~800 chars total | `round(800/400)=2` | Primary |
| Tool execution | Assistant contains `tool_use` | `round(len/400)+2 ≥ 3` | Fallback |
| Large spec | 10 messages, ~2500 chars | `round(2500/400)=6` | Fallback |

## Observability

- Every response includes routing headers: `x-muxa-provider`, `x-muxa-route`, `x-muxa-routing-score`.
- `/routing/stats` shows the last 25 routing decisions.
- Structured logs include `route.provider` and `route.usedFallback`.

## Tuning strategies

The current thresholds are intentionally conservative (score > 3). To bias toward the fallback sooner, shorten prompts or add tool metadata so the score rises faster. To bias toward the primary, ensure requests stay under a few kilobytes and avoid unnecessary tool requests.

If you need a different policy, adjust `computeComplexityScore` in `src/routing/index.js` or wrap `executeWithRouting` with your own scoring logic—the proxy architecture keeps all changes server-side, so IDEs don't need new configuration.

## Checklist for reliable hybrid routing

1. Define both providers in `.env` and set `MUXA_ROUTING_STRATEGY=hybrid`.
2. Run `npm start` and verify `/routing/stats` shows entries for both providers.
3. Trigger a tool-heavy action (e.g., `cat README.md`) and confirm `x-muxa-route=fallback`.
4. Monitor costs with `/api/tokens/stats` and `/metrics` to ensure savings match expectations.
