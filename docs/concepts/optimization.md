# Token Optimization Pipeline

LLM API costs scale linearly with context window size. In heavily automated environments (like autonomous agents running in Cursor or Claude Code), token spend can quickly spiral out of control. Muxa implements a robust pipeline to combat this.

## 1. The Prompt Cache

The most basic, yet highly effective edge cache is the **Exact Match Prompt Cache**.

When an IDE or CLI tool submits a prompt identical to a recent submission, Muxa intercepts it and returns the cached response instantly, without touching the upstream provider.

**Why does this matter?** Modern IDE tooling frequently re-sends massive system payloads and large codebase contexts when a developer only typed a single new character.

```ini
# Enabling the Exact Match Cache
MUXA_PROMPT_CACHE_ENABLED=true
MUXA_PROMPT_CACHE_TTL_MS=120000 # 2 minutes
```

## 2. Semantic Edge Cache

When a prompt isn't an exact match, Muxa utilizes semantic similarity.

If configured, Muxa generates an embedding vector of the prompt. If the cosine similarity between the current prompt and a cached prompt exceeds the defined threshold, Muxa serves the cached response.

This is exceptionally powerful for repetitive tasks like:
- "Explain this function"
- "Write unit tests for this component"

```ini
MUXA_SEMANTIC_CACHE_ENABLED=true
MUXA_SEMANTIC_CACHE_THRESHOLD=0.90 # 90% Similarity Threshold
```

*Note: You must have an embeddings provider configured for this to function.*

## 3. Headroom Compression

When caches miss, Muxa enters the Headroom phase. Using local processing, Muxa analyzes the chat history within the payload. It identifies low-value turns (e.g., pleasantries, repetitive errors, or resolved debugging output) and dynamically compresses or evicts them.

This ensures the final payload sent upstream contains only the highest signal-to-noise ratio context, significantly reducing input tokens while preserving reasoning capability.

```ini
MUXA_HEADROOM_ENABLED=true
MUXA_HEADROOM_MODE=optimize
```

You can monitor exactly how many tokens were saved via compression and caching on the Muxa Dashboard or via the Prometheus metrics endpoint endpoint `/metrics/compression`.
