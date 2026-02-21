# Overview

Welcome to the Muxa Developer Documentation.

Muxa is a highly performant, self-hosted proxy designed to act as a universal translation layer between modern IDE tooling (such as Cursor, Claude Code, Cline, and Copilot) and any LLM provider, whether cloud-based (Anthropic, OpenAI, OpenRouter) or local (Ollama, MLX).

## The Core Value Proposition

In enterprise environments, managing API keys, routing rules, and token usage across dozens of developers and various clients is an operational nightmare. Muxa solves this by centralizing these concerns into a single, highly observable proxy service.

Instead of configuring every developer's IDE with individual keys, you simply point all clients to `http://localhost:8081` (or your internal deployment URL) and configure Muxa to handle the rest.

### Key Benefits

1. **Centralized Protocol Translation**: Muxa natively understands Anthropic and OpenAI protocols and can translate them on the fly to providers that IDEs don't natively support.
2. **Dynamic Hybrid Routing**: Route simple completions to fast, cheap local models, while elevating complex, tool-heavy reasoning tasks to premium flagship models automatically.
3. **Aggressive Token Optimization**: Utilizing Semantic Caches, exact-match Prompt Caches, and intelligent Headroom Compression, Muxa drastically reduces API spend without sacrificing context window quality.
4. **Enterprise Observability**: Built-in Prometheus metrics, a real-time dashboard, and structured logging provide deep insights into token expenditure and routing decisions.

---

### Navigation

To get started, proceed to the [Installation](installation.md) guide.

If you are evaluating Muxa for an enterprise deployment, we recommend reviewing our [Architecture Overview](../concepts/architecture.md) and the [Cost Optimization Playbook](../operations/cost.md).
