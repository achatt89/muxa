# Configuration (.env)

Muxa is configured entirely via environment variables, adhering strictly to 12-factor app principles. This allows for seamless deployment across local environments, Docker Swarm, Kubernetes, and bare-metal servers.

## Core Settings

The foundation of your Muxa deployment is determining how it routes and where it listens.

```ini
# The port Muxa will bind to
PORT=8081 

# The routing strategy: 'single' or 'hybrid'
MUXA_ROUTING_STRATEGY=hybrid

# The default provider used for requests
MUXA_PRIMARY_PROVIDER=openrouter

# The fallback provider (used in 'hybrid' mode or if the primary fails)
MUXA_FALLBACK_PROVIDER=anthropic

# Enable detailed request/response logging in terminal
MUXA_LOG_RESPONSES=false
```

## Environment Precedence

Muxa uses a strict priority system for configuration:

1. **Local `.env` File**: Values in your `.env` file (in the current working directory) take **absolute priority** and will override any existing system shell environment variables.
2. **System Environment**: Standard shell variables are used if not defined in `.env`.
3. **Defaults**: Hardcoded safe defaults are used as a final fallback.

## Provider API Keys

You only need to supply the API keys for the providers you intend to use. Muxa will securely manage these and append them to requests upstream.

```ini
OPENAI_API_KEY=sk-proj-xxx
OPENROUTER_API_KEY=sk-or-v1-xxx
ANTHROPIC_API_KEY=sk-ant-api03-xxx
```

## Optimization Settings

These variables control Muxa's aggressive caching and token reduction pipelines.

```ini
# Exact Match Cache
MUXA_PROMPT_CACHE_ENABLED=true
MUXA_PROMPT_CACHE_TTL_MS=120000

# Semantic Edge Cache (Requires Embeddings Provider)
MUXA_SEMANTIC_CACHE_ENABLED=true
MUXA_SEMANTIC_CACHE_THRESHOLD=0.90

# Long-term Memory Injection
MUXA_MEMORY_ENABLED=true
MUXA_MEMORY_TOPK=3

# Context Window Compression
MUXA_HEADROOM_ENABLED=true
MUXA_HEADROOM_MODE=optimize
```

### Next Steps
Once your `.env` is configured, you are ready to connect your clients. Review the clients section depending on your primary IDE.
