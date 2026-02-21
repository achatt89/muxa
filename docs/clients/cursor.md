# Cursor IDE Integration

Cursor allows custom models and custom base URLs, making it a first-class citizen for Muxa integration.

## Configuration Steps

1. Launch Muxa locally (or remotely via an internal network). Example: `http://localhost:8081`.
2. Open **Cursor Settings**.
4. In the settings, navigate to **Features -> Models**.
5. Set the **Base URL** to `http://localhost:8081/v1` and the **API key** to `sk-muxa`.
6. Toggle off all default models and explicitly add the model name configured in your Muxa deployment (e.g., `gpt-4o`, `claude-3-5-sonnet-20241022`).

## Enabling Codebase Indexing (Embeddings)

To use the `@Codebase` feature effectively with Muxa, you must configure Muxa to act as an embeddings provider using a fast, cheap model (like local Ollama `nomic-embed-text` or OpenAI `text-embedding-3-small`).

See the [Embeddings Configuration](../advanced/embeddings.md) guide for setup instructions.

Once Muxa is serving embeddings, Cursor will automatically route its massive background indexing jobs through Muxa, where you can easily monitor and cache the traffic.
