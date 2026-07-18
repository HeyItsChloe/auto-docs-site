# Secrets & Variables

All runtime configuration is managed through GitHub repository secrets and variables — no YAML editing required to change behavior.

Set everything under **Settings → Secrets and variables → Actions**.

## Variables

Variables are non-sensitive values visible in workflow logs.

| Variable | Values | Default | Purpose |
|---|---|---|---|
| `DOCS_TRIGGER_MODE` | `on-merge`, `weekly`, unset | unset | Which automatic trigger fires. See [Trigger Modes](/configuration/trigger-modes). |
| `DOCS_ENGINE` | `deterministic`, `llm` | `deterministic` | Default engine for automatic runs. See [Generation Engines](/configuration/engines). |

## Secrets

Secrets are encrypted and never appear in logs.

| Secret | Required | Purpose |
|---|---|---|
| `ANTHROPIC_API_KEY` | Only for `llm` engine | Authenticates Claude API requests. Get one at [console.anthropic.com](https://console.anthropic.com). |

## Setting values with the GitHub CLI

```sh
# Variables
gh variable set DOCS_TRIGGER_MODE --body "on-merge"
gh variable set DOCS_ENGINE --body "llm"

# Secrets (prompts for value securely)
gh secret set ANTHROPIC_API_KEY
```

## Built-in GitHub token

The workflow uses the automatically-provided `GITHUB_TOKEN` for three operations:

1. **`git push`** — commits generated docs back to `main`
2. **Upload Pages artifact** — packages the VitePress build
3. **Deploy to Pages** — publishes to `github.io`

The `permissions` block in the workflow grants only the required scopes:

```yaml
permissions:
  contents: write   # git push
  pages: write      # upload artifact
  id-token: write   # OIDC auth for Pages deploy
```

No personal access token or additional configuration is needed.

## Variable precedence reminder

For the engine specifically, the resolution order is: `workflow_dispatch` input → `DOCS_ENGINE` variable → `deterministic` fallback. The variable only applies to automatic and manual-with-`repo-default` runs.
