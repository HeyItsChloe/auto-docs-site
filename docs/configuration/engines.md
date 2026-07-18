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

Two engines exist for generating the codebase overview and changelog. You choose the default via a repo variable and can override it per-run via the `workflow_dispatch` input.

## Deterministic

No API key needed. The engine operates mechanically on the repo's files and git history.

**Overview output:** a directory tree rendered with Unicode box characters, followed by a local import graph — which files import which other local files.

**Changelog output:** a flat bullet list of commits with hash, date, author, and subject line.

Output is fully reproducible: the same repo state always produces the same output. Good for CI environments where you want zero API cost, or when you haven't added the Anthropic key yet.

## LLM

Sends representative source code to the Claude API and asks for written prose.

**Overview output:** a narrative architecture overview covering the project's purpose, key modules and what each does, and notable patterns or conventions. Claude is instructed to only describe what is actually in the source — not invent behavior.

**Changelog output:** commits grouped under `### Added`, `### Changed`, and `### Fixed` subheadings, written as human-readable entries rather than raw subject lines.

Requires `ANTHROPIC_API_KEY` as a repo secret. Uses `claude-sonnet-4-6` with up to 3,000 output tokens for the overview and 1,500 for the changelog.

## Choosing the default

Set `DOCS_ENGINE` under **Settings → Secrets and variables → Actions → Variables**:

```sh
gh variable set DOCS_ENGINE --body "llm"
gh variable set DOCS_ENGINE --body "deterministic"
```

If `DOCS_ENGINE` is unset the workflow defaults to `deterministic`.

## Overriding per-run

A manual `workflow_dispatch` run exposes an `engine` input dropdown:

| Input value | Effect |
|---|---|
| `repo-default` | Uses `DOCS_ENGINE` (or `deterministic` if unset) |
| `deterministic` | Forces deterministic for this run only |
| `llm` | Forces LLM for this run only |

This lets you trigger a one-off LLM generation without changing the repo default, or verify deterministic output without removing your API key.

## Engine resolution order

1. `workflow_dispatch` engine input (if not `repo-default`)
2. `DOCS_ENGINE` repo variable
3. Hardcoded fallback: `deterministic`
```
