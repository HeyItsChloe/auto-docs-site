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
