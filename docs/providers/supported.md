---
layout: default
title: Providers
nav_order: 3
---

# Providers

## OpenRouter
```
OPENROUTER_API_KEY=sk-or-...
MUXA_PRIMARY_PROVIDER=openrouter
```
Advanced: `OPENROUTER_BASE_URL` (default `https://openrouter.ai/api/v1`).

## Ollama
```
MUXA_PRIMARY_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
```
**Notes:**
- **Timeout**: Muxa enforces a 300s (5-minute) timeout for local models.
- **Compatibility**: Automatic message content flattening is applied to ensure local models receive clean text inputs.
Set `MUXA_FALLBACK_PROVIDER` to a cloud provider for hybrid routing.

## Anthropic / OpenAI
Use their standard keys via `ANTHROPIC_API_KEY` or `OPENAI_API_KEY`.

## Fallback Example
```
MUXA_ROUTING_STRATEGY=hybrid
MUXA_PRIMARY_PROVIDER=openrouter
MUXA_FALLBACK_PROVIDER=anthropic
```
Prompts exceeding complexity threshold automatically use fallback.
