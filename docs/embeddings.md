# Embeddings & Semantic Cache

Muxa supports multiple embedding backends so clients like Cursor/Codex can run `@Codebase` searches through the proxy.

## Supported Backends

| Backend | Variables |
|---------|-----------|
| **Ollama** | `MUXA_SEMANTIC_CACHE_ENABLED=true`, `OLLAMA_BASE_URL=http://localhost:11434`, `OLLAMA_EMBEDDINGS_MODEL=nomic-embed-text` |
| **llama.cpp** | Point your llama.cpp server to expose an OpenAI-compatible embeddings endpoint and set `OPENAI_BASE_URL` / `OPENAI_API_KEY` appropriately. |
| **OpenRouter** | `MUXA_SEMANTIC_CACHE_ENABLED=true`, `OPENROUTER_API_KEY=...`, `OPENROUTER_BASE_URL=https://openrouter.ai/api/v1` |
| **OpenAI** | `MUXA_SEMANTIC_CACHE_ENABLED=true`, `OPENAI_API_KEY=...`, optionally override `OPENAI_BASE_URL` for proxies like MLX. |

## Quick Start (Ollama)
```bash
ollama pull nomic-embed-text
export MUXA_SEMANTIC_CACHE_ENABLED=true
export OLLAMA_BASE_URL=http://localhost:11434
export OLLAMA_EMBEDDINGS_MODEL=nomic-embed-text
npm start
```

## Tuning
- `MUXA_SEMANTIC_CACHE_THRESHOLD` — cosine similarity threshold (0..1). Default `0.85`.
- `MUXA_PROMPT_CACHE_TTL_MS` / `MUXA_PROMPT_CACHE_MAX` control the exact prompt cache.
- `MUXA_MEMORY_*` toggles affect how many memories are injected alongside embeddings.

When the semantic cache is enabled, `/metrics/semantic-cache` and `/metrics/compression` report hits/misses and savings.
