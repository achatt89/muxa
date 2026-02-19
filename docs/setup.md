# Setup

## npm
```
npm install
cp .env.example .env
npm start
```

## Docker
```
docker run --rm -p 8081:8081 \
  -e OPENAI_API_KEY=sk-your-key \
  -e MUXA_PRIMARY_PROVIDER=openai muxa:latest
```

## Homebrew
```
brew tap muxa/cli https://github.com/achatt89/muxa.git
brew install muxa
```

## Configuration Cheatsheet
| Variable | Description |
|----------|-------------|
| `MUXA_PRIMARY_PROVIDER` | Primary provider ID (openai, openrouter, ollama, etc.). |
| `MUXA_FALLBACK_PROVIDER` | Optional fallback provider. Requires `MUXA_ROUTING_STRATEGY=hybrid`. |
| `OPENROUTER_API_KEY` | API key for OpenRouter adapter. |
| `OLLAMA_BASE_URL` | URL of your Ollama server (local or remote). |
| `MUXA_HEADROOM_ENABLED` | Enable headroom sidecar/compression. |
| `MUXA_PROMPT_CACHE_ENABLED` | Enable exact prompt cache. |
| `MUXA_SEMANTIC_CACHE_ENABLED` | Enable semantic cache (requires embeddings). |
| `MUXA_MEMORY_ENABLED` | Enable long-term memory extraction/injection. |
