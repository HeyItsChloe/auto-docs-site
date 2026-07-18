# Quick Setup

1. **Enable Pages**: Settings → Pages → Build and deployment → Source → **GitHub Actions**.
2. **Set the `github-pages` environment's deployment branch policy** to allow `main` (Settings → Environments → github-pages → Deployment branches and tags) — otherwise the deploy step is rejected by GitHub's environment protection rules.
3. **Pick a trigger mode**: set the `DOCS_TRIGGER_MODE` repo variable to `on-merge` or `weekly`.
4. **(Optional) Enable the `llm` engine**: add `ANTHROPIC_API_KEY` as a repo secret, and set the `DOCS_ENGINE` repo variable to `llm` if you want it to be the default (or just pick `llm` on a manual run via the `engine` workflow input).
5. **Run it**: Actions → "Generate & deploy docs site" → Run workflow, to generate the first version without waiting for a push or the weekly schedule.

## Source Files


### `docs/setup/quick-setup.md`

```md
# Quick Setup

1. **Enable Pages**: Settings → Pages → Build and deployment → Source → **GitHub Actions**.
2. **Set the `github-pages` environment's deployment branch policy** to allow `main` (Settings →
   Environments → github-pages → Deployment branches and tags) — otherwise the deploy step is
   rejected by GitHub's environment protection rules.
3. **Pick a trigger mode**: set the `DOCS_TRIGGER_MODE` repo variable to `on-merge` or `weekly`.
4. **(Optional) Enable the `llm` engine**: add `ANTHROPIC_API_KEY` as a repo secret, and set the
   `DOCS_ENGINE` repo variable to `llm` if you want it to be the default (or just pick `llm` on a
   manual run via the `engine` workflow input).
5. **Run it**: Actions → "Generate & deploy docs site" → Run workflow, to generate the first
   version without waiting for a push or the weekly schedule.

## Source Files


### `docs/setup/local-development.md`

```md
# Local Development

Run the generation scripts and preview the docs site locally without touching GitHub Actions.

## Install dependencies

```sh
npm install
```

## Generate docs

Both generators accept an `--engine` flag. The default is `deterministic`.

```sh
# Codebase overview — no API key needed
npm run generate:overview -- --engine=deterministic

# Codebase overview — LLM (requires ANTHROPIC_API_KEY)
ANTHROPIC_API_KEY=sk-ant-... npm run generate:overview -- --engine=llm

# Changelog — deterministic
npm run generate:changelog -- --engine=deterministic

# Changelog — LLM
ANTHROPIC_API_KEY=sk-ant-... npm run generate:changelog -- --engine=llm
```

Or use the unified generator (runs both in one call):

```sh
npm run generate:site -- --engine=deterministic
npm run generate:site -- --engine=llm
```

## Preview the site

```sh
npm run dev
```

Opens the VitePress dev server at `http://localhost:5173/auto-docs-site/` (or the next available port). Changes to `.md` files and the theme hot-reload automatically.

## Build a static copy

```sh
npm run build
```

Outputs to `docs/.vitepress/dist/`. Serve it locally to verify the production build matches the dev preview:

```sh
npm run preview
```

## Resetting the changelog state

The changelog generator is incremental — it only processes commits since `scripts/.last-sha.json`. To regenerate from the full git history:

```sh
rm scripts/.last-sha.json
npm run generate:changelog
```

## Pointing the generators at a different repo

The scripts resolve the repo root from their own location (`dirname(import.meta.url) + '/..'`). To generate docs for a different codebase, copy the `scripts/` directory and `package.json` into that repo and run from there. The generators will scan the repo they live in.
```


### `docs/setup/quick-setup.md`

```md
# Quick Setup

Get auto-docs-site running in your repository in under five minutes.

## Prerequisites

- A GitHub repository (public or private)
- Node.js 20+ for local development only — not needed for Actions-only use
- An Anthropic API key if you want the `llm` engine (`d
```


### `docs/setup/local-development.md`

```md
# Local Development

```sh
npm install
npm run generate:overview -- --engine=deterministic
npm run generate:changelog -- --engine=deterministic
npm run dev     # live preview at localhost
npm run build   # static build to docs/.vitepress/dist
```

## Source Files


### `docs/setup/local-development.md`

```md
# Local Development

Run the generation scripts and preview the docs site locally without touching GitHub Actions.

## Install dependencies

```sh
npm install
```

## Generate docs

Both generators accept an `--engine` flag. The default is `deterministic`.

```sh
# Codebase overview — no API key needed
npm run generate:overview -- --engine=deterministic

# Codebase overview — LLM (requires ANTHROPIC_API_KEY)
ANTHROPIC_API_KEY=sk-ant-... npm run generate:overview -- --engine=llm

# Changelog — deterministic
npm run generate:changelog -- --engine=deterministic

# Changelog — LLM
ANTHROPIC_API_KEY=sk-ant-... npm run generate:changelog -- --engine=llm
```

Or use the unified generator (runs both in one call):

```sh
npm run generate:site -- --engine=deterministic
npm run generate:site -- --engine=llm
```

## Preview the site

```sh
npm run dev
```

Opens the VitePress dev server at `http://localhost:5173/auto-docs-site/` (or the next available port). Changes to `.md` files and the theme hot-reload automatically.

## Build a static copy

```sh
npm run build
```

Outputs to `docs/.vitepress/dist/`. Serve it locally to verify the production build matches the dev preview:

```sh
npm run preview
```

## Resetting the changelog state

The changelog generator is incremental — it only processes commits since `scripts/.last-sha.json`. To regenerate from the full git history:

```sh
rm scripts/.last-sha.json
npm run generate:changelog
```

## Pointing the generators at a different repo

The scripts resolve the repo root from their own location (`dirname(import.meta.url) + '/..'`). To generate docs for a different codebase, copy the `scripts/` directory and `package.json` into that repo and run from there. The generators will scan the repo they live in.
```


### `docs/setup/quick-setup.md`

```md
# Quick Setup

1. **Enable Pages**: Settings → Pages → Build and deployment → Source → **GitHub Actions**.
2. **Set the `github-pages` environment's deployment branch policy** to allow `main` (Settings →
   Environments → github-pages → Deployment branches and tags) — otherwise the deploy step is
   rejected by GitHub's environment protection rules.
3. **Pick a trigger mode**: set the `DOCS_TRIGGER_MODE` repo variable to `on-merge` or `weekly`.
4. **(Optional) Enable the `llm` engine**: add `ANTHROPIC_API_KEY` as a repo secret, and set the
   `DOCS_ENGINE` repo variable to `llm` if you want it to be the default (or just pick `llm` on a
   manual run via the `engine` workflow input).
5. **Run it**: Actions → "Generate & deploy docs site" → Run workflow, to generate the first
   version without waiting for a push or the weekly schedule.

## Source Files


### `docs
```
