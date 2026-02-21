# Memory & History Management

Large Language Models inherently lack state. In complex architectures, developers often find themselves repeatedly typing identical context (e.g., "Remember we use Postgres for the database and follow the Repository pattern") into prompt windows.

Muxa solves this by operating as a transparent memory proxy.

## Long-Term Memory Injection

When Memory is enabled, Muxa intercepts incoming traffic and analyzes it for highly relevant, enduring facts or architectural decisions.

These facts are embedded and stored in a local lightweight vector database. On subsequent requests, Muxa intercepts the system prompt from the client IDE and silently injects the Top-K most relevant memories before forwarding the payload to the provider.

### Setup

```ini
MUXA_MEMORY_ENABLED=true
MUXA_MEMORY_TOPK=3
```

By default, Muxa extracts and stores facts continuously. 

**Note:** For the vector store to operate, you must have an embeddings model configured. See the [Embeddings Overview](embeddings.md) for details.

### Reviewing Memories

Because Muxa operates entirely on localhost, all Memory data is stored in the `./data/memories` footprint (or Docker volume). 

You can clear the context simply by restarting Muxa or issuing an API command to the memory endpoint if you need the IDEs to start fresh on a new domain.
