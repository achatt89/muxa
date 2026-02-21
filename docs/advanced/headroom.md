# Headroom Compression

Context window accumulation is the silent killer of IDE token spend. As a conversation elongates—especially one involving frequent tool usage or codebase ingestion—the JSON payload sent upstream grows massively.

The **Headroom Compressor** is an intelligent sidecar built into Muxa designed to intercept these massive chat histories and aggressively prune them *before* they hit the network.

## How it Works

When an IDE sends an SSE streaming request containing a massive chat history array, the Muxa Headroom Compressor analyzes the `messages` block.

It ranks older turns by relevance. Instead of truncating the history abruptly (which destroys reasoning chains) the compressor:
1. Summarizes blocky, repetitive tool output or stack traces.
2. Evicts polite conversational noise ("Great! Thanks!").
3. Consolidates multi-step planning loops into a single, dense instruction set.

### Operating Modes

The Headroom Compressor operates in two distinct modes via the `.env`:

```ini
# Enables the sidecar system
MUXA_HEADROOM_ENABLED=true

# Operation mode: 'audit' | 'optimize'
MUXA_HEADROOM_MODE=optimize
```

#### Audit Mode
In `audit` mode, Muxa analyzes the payload and calculates the potential savings, but forwards the raw, unadulterated payload to the provider. This is incredibly useful for calculating ROI on the proxy before enabling hard limits.

#### Optimize Mode
In `optimize` mode, Muxa mutates the payload on the fly, applying the compression techniques mentioned above. The upstream provider receives a smaller, more focused prompt, dramatically reducing billing. 

### Measuring Effectiveness

The exact volume of tokens evicted via compression is aggressively tracked. You can view the `bytes_saved` and `tokens_evicted` metrics on the built-in [Observability Dashboard](../operations/observability.md) or via the `/metrics/compression` endpoint.
