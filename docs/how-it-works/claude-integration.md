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
