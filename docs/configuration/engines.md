# Generation Engines

Two engines exist for generating the codebase overview and changelog. You choose the default via a repo variable and can override it per-run via the `workflow_dispatch` input.

## Deterministic

No API key needed. The engine operates mechanically on the repo's files and git history.

**Overview output:** a directory tree rendered with Unicode box characters, followed by a local import graph — which files import which other local files.

**Changelog output:** a flat bullet list of commits with hash, date, author, and subject line.

Output is fully reproducible: the same repo state always produces the same output. Good for CI environments where you want zero API cost, or when you haven't added the Anthropic key yet.

## LLM

Sends representative source code to the Claude API and asks for written prose.

**Overview output:** a narrative architecture overview covering the project's purpose, key modules and what each does, and notable patterns or conventions. Claude is instructed to only describe what is actually in the source — not invent behavior.

**Changelog output:** commits grouped under `### Added`, `### Changed`, and `### Fixed` subheadings, written as human-readable entries rather than raw subject lines.

Requires `ANTHROPIC_API_KEY` as a repo secret. Uses `claude-sonnet-4-6` with up to 3,000 output tokens for the overview and 1,500 for the changelog.

## Choosing the default

Set `DOCS_ENGINE` under **Settings → Secrets and variables → Actions → Variables**:

```sh
gh variable set DOCS_ENGINE --body "llm"
gh variable set DOCS_ENGINE --body "deterministic"
```

If `DOCS_ENGINE` is unset the workflow defaults to `deterministic`.

## Overriding per-run

A manual `workflow_dispatch` run exposes an `engine` input dropdown:

| Input value | Effect |
|---|---|
| `repo-default` | Uses `DOCS_ENGINE` (or `deterministic` if unset) |
| `deterministic` | Forces deterministic for this run only |
| `llm` | Forces LLM for this run only |

This lets you trigger a one-off LLM generation without changing the repo default, or verify deterministic output without removing your API key.

## Engine resolution order

1. `workflow_dispatch` engine input (if not `repo-default`)
2. `DOCS_ENGINE` repo variable
3. Hardcoded fallback: `deterministic`
