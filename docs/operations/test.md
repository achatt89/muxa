# Testing Suite

Muxa's core value is absolute reliability as an invisible infrastructure component. If the proxy goes down, all organization-wide tooling crashes. To prevent this, Muxa relies on an aggressive testing hierarchy.

## Running Tests

Muxa is built entirely with Node's native test runner.

```bash
# Run all tests (Integration, Unit, and E2E endpoints)
npm test
```

## Coverage Layout

The testing suite contains over 90 distinct test suites focused heavily on system edge cases and API protocol edge-case parity:

### Endpoint Parity Validation
Before a release, you can run the parity preflight checker:

```bash
node scripts/endpoint-parity-preflight.js
```

This script generates synthetic, complex payloads (e.g. streaming, async timeouts, multi-tool outputs) and sends identical payloads to the actual OpenAI API, the actual Anthropic API, and Muxa. It automatically diffs the raw socket output to ensure absolute parity of the SSE streams down to the byte level.

### Caching and State
Due to the aggressive multi-tiered caching mechanisms (Semantic Cache, Prompt Cache, Headroom), unit tests are responsible for testing race conditions, TTL expiry on high-throughput bursts, and vector database persistence constraints. 
