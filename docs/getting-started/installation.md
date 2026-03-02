---
layout: default
title: Setup
nav_order: 2
---

# Setup

## npm (Recommended)

Install globally from the npm registry:

```bash
npm install -g @thelogicatelier/muxa
```

Then create a `.env` file in your working directory with at least one provider key:

```bash
# Required: set your primary provider
MUXA_PRIMARY_PROVIDER=openai

# Provide the API key for your chosen provider
OPENAI_API_KEY=sk-your-key
# Or use another provider:
# ANTHROPIC_API_KEY=sk-ant-your-key
# OPENROUTER_API_KEY=sk-or-your-key
# OLLAMA_BASE_URL=http://localhost:11434
```

Start the proxy:

```bash
muxa                  # proxy listens on http://localhost:8081
```

Or run instantly without installing:

```bash
npx @thelogicatelier/muxa
```

## From Source

```bash
git clone https://github.com/achatt89/muxa.git
cd muxa
npm install
cp .env.example .env  # fill in OPENAI_API_KEY, OPENROUTER_API_KEY, etc.
npm start             # proxy listens on http://localhost:8081
```

## Docker

Pass your provider API key and primary provider as environment variables. The example below uses OpenAI, but you can substitute any supported provider (Anthropic, OpenRouter, Ollama, Databricks, Azure, etc.):

```bash
docker build -t muxa .
docker run --rm -p 8081:8081 \
  -e MUXA_PRIMARY_PROVIDER=openai \
  -e OPENAI_API_KEY=sk-your-key \
  muxa:latest
```

## Homebrew (macOS)

```bash
brew tap thelogicatelier/muxa https://github.com/achatt89/muxa.git
brew install muxa
muxa --help
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
| `MUXA_LOG_RESPONSES` | Enable detailed request/response logging in terminal. |
| `MUXA_MEMORY_ENABLED` | Enable long-term memory extraction/injection. |
