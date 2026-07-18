# Trigger Modes

The workflow (`.github/workflows/docs-site.yml`) defines both triggers — `push` to `main` and a weekly `schedule` — but only one is actually "live" at a time, controlled by a repo variable so you never have to edit the YAML to switch:

| Repo variable | Value | Behavior |
| --- | --- | --- |
| `DOCS_TRIGGER_MODE` | `on-merge` | Regenerates on every push to `main`. The scheduled run is a no-op. |
| `DOCS_TRIGGER_MODE` | `weekly` | Regenerates on the Monday 9am UTC schedule. Pushes to `main` are a no-op. |
| unset | — | Neither automatic trigger fires. Manual `workflow_dispatch` runs still work. |

Set it under **Settings → Secrets and variables → Actions → Variables**.

## Source Files


### `docs/configuration/trigger-modes.md`

```md
# Trigger Modes

The workflow (`.github/workflows/docs-site.yml`) defines both triggers — `push` to `main` and a
weekly `schedule` — but only one is actually "live" at a time, controlled by a repo variable so
you never have to edit the YAML to switch:

| Repo variable | Value | Behavior |
| --- | --- | --- |
| `DOCS_TRIGGER_MODE` | `on-merge` | Regenerates on every push to `main`. The scheduled run is a no-op. |
| `DOCS_TRIGGER_MODE` | `weekly` | Regenerates on the Monday 9am UTC schedule. Pushes to `main` are a no-op. |
| unset | — | Neither automatic trigger fires. Manual `workflow_dispatch` runs still work. |

Set it under **Settings → Secrets and variables → Actions → Variables**.

## Source Files


### `docs/configuration/secrets-variables.md`

```md
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
```


### `docs/configuration/trigger-modes.md`

```md
# Trigger Modes

The workflow registers two automatic triggers — a `push` event and a weekly `schedule` — but only one fires at a time, controlled by a repo variable. You switch behavior without editing any YAML.

## The three modes
```


### `docs/configuration/engines.md`

```md
# Generation Engines

Two engines exist for both the overview and the changelog generator, selectable **per run**:

- **`deterministic`** — no API key needed. Walks the file tree and builds a real import graph
  (overview), or lists raw commits (changelog). Fully mechanical, always available.
- **`llm`** — sends a representative source sample (overview) or the raw commit list (changelog)
  to the Claude API and asks for a written summary / grouped changelog. Needs `ANTHROPIC_API_KEY`
  as a repo secret.

The default engine for automatic runs comes from the `DOCS_ENGINE` repo variable (`deterministic`
if unset). A manual `workflow_dispatch` run can override it via the `engine` input, regardless of
the repo default.

## Source Files


### `docs/configuration/secrets-variables.md`

```md
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
```


### `docs/configuration/trigger-modes.md`

```md
# Trigger Modes

The workflow (`.github/workflows/docs-site.yml`) defines both triggers — `push` to `main` and a
weekly `schedule` — but only one is actually "live" at a time, controlled by a repo varia
```


### `docs/configuration/secrets-variables.md`

```md
# Secrets & Variables

## Source Files


### `docs/configuration/secrets-variables.md`

```md
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
```


### `docs/configuration/trigger-modes.md`

```md
# Trigger Modes

The workflow (`.github/workflows/docs-site.yml`) defines both triggers — `push` to `main` and a
weekly `schedule` — but only one is actually "live" at a time, controlled by a repo variable so
you never have to edit the YAML to switch:

| Repo variable | Value | Behavior |
| --- | --- | --- |
| `DOCS_TRIGGER_MODE` | `on-merge` | Regenerates on every push to `main`. The scheduled run is a no-op. |
| `DOCS_TRIGGER_MODE` | `weekly` | Regenerates on the Monday 9am UTC schedule. Pushes to `main` are a no-op. |
| unset | — | Neither automatic trigger fires. Manual `workflow_dispatch` runs still work. |

Set it under **Settings → Secrets and variables → Actions → Variables**.

## Source Files


### `docs/configuration/secrets-variables.md`

```md
# Secrets & Variables

All runtime configuration is managed through GitHub repository secrets and variables — no YAML editing required to
```
