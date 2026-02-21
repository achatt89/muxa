# Claude Code CLI

Anthropic's Claude Code CLI is incredibly powerful but exclusively speaks to the Anthropic API. Muxa can intercept these requests, allowing you to run Claude Code tooling against *any* provider, including OpenRouter or local models.

## Environment Variable Injection

The CLI reads standard Anthropic environment variables. You must point these variables at Muxa before execution.

```bash
ANTHROPIC_BASE_URL=http://localhost:8081 ANTHROPIC_API_KEY=sk-muxa claude "Prompt"
```

## macOS launchctl (Persistent GUI Configuration)

If you launch Claude via a GUI wrapper or terminal emulator that doesn't respect your `.bashrc`/`.zshrc`, use `launchctl` to persist the override globally:

```bash
# Persist environment variables for GUI-launched apps
## NO NEED to provide the actual key - just needs a dummy value so that openAI/Anthropic don't complain). The actual keys are read from the .env file
launchctl setenv OPENAI_API_KEY sk-muxa
launchctl setenv ANTHROPIC_API_KEY sk-muxa
launchctl setenv MUXA_BASE_URL http://localhost:8081

# Inspect current values
launchctl getenv OPENAI_API_KEY
launchctl getenv ANTHROPIC_API_KEY

# Remove when rotating credentials
launchctl unsetenv OPENAI_API_KEY
launchctl unsetenv ANTHROPIC_API_KEY
```

*Note: You will need to completely quit and restart your terminal emulator for the launchctl environment variables to take effect.*
