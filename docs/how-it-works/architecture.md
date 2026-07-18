# Architecture

## Source Files


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


### `docs/how-it-works/workflow.md`

```md
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

`scripts/lib/git-log.mjs` provides two functions for reading the repository's commit h
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
