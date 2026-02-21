# Other OpenAI-Compatible Tools

Muxa's API surface fully emulates OpenAI's `v1` REST endpoints. As a result, any application that supports custom base URLs can be routed through Muxa to leverage Hybrid Routing, Headroom Compression, and Token Optimization.

Tools that fall into this category include:

- **Cline**
- **Continue.dev**
- **ClawdBot**
- **Various CLI scripting utilities**

The exact configuration depends on the client. Typically, you will need to adjust the settings file or UI configuration panel to reflect:

Set their custom OpenAI endpoint to `http://localhost:8081/v1` with API key `sk-muxa` and use your desired model name.

## OpenAI Codex CLI

`codex -c model_provider='"muxa"' -c model='"gpt-5.3-codex"' -c 'model_providers.muxa={name="Muxa Proxy",base_url="http://localhost:8081/v1",wire_api="responses",api_key="sk-muxa"}'` 

#### Troubleshooting

If a client fails to connect:
- Ensure you included the `/v1` suffix if the client expects to append resources like `/chat/completions` manually.
- Use `curl http://localhost:8081/health/live` to verify Muxa is accepting traffic.
- Check the Muxa terminal output or the dashboard at `http://localhost:8081/dashboard` for structured logs of the failure. Some edge-case payloads (like malformed JSON) might be rejected at the gateway.
