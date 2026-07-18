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


### `docs/how-it-works/architecture.md`

```md
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
│   ├── generate-si
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


### `docs/how-it-works/architecture.md`

```md
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

`scripts/lib/repo-scan.mjs` provides the file discovery and source analysis f
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


### `scripts/lib/repo-scan.mjs`

```mjs
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, extname } from 'node:path'

const IGNORED_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  'cache',
  '.vitepress/dist',
  '.vitepress/cache',
])

const CODE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'])

export function walkRepo(root) {
  const files = []

  function walk(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (IGNORED_DIRS.has(entry.name)) continue
      const fullPath = join(dir, entry.name)
      if (entry.isDirectory()) {
        walk(fullPath)
      } else if (entry.isFile()) {
        const size = statSync(fullPath).size
        files.push({ path: relative(root, fullPath), size })
      }
    }
  }

  walk(root)
  return files
}

export function buildTree(files) {
  const root = {}
  for (const file of files) {
    const parts = file.path.split('/')
    let node = root
    for (let i = 0; i < parts.length - 1; i++) {
      node[parts[i]] ??= {}
      node = node[parts[i]]
    }
    node[parts[parts.length - 1]] = file.size
  }
  return root
}

export function renderTree(node, prefix = '') {
  const lines = []
  const entries = Object.entries(node)
  entries.forEach(([name, value], i) => {
    const isLast = i === entries.length - 1
    const connector = isLast ? '└── ' : '├── '
    if (typeof value === 'object') {
      lines.push(`${prefix}${connector}${name}/`)
      lines.push(...renderTree(value, prefix + (isLast ? '    ' : '│   ')))
    } else {
      lines.push(`${prefix}${connector}${name} (${formatBytes(value)})`)
    }
  })
  return lines
}

function formatBytes(n) {
  if (n < 1024) return `${n}B`
  return `${(n / 1024).toFixed(1)}KB`
}

const LOCAL_IMPORT_RE = /(?:import\s+.*?from\s+|require\()\s*['"](\.[^'"]+)['"]/g

export function buildImportGraph(root, files) {
  const graph = {}
  for (const file of files) {
    if (!CODE_EXTENSIONS.has(extname(file.path))) continue
    const content = readFileSync(join(root, file.path), 'utf8')
    const imports = new Set()
    for (const match of content.matchAll(LOCAL_IMPORT_RE)) {
      imports.add(match[1])
    }
    if (imports.size > 0) graph[file.path] = [...imports]
  }
  return graph
}

export function pickSourceSample(root, files, maxChars = 40000) {
  const codeFiles = files
    .filter((f) => CODE_EXTENSIONS.has(extname(f.path)) || f.path.endsWith('.md'))
    .sort((a, b) => a.path.localeCompare(b.path))

  let budget = maxChars
  const sample = []
  for (const file of codeFiles) {
    if (budget <= 0) break
    const content = readFileSync(join(root, file.path), 'utf8')
    const chunk = content.slice(0, Math.min(content.length, budget))
    sample.push(`--- ${file.path} ---\n${chunk}`)
    budget -= chunk.length
  }
  return sample.join('\n\n')
}
```


### `docs/how-it-works/architecture.md`

```md
# Architecture

## Source Files


### `docs/h
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
