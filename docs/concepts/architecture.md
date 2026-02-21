# Architecture Overview

Muxa's architecture is designed for extreme low-latency and high-throughput, acting as a transparent layer 7 reverse HTTP proxy specifically tuned for LLM JSON payloads and Server-Sent Events (SSE) streaming.

## High-Level Topology

```text
      [ Clients ]
Cursor   Claude Code   Copilot
   \          |          /
    \         |         /
     v        v        v
+-------------------------------+
|           Muxa Proxy          |
|                               |
|     [API Gateway & Auth]      |
|               |               |
|               v               |
|         [Cache Layer] --(Hit)-----> [ Return Response ]
|               |               |
|             (Miss)            |
|               v               |
|     [Headroom Compressor]     |
|               |               |
|               v               |
|        {Hybrid Router}        |
|               |               |
|               v               |
|    [(Memory Vector Store)]    |
+-------------------------------+
      /       |        |        \
     /        |        |         \
    v         v        v          v
[OpenAI] [Anthropic] [OpenRouter] [Local]
```

## Component Breakdown

### 1. The Gateway
The entry point normalizes incoming requests into a standard internal representation, stripping client-specific anomalies and validating API keys.

### 2. The Cache Layer
Evaluates the request against the Exact Match Prompt Cache. If a miss, it generates an embedding (if configured) and checks the Semantic Cache for a near-match response.

### 3. Headroom Compressor
If `MUXA_HEADROOM_MODE=optimize` is set, the payload's chat history is analyzed. Older, lower-relevance turns are summarized or evicted entirely, reducing the payload size before it hits the network.

### 4. Hybrid Router
Evaluates the complexity of the prompt. Short tasks (like autocomplete) might be shunted to a faster `MUXA_PRIMARY_PROVIDER` (e.g., a local model), while deep architectural questions with large contexts are routed to the `MUXA_FALLBACK_PROVIDER` (e.g., Claude 3.5 Sonnet).

### 5. Memory Vector Store
If memory is enabled, semantic search retrieves the top-K relevant architectural notes or memories and injects them seamlessly into the system prompt.
