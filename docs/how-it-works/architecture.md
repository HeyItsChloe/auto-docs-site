# Architecture

## Source Files


### `docs/how-it-works/git-log.md`

```md
# Git Log

`scripts/lib/git-log.mjs` provides two functions for reading the repository's commit history via `execFileSync`.

## currentSha(root)

Returns the current `HEAD` commit hash as a full 40-character SHA string:

```js
export function currentSha(root) {
  return execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root }).toString().trim()
}
```

Used to stamp generated files with the commit they were produced from, and to update `scripts/.last-sha.json` after each successful generator run.

## commitsSince(root, sinceSha)

Returns all commits between `sinceSha` (exclusive) and `HEAD` (inclusive), ordered oldest-first. When `sinceSha` is `null` — no `.last-sha.json` exists — it returns the full repository history.

Each commit is an object:

```js
{ hash, date, author, subject }
```

The git format string `%H%x1f%ad%x1f%an%x1f%s` uses the ASCII unit separator (`\x1f`, `0x1f`) to delimit fields. This handles edge cases where commit subjects contain commas, colons, or other characters that would break simpler delimiters. `--date=short` produces ISO date format (`2025-03-01`).

## The .last-sha.json state file

`scripts/.last-sha.json` records the `HEAD` SHA from the last successful generator run:

```json
{ "sha": "abc1234def5678..." }
```

The generator reads this on startup to get `sinceSha`, then overwrites the file with the new `HEAD` after writing the changelog entry. This makes the changelog **incremental** — each workflow run only processes commits added since the previous run.

If the file doesn't exist (fresh clone or manual deletion), `commitsSince` is called with `null` and returns all commits in history.

The file is committed back to `main` alongside the generated docs by the workflow, so the state persists between runs.

## Resetting the state

```sh
rm scripts/.last-sha.json
npm run generate:changelog
```

This regenerates the full changelog from the beginning of git history.
```


### `docs/how-it-works/repo-scanner.md`

```md
# Repo Scanner

`scripts/lib/repo-scan.mjs` provides the file discovery and source analysis functions used by the overview generator and the site structure generator.

## walkRepo(root)

Recursively walks the directory tree from `root`, skipping ignored directories, and returns an array of `{ path, size }` objects. `path` is relative to `root`. `size` is the file size in bytes from `fs.statSync`.

**Ignored directories:**

```js
const IGNORED_DIRS = new Set([
  'node_modules', '.git', 'dist', 'cache',
  '.vitepress/dist', '.vitepress/cache',
])
```

## buildTree(files) + renderTree(node)

`buildTree` converts the flat file array into a nested object where directory names are object keys and file entries hold their byte size. `renderTree` converts that tree into printable lines using Unicode box-drawing characters:

```
├── scripts/
│   ├── generate-site.mjs (3.8KB)
│   └── lib/
│       ├── claude.mjs (1.2KB)
│       ├── git-log.mjs (0.8KB)
│       └── repo-scan.mjs (2.3KB)
└── docs/
    └── index.md (1.1KB)
```

File sizes are formatted as bytes (`B`) below 1 KB and as kilobytes (`KB`) above.

## buildImportGraph(root, files)

Scans all files with code extensions (`.ts`, `.tsx`, `.js`, `.jsx`, `.mjs`, `.cjs`) for local import and require statements using a single regex:

```js
const LOCAL_IMPORT_RE = /(?:import\s+.*?from\s+|require\()\s*['"](\.[^'"]+)['"]/g
```

Only relative paths (starting with `.`) are captured — npm package imports are excluded. Returns an object mapping each file path to its array of local import strings.

The deterministic overview generator shows the first 60 entries.

## pickSourceSample(root, files, maxChars)

Used by the LLM engine to build the source sample sent to Claude. Selects code and markdown files, sorts them alphabetically, and reads each until the character budget is exhausted (`maxChars` defaults to 40,000). Each file is prefixed with its path:

```
--- scripts/lib/claude.mjs ---
[file content]

--- scripts/lib/git-log.mjs ---
[file content]
```

Alphabetical ordering means files starting with letters early in the alphabet are prioritized. The 40,000 character cap keeps API costs predictable regardless of repo size.
```


### `docs/how-it-works/claude-integration.md`

```md
# Claude Integration

`scripts/lib/claude.mjs` provides the Anthropic API client and engine argument parser used by the generator when running in `llm` mode.

## callClaude({ system, prompt, maxTokens })

Makes a single request to the Anthropic Messages API using the native `fetch`:

```js
const res = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'content-type': 'application/json',
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01',
  },
  body: JSON.stringify({
    model: 'claude-sonnet-4-6',
    max_tokens: maxTokens,
    system,
    messages: [{ role: 'user', content: prompt }],
  }),
})
```

Returns the concatenated text of all `text` blocks in the response content array. Throws on any non-200 status, including the full response body in the error message for easier debugging in Actions logs.

If `ANTHROPIC_API_KEY` is not set, the function throws immediately before making any network call with a descriptive message pointing to the `deterministic` fallback.

## System prompts

Each generation task passes a different `system` string to shape Claude's output:

**Site structure generation:**
> "You are a technical documentation architect. Return ONLY valid JSON, no other text."

**Page content generation:**
> "You are a technical writer creating a docs page. Write accurate, specific markdown content. Use ## and ### headings, code blocks, and tables where appropriate. Do NOT include a top-level # heading."

**Codebase overview:**
> "You are a senior engineer writing a concise, accurate architecture overview for a docs site. Only describe what is actually in the source. Use markdown with ## headings. Cover purpose, key modules/files and what each does, and notable patterns."

**Changelog:**
> "You write clean, human-readable changelog entries from raw commit lists. Group under '### Added', '### Changed', '### Fixed' as appropriate. Omit empty groups. Never invent changes."

## parseEngineArg(defaultEngine)

Reads `--engine=<value>` from `process.argv`. Accepts `deterministic` and `llm`. Throws on any other value. Default is `deterministic` when the flag is absent.

```js
const arg = process.argv.find((a) => a.startsWith('--engine='))
const engine = arg ? arg.split('=')[1] : defaultEngine
```

## Token budgets

| Task | `maxTokens` |
|---|---|
| Site structure JSON | 3,000 |
| Individual page content | 2,500 |
| Codebase overview | 3,000 |
| Changelog entry | 1,500 |

Source input is capped at 40,000 characters by `pickSourceSample` before being sent, keeping each request predictable in cost regardless of repo size.
```


### `docs/how-it-works/architecture.md`

```md
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
6. `npm run build` compiles the full V
```


### `docs/how-it-works/workflow.md`

```md
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
    git diff --cached --quiet && echo "
```
