# auto-docs-site

A GitHub Actions automation that keeps a live [VitePress](https://vitepress.dev) docs site up to date on its own — codebase overview, changelog, and a full multi-page site structure regenerated either on every merge to `main` or on a weekly schedule — and deployed to GitHub Pages.

It documents itself: the generated pages describe *this* repository's own code and history. Point the generation scripts at a different repo's checkout to reuse this for something else.

## How the trigger mode is chosen

The workflow (`.github/workflows/docs-site.yml`) defines both triggers — `push` to `main` and a weekly `schedule` — but only one is actually "live" at a time, controlled by a repo variable so you never have to edit the YAML to switch:

| Repo variable | Value | Behavior |
| --- | --- | --- |
| `DOCS_TRIGGER_MODE` | `on-merge` | Regenerates on every push to `main`. The scheduled run is a no-op. |
| `DOCS_TRIGGER_MODE` | `weekly` | Regenerates on the Monday 9am UTC schedule. Pushes to `main` are a no-op. |
| unset | — | Neither automatic trigger fires. Manual `workflow_dispatch` runs still work. |

Set it under **Settings → Secrets and variables → Actions → Variables**.

## Choosing the generation engine

Two engines exist, selectable **per run**.

- **`llm`** (recommended default) — on every merge, reads the git diff and asks Claude which pages are affected by what changed. Edits only those pages — surgically. Never removes accurate content. If the diff introduces a new concept with no existing page, adds that page. First-time run (no existing site) builds the full structure from scratch. Needs `ANTHROPIC_API_KEY` as a repo secret.
- **`deterministic`** — no API key needed. Only updates `codebase-overview.md` (file tree + import graph) and `changelog.md` (raw commit list). All prose pages are left exactly as the last `llm` run wrote them. Use this when you want a free, fast reference refresh without touching prose.

Set `DOCS_ENGINE` to `llm` in your repo variables to make smart incremental updates the default on every merge.

The default engine for automatic runs comes from the `DOCS_ENGINE` repo variable (`deterministic` if unset). A manual `workflow_dispatch` run can override it via the `engine` input, regardless of the repo default.

## Setup

1. **Enable Pages**: Settings → Pages → Build and deployment → Source → **GitHub Actions**.
2. **Set the `github-pages` environment's deployment branch policy** to allow `main` (Settings → Environments → github-pages → Deployment branches and tags) — otherwise the deploy step is rejected by GitHub's environment protection rules.
3. **Pick a trigger mode**: set the `DOCS_TRIGGER_MODE` repo variable to `on-merge` or `weekly`.
4. **(Optional) Enable the `llm` engine**: add `ANTHROPIC_API_KEY` as a repo secret, and set the `DOCS_ENGINE` repo variable to `llm` if you want it to be the default (or just pick `llm` on a manual run via the `engine` workflow input).
5. **Run it**: Actions → "Generate & deploy docs site" → Run workflow, to generate the first version without waiting for a push or the weekly schedule.

## Local development

```sh
npm install
npm run generate:site -- --engine=deterministic
npm run generate:site -- --engine=llm   # needs ANTHROPIC_API_KEY in env
npm run dev     # live preview at localhost
npm run build   # static build to docs/.vitepress/dist
```
