# GitHub Copilot

GitHub Copilot (in VS Code and JetBrains) can be redirected to route its completion and chat traffic through Muxa, gaining the benefits of hybrid routing and token optimization.

## Configuration via Environment Variables

Copilot relies on an undocumented backdoor to specify a custom proxy.

Export the following before launching your editor:

```bash
export GITHUB_COPILOT_PROXY_URL=http://localhost:8081/v1
export GITHUB_COPILOT_PROXY_KEY=dummy
```

If you are on macOS and click the IDE icon in your Dock, these variables won't be inherited unless they are injected globally using `launchctl`.

## macOS Global Override

```bash
# Not required for Copilot directly, just export the variables above and restart the editor.
```

After running the above, completely quit VS Code or your JetBrains IDE (Cmd+Q) and reopen it.

*Disclaimer: Copilot relies heavily on highly specialized prompt structures. Relying on local LLMs via Muxa for inline completions may yield lower quality results compared to Copilot's default backend, unless you are using massive local models mapped specifically for code completion.*
