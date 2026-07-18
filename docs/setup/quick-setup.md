# Quick Setup

Get auto-docs-site running in your repository in under five minutes.

## Prerequisites

- A GitHub repository (public or private)
- Node.js 20+ for local development only — not needed for Actions-only use
- An Anthropic API key if you want the `llm` engine (`deterministic` needs no key)

## 1. Enable GitHub Pages

In your repo: **Settings → Pages → Build and deployment → Source → GitHub Actions**.

## 2. Allow the Pages environment

Go to **Settings → Environments → github-pages → Deployment branches and tags** and add `main`. Without this step the workflow's deploy step is rejected by GitHub's environment protection rules and the run fails.

## 3. Set a trigger mode

Set the `DOCS_TRIGGER_MODE` variable under **Settings → Secrets and variables → Actions → Variables**:

| Value | Behavior |
|---|---|
| `on-merge` | Regenerates on every push to `main` |
| `weekly` | Regenerates on the Monday 9 AM UTC schedule |
| unset | Neither automatic trigger fires; manual dispatch still works |

```sh
gh variable set DOCS_TRIGGER_MODE --body "on-merge"
```

## 4. (Optional) Enable the LLM engine

The `llm` engine sends a source sample to Claude and produces narrative prose instead of raw file trees and commit lists. It needs an Anthropic API key:

```sh
gh secret set ANTHROPIC_API_KEY --body "sk-ant-..."
gh variable set DOCS_ENGINE --body "llm"
```

If `DOCS_ENGINE` is unset the workflow defaults to `deterministic`. See [Generation Engines](/configuration/engines) for a full comparison.

## 5. Run it

Trigger the first generation manually so you don't have to wait for a push or the weekly schedule:

```sh
gh workflow run "Generate & deploy docs site"
```

Or in the GitHub UI: **Actions → Generate & deploy docs site → Run workflow**.

The workflow will generate docs, commit them back to `main` with a `[skip ci]` message, build the VitePress site, and deploy it to Pages. The live URL appears in the workflow run's deployment log and in the `github-pages` environment on your repo's main page.

## Next steps

- [Trigger Modes](/configuration/trigger-modes) — understand when and how regeneration fires
- [Generation Engines](/configuration/engines) — compare `deterministic` vs `llm` output
- [Local Development](/setup/local-development) — run generators and preview the site locally
