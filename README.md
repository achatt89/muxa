# Muxa — Universal LLM Proxy

Muxa is a self-hosted proxy that presents Anthropic- and OpenAI-compatible APIs so IDE/CLI tooling (Claude Code, Cursor, Codex, Continue, Copilot, etc.) can run against *your* choice of provider—cloud or local—without touching client settings.

## Why Muxa?
- **One URL for many providers** – Point every client at `http://localhost:8081`, then change providers (OpenRouter, Azure, Databricks, Ollama, etc.) centrally via `.env`.
- **Auto routing & fallback** – Send simple prompts to a local Ollama model, heavy workloads to a cloud model, and fall back automatically when a provider fails.
- **Token optimization** – Prompt cache, semantic cache, memory injection, and headroom compression operate server-side so *all* clients enjoy reduced latency/cost.
- **Observability + policy controls** – Built-in load shedding, circuit breaker, structured logs, and Prometheus endpoints give production visibility; policy guards enforce workspace/host/git/test rules.
- **Advanced providers** – Some tools only speak OpenAI/Anthropic; Muxa converts that traffic to providers they don’t natively support (OpenRouter, Ollama, MLX).
- **Easy rollouts** – Update `.env` once; every IDE routed through Muxa immediately uses the new provider/policy set.

---

## Quick Start

### npm
```bash
git clone https://github.com/your-org/muxa.git
cd muxa
npm install
cp .env.example .env  # fill in OPENAI_API_KEY, OPENROUTER_API_KEY, etc.
npm start             # proxy listens on http://localhost:8081
```

### Docker
```bash
docker build -t muxa .
docker run --rm -p 8081:8081 \
  -e OPENAI_API_KEY=sk-your-key \
  -e MUXA_PRIMARY_PROVIDER=openai \
  muxa:latest
```

### Homebrew (macOS)
```bash
brew tap muxa/cli https://github.com/your-org/muxa.git
brew install muxa
muxa --help
```

## Multi-Provider + Fallback Example
Edit `.env` (or Docker env vars) to mix providers:
```ini
MUXA_PRIMARY_PROVIDER=openrouter
MUXA_FALLBACK_PROVIDER=anthropic
MUXA_ROUTING_STRATEGY=hybrid
OPENROUTER_API_KEY=sk-or-...
ANTHROPIC_API_KEY=sk-ant-...
```
- Requests with high complexity/tool use automatically route to the fallback provider.
- Add local providers: set `MUXA_PRIMARY_PROVIDER=ollama` and `OLLAMA_BASE_URL=http://gpu-server:11434`.

## Token Optimization & Memory
Enable caches and memory to cut token usage:
```ini
MUXA_PROMPT_CACHE_ENABLED=true
MUXA_PROMPT_CACHE_TTL_MS=120000
MUXA_SEMANTIC_CACHE_ENABLED=true
MUXA_SEMANTIC_CACHE_THRESHOLD=0.9
MUXA_MEMORY_ENABLED=true
MUXA_MEMORY_TOPK=3
MUXA_HEADROOM_ENABLED=true
MUXA_HEADROOM_MODE=optimize
```
- Prompt cache instantly returns repeated prompts.
- Semantic cache reuses answers for similar prompts (requires embeddings provider—see [docs/embeddings.md](docs/embeddings.md)).
- Memory store injects top-K memories into each request.
- Headroom exposes `/metrics/compression` and `/headroom/*` to track savings.

Variable descriptions:

| Variable | Purpose |
|----------|---------|
| `MUXA_PROMPT_CACHE_ENABLED` | Enable exact match cache; repeated prompts return instantly. |
| `MUXA_PROMPT_CACHE_TTL_MS` | Time-to-live (milliseconds) for prompt cache entries. |
| `MUXA_SEMANTIC_CACHE_ENABLED` | Enable semantic (embeddings-based) cache. Set to `true` once embeddings are configured. |
| `MUXA_SEMANTIC_CACHE_THRESHOLD` | Cosine similarity threshold (0-1) for semantic cache hits. |
| `MUXA_MEMORY_ENABLED` | Enable long-term memory extraction/storage. |
| `MUXA_MEMORY_TOPK` | Number of memories injected into each request when relevant. |
| `MUXA_HEADROOM_ENABLED` | Enable headroom sidecar/compression pipeline. |
| `MUXA_HEADROOM_MODE` | `audit` (record metrics only) or `optimize` (mutate/compress history). |

## Client Overrides (Cursor, Claude, Codex, Copilot)

1. **Start Muxa** (npm or Docker as shown above).
2. **Point clients at Muxa:**

| Client | Configuration |
|--------|---------------|
| Claude Code CLI | `export ANTHROPIC_BASE_URL=http://localhost:8081`, `export ANTHROPIC_API_KEY=dummy`, run `claude "Prompt"`. |
| Cursor IDE | Settings → **Features → Models** → Base URL `http://localhost:8081/v1`, API key `sk-muxa`, select the model configured in `.env`. For `@Codebase`, enable embeddings [docs/embeddings.md](docs/embeddings.md). |
| OpenAI Codex CLI | `export OPENAI_BASE_URL=http://localhost:8081/v1`, `export OPENAI_API_KEY=dummy`, run `codex` (or add a `model_providers.muxa` entry in `~/.codex/config.toml`). |
| GitHub Copilot | `export GITHUB_COPILOT_PROXY_URL=http://localhost:8081/v1`, `export GITHUB_COPILOT_PROXY_KEY=dummy`, restart the editor (Works for VS Code / JetBrains). |
| Cline / Continue / ClawdBot / other OpenAI-compatible tools | Set their custom OpenAI endpoint to `http://localhost:8081/v1` with API key `sk-muxa` and use your desired model name. |

## Observability & Diagnostics
- `/dashboard` – lightweight HTML dashboard showing health, metrics, routing, compression, and headroom status (auto-refreshing)
- `/health`, `/health/live`, `/health/ready` – readiness probes
- `/routing/stats`, `/debug/session`, `/v1/agents/*` – routing + agent diagnostics
- `/metrics`, `/metrics/prometheus`, `/metrics/compression`, `/metrics/semantic-cache` – Prometheus-ready metrics, headroom/semantic cache stats
- `/health/headroom`, `/headroom/status`, `/headroom/restart`, `/headroom/logs` – headroom lifecycle

## Embeddings & @Codebase Support
See [docs/embeddings.md](docs/embeddings.md) for Ollama, llama.cpp, OpenRouter, and OpenAI embeddings configuration. Example (Ollama):
```bash
ollama pull nomic-embed-text
export MUXA_SEMANTIC_CACHE_ENABLED=true
export OLLAMA_BASE_URL=http://localhost:11434
export OLLAMA_EMBEDDINGS_MODEL=nomic-embed-text
npm start
```

## Testing
```bash
npm test                    # 90+ suites covering API/provider/integration/perf
node scripts/endpoint-parity-preflight.js
```

## Docker Compose Example
See `docker-compose.example.yml` for a sample proxy + Ollama stack.

## Additional Documentation
Detailed GitBook-style docs live under `docs/`:
- [docs/README.md](docs/README.md) — table of contents
- [docs/setup.md](docs/setup.md) — installation/config cheat sheet
- [docs/providers.md](docs/providers.md) — provider-specific notes
- [docs/observability.md](docs/observability.md) — endpoints + dashboard
- [docs/embeddings.md](docs/embeddings.md) — embeddings/@Codebase setup
