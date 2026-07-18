# Architecture

auto-docs-site is a four-stage pipeline: **trigger → generate → commit → deploy**.

```
push to main  /  schedule  /  workflow_dispatch
                    │
                    ▼
     ┌──────────────────────────────────┐
     │  .github/workflows/docs-site.yml │
     │                                  │
     │  1. checkout (fetch-depth: 0)    │
     │  2. npm ci                       │
     │  3. resolve engine               │
     │  4. npm run generate:site ───────┼──► scripts/generate-site.mjs
     │  5. git commit + push            │       ├─ scripts/lib/repo-scan.mjs
     │  6. npm run build ───────────────┼──► docs/.vitepress/dist/
     │  7. deploy to Pages              │
     └──────────────────────────────────┘
```

## Key components

**`.github/workflows/docs-site.yml`** — the orchestrator. Fires on push, schedule, or dispatch; resolves the active engine; calls the site generator; commits docs back to `main`; builds and deploys.

**`scripts/generate-site.mjs`** — unified generator. In `llm` mode it analyzes the repo and generates the full site structure, page content, accent color tokens, and nav/sidebar config. In `deterministic` mode it generates only the codebase overview and changelog without touching any other pages.

**`scripts/lib/repo-scan.mjs`** — file walker, directory tree builder, and import graph extractor. See [Repo Scanner](/how-it-works/repo-scanner).

**`scripts/lib/git-log.mjs`** — reads git commits using `execFileSync`. Supports full history and incremental reads from a saved SHA. See [Git Log](/how-it-works/git-log).

**`scripts/lib/claude.mjs`** — thin Anthropic API client with a `callClaude()` function and engine argument parser. See [Claude Integration](/how-it-works/claude-integration).

**`docs/`** — VitePress source. Static pages live here as markdown files. Generated pages (`codebase-overview.md`, `changelog.md`) are overwritten on every run.

**`docs/.vitepress/generated-config.json`** — generated nav and sidebar structure. `config.ts` reads this file at build time so the site nav matches whatever structure was last generated.

**`docs/.vitepress/theme/generated-tokens.css`** — generated accent color CSS variables. Imported by `custom.css` so each site can have a distinct palette while sharing the same layout.

## Self-documenting design

This repo documents itself: the generated pages describe auto-docs-site's own code and history. The same pipeline that would document another project is pointed at its own containing repository.

## Data flow for a single run

1. Checkout with `fetch-depth: 0` — full git history is required for `git log`
2. `npm ci` installs VitePress and dependencies
3. Engine resolves to `deterministic` or `llm` based on variables and dispatch input
4. Generator runs — writes `.md` files, `generated-config.json`, `generated-tokens.css`, and `.last-sha.json`
5. `git push` commits changed files with `[skip ci]` to prevent a trigger loop
6. `npm run build` compiles the full VitePress site to `docs/.vitepress/dist/`
7. Pages artifact is uploaded and deployed; the URL appears in the workflow summary
