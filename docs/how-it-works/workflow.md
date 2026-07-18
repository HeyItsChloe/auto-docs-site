# Workflow Deep Dive

## Source Files


### `docs/how-it-works/git-log.md`

```md
# Git Log

## Source Files


### `scripts/lib/git-log.mjs`

```mjs
import { execFileSync } from 'node:child_process'

export function currentSha(root) {
  return execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root }).toString().trim()
}

export function commitsSince(root, sinceSha) {
  const range = sinceSha ? `${sinceSha}..HEAD` : 'HEAD'
  const format = '%H%x1f%ad%x1f%an%x1f%s'
  const out = execFileSync(
    'git',
    ['log', range, `--pretty=format:${format}`, '--date=short'],
    { cwd: root },
  )
    .toString()
    .trim()

  if (!out) return []

  return out.split('\n').map((line) => {
    const [hash, date, author, subject] = line.split('\x1f')
    return { hash, date, author, subject }
  })
}
```


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

## Source Files


### `docs/how-it-works/git-log.md`

```md
# Git Log

`scripts/lib/git-log.mjs` provides two functions for reading the repository's commit history via `execFileSync`.

## currentSha(root)

Returns the current `HEAD` commit
```


### `docs/how-it-works/repo-scanner.md`

```md
# Repo Scanner

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
│       ├── git-log.mj
```


### `docs/how-it-works/claude-integration.md`

```md
# Claude Integration

## Source Files


### `scripts/lib/claude.mjs`

```mjs
export async function callClaude({ system, prompt, maxTokens = 2000 }) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error(
      'ANTHROPIC_API_KEY is not set — the "llm" engine needs it as a repo secret. Use --engine=deterministic instead, or add the secret.',
    )
  }

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

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Claude API request failed: ${res.status} ${res.statusText} — ${body}`)
  }

  const data = await res.json()
  return data.content.map((block) => block.text).join('\n')
}

export function parseEngineArg(defaultEngine = 'deterministic') {
  const arg = process.argv.find((a) => a.startsWith('--engine='))
  const engine = arg ? arg.split('=')[1] : defaultEngine
  if (!['deterministic', 'llm'].includes(engine)) {
    throw new Error(`Unknown engine "${engine}" — expected "deterministic" or "llm".`)
  }
  return engine
}
```


### `docs/how-it-works/git-log.md`

```md
# Git Log

## Source Files


### `scripts/lib/git-log.mjs`

```mjs
import { execFileSync } from 'node:child_process'

export function currentSha(root) {
  return execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root }).toString().trim()
}

export function commitsSince(root, sinceSha) {
  const range = sinceSha ? `${sinceSha}..HEAD` : 'HEAD'
  const format = '%H%x1f%ad%x1f%an%x1f%s'
  const out = execFileSync(
    'git',
    ['log', range, `--pretty=format:${format}`, '--date=short'],
    { cwd: root },
  )
    .toString()
    .trim()

  if (!out) return []

  return out.split('\n').map((line) => {
    const [hash, date, author, subject] = line.split('\x1f')
    return { hash, date, author, subject }
  })
}
```


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

The git format st
```


### `docs/how-it-works/architecture.md`

```md
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
│       ├── git-log.mj
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
