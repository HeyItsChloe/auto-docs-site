# Workflow Deep Dive

An annotated walkthrough of `.github/workflows/docs-site.yml`.

## Triggers

```yaml
on:
  push:
    branches: [main]
  schedule:
    - cron: '0 9 * * 1'
  workflow_dispatch:
    inputs:
      engine:
        description: 'Doc generation engine for this run'
        type: choice
        default: repo-default
        options: [repo-default, deterministic, llm]
```

All three triggers are registered but the `if` condition on the job means at most one automatic trigger is active at a time. `workflow_dispatch` always runs regardless of `DOCS_TRIGGER_MODE` and exposes the `engine` input for a per-run override.

## Permissions

```yaml
permissions:
  contents: write
  pages: write
  id-token: write
```

- `contents: write` — required for the `git push` step that commits generated docs back to `main`
- `pages: write` — required for `actions/upload-pages-artifact`
- `id-token: write` — required for OIDC-based authentication in `actions/deploy-pages`

## Concurrency

```yaml
concurrency:
  group: docs-site
  cancel-in-progress: true
```

Only one run of the `docs-site` group executes at a time. If a second run starts while the first is still in progress, the older run is cancelled. This prevents two runs from racing on the `git push` step and from both writing to `.last-sha.json` with different SHAs.

## Job: generate-and-deploy

### Checkout with full history

```yaml
- uses: actions/checkout@v4
  with:
    fetch-depth: 0
```

`fetch-depth: 0` fetches the complete git history. The default shallow clone (`fetch-depth: 1`) would break `commitsSince` in `git-log.mjs` because `git log <sha>..HEAD` needs to traverse past the single fetched commit.

### Engine resolution

```yaml
- name: Resolve engine for this run
  id: engine
  run: |
    if [ "${{ github.event.inputs.engine }}" != "" ] && \
       [ "${{ github.event.inputs.engine }}" != "repo-default" ]; then
      echo "value=${{ github.event.inputs.engine }}" >> "$GITHUB_OUTPUT"
    else
      echo "value=${DOCS_ENGINE:-deterministic}" >> "$GITHUB_OUTPUT"
    fi
  env:
    DOCS_ENGINE: ${{ vars.DOCS_ENGINE }}
```

The `workflow_dispatch` engine input wins. Falls back to `DOCS_ENGINE` variable, then to the hardcoded `deterministic` default.

### Site generation

```yaml
- name: Generate site
  run: npm run generate:site -- --engine=${{ steps.engine.outputs.value }}
  env:
    ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
```

Runs `scripts/generate-site.mjs`. In `llm` mode this writes `generated-config.json`, `generated-tokens.css`, all structured pages, `codebase-overview.md`, `changelog.md`, and `.last-sha.json`. In `deterministic` mode it only writes `codebase-overview.md`, `changelog.md`, and `.last-sha.json`.

### Commit back to main

```yaml
- name: Commit generated docs back to main
  run: |
    git config user.name "docs-site-bot"
    git config user.email "actions@users.noreply.github.com"
    git add docs/ scripts/.last-sha.json
    git diff --cached --quiet && echo "No doc changes to commit" || \
      git commit -m "docs: regenerate site [skip ci]"
    git push
```

The `[skip ci]` tag prevents the push from triggering another workflow run — without it the commit would create an infinite loop. The `git diff --cached --quiet` check prevents an empty commit when nothing changed (e.g. no new commits since the last run).

### Build and deploy

```yaml
- run: npm run build

- uses: actions/upload-pages-artifact@v3
  with:
    path: docs/.vitepress/dist

- id: deployment
  uses: actions/deploy-pages@v4
```

Standard VitePress build followed by the GitHub Pages deployment action pair. The `environment` block at the job level links this to the `github-pages` environment so the deployment URL appears in the job summary and on the repo's main page.
