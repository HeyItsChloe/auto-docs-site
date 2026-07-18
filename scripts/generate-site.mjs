/**
 * Unified site generator.
 *
 * llm mode:
 *   1. Scan repo + read README
 *   2. Ask Claude for site structure JSON (nav, sidebar, pages, accent color)
 *   3. Write generated-config.json  →  drives VitePress nav/sidebar
 *   4. Write generated-tokens.css   →  drives per-site accent color
 *   5. Generate content for each non-reference page
 *   6. Generate codebase overview (prose)
 *   7. Update changelog (incremental, grouped)
 *
 * deterministic mode:
 *   1. Generate codebase overview (file tree + import graph)
 *   2. Update changelog (incremental, raw commits)
 *   Does NOT touch generated-config.json, generated-tokens.css, or other pages.
 */

import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import {
  walkRepo,
  buildTree,
  renderTree,
  buildImportGraph,
  pickSourceSample,
} from './lib/repo-scan.mjs'
import { commitsSince, currentSha } from './lib/git-log.mjs'
import { callClaude, parseEngineArg } from './lib/claude.mjs'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const root = join(scriptDir, '..')
const docsDir = join(root, 'docs')
const viteDir = join(docsDir, '.vitepress')
const generatedConfigPath = join(viteDir, 'generated-config.json')
const generatedTokensPath = join(viteDir, 'theme', 'generated-tokens.css')
const statePath = join(scriptDir, '.last-sha.json')
const changelogPath = join(docsDir, 'changelog.md')
const overviewPath = join(docsDir, 'codebase-overview.md')

const CHANGELOG_HEADING = '# Changelog\n'

async function run() {
  const engine = parseEngineArg()
  const files = walkRepo(root)
  const sha = currentSha(root)

  console.log(`engine=${engine}  files=${files.length}  sha=${sha.slice(0, 7)}`)

  if (engine === 'llm') {
    await runLlm(files, sha)
  } else {
    await runDeterministic(files, sha)
  }
}

// ── LLM mode ──────────────────────────────────────────────────────────────

async function runLlm(files, sha) {
  const sample = pickSourceSample(root, files)
  const readmePath = join(root, 'README.md')
  const readme = existsSync(readmePath) ? readFileSync(readmePath, 'utf8') : ''

  // Phase 1: site structure
  console.log('Generating site structure…')
  const structure = await generateStructure(sample, readme)

  // Phase 2: generated-config.json
  writeFileSync(
    generatedConfigPath,
    JSON.stringify(
      {
        title: structure.title,
        description: structure.description,
        footer: structure.footer,
        nav: structure.nav,
        sidebar: structure.sidebar,
      },
      null,
      2,
    ) + '\n',
  )
  console.log('Wrote generated-config.json')

  // Phase 3: generated-tokens.css
  writeTokens(structure.accentColor || '#5169dd', structure.accentColorHover || '#4257c4')
  console.log('Wrote generated-tokens.css')

  // Phase 4: page content
  const contentPages = (structure.pages || []).filter(
    (p) => p.path !== 'changelog.md' && p.path !== 'codebase-overview.md',
  )

  for (const page of contentPages) {
    console.log(`Generating ${page.path}…`)
    const content = await generatePageContent(page, sample, readme, structure)
    const fullPath = join(docsDir, page.path)
    mkdirSync(dirname(fullPath), { recursive: true })
    const fm = page.path === 'index.md' ? `---\ntitle: ${structure.title}\n---\n\n` : ''
    writeFileSync(fullPath, `${fm}# ${page.title}\n\n${content.trim()}\n`)
  }

  // Phase 5: codebase overview
  console.log('Generating codebase overview…')
  const overviewBody = await callClaude({
    system:
      'You are a senior engineer writing a concise, accurate architecture overview for a docs site. Only describe what is actually present in the source — never invent files or behavior. Use markdown with ## headings. Cover: purpose, key modules/files and what each does, notable patterns.',
    prompt: `Write the architecture overview.\n\n${sample}`,
    maxTokens: 3000,
  })
  writeFileSync(
    overviewPath,
    `# Codebase Overview\n\n_Generated ${new Date().toISOString()} · engine: \`llm\` · commit \`${sha.slice(0, 7)}\`_\n\n${overviewBody.trim()}\n`,
  )

  // Phase 6: changelog
  await updateChangelog(sha, 'llm')

  console.log('LLM site generation complete.')
}

// ── Deterministic mode ────────────────────────────────────────────────────

async function runDeterministic(files, sha) {
  const tree = buildTree(files)
  const treeLines = renderTree(tree)
  const graph = buildImportGraph(root, files)
  const graphLines = Object.entries(graph)
    .slice(0, 60)
    .map(([f, imports]) => `- \`${f}\` → ${imports.map((i) => `\`${i}\``).join(', ')}`)

  const overviewBody = [
    '## File tree',
    '',
    '```',
    ...treeLines,
    '```',
    '',
    `## Local import graph (${Object.keys(graph).length} files with local imports)`,
    '',
    graphLines.length > 0 ? graphLines.join('\n') : '_No local imports detected._',
  ].join('\n')

  writeFileSync(
    overviewPath,
    `# Codebase Overview\n\n_Generated ${new Date().toISOString()} · engine: \`deterministic\` · commit \`${sha.slice(0, 7)}\`_\n\n${overviewBody}\n`,
  )
  console.log('Wrote codebase-overview.md')

  await updateChangelog(sha, 'deterministic')
  console.log('Deterministic generation complete.')
}

// ── Structure generation ──────────────────────────────────────────────────

async function generateStructure(sample, readme) {
  const response = await callClaude({
    system: 'You are a technical documentation architect. Return ONLY valid JSON — no markdown fences, no explanation.',
    prompt: `Design the information architecture for a documentation website.
Analyze the source code and README below, then return a JSON object with this exact shape:

{
  "title": "short project name",
  "description": "one sentence describing what this software does",
  "footer": "short footer note",
  "accentColor": "#hexcolor (vibrant on dark #0f1117 background)",
  "accentColorHover": "#hexcolor (slightly darker hover variant)",
  "nav": [{ "text": "Section Name", "link": "/first-page-in-section" }],
  "sidebar": [
    { "text": "Section Name", "items": [{ "text": "Page Title", "link": "/path/to/page" }] }
  ],
  "pages": [
    { "path": "relative/path.md", "title": "Page Title", "description": "2-3 sentences on what this page covers" }
  ]
}

Rules:
- 8–14 total pages across 3–5 sidebar sections
- 4–6 nav items, each linking to the first page of its section
- Links use clean URL paths — no .md extension, subdirectory format (e.g. /setup/quick-start)
- Home page is always path "index.md" and link "/"
- Always include "codebase-overview.md" (link "/codebase-overview") and "changelog.md" (link "/changelog") in a Reference section
- Accent color must be vibrant and readable on a #0f1117 dark background
- Page topics must be specific to THIS project — not generic template labels

README (first 3000 chars):
${readme.slice(0, 3000)}

Source files (first 8000 chars):
${sample.slice(0, 8000)}`,
    maxTokens: 3000,
  })

  const cleaned = response.replace(/^```(?:json)?\s*/m, '').replace(/\s*```\s*$/m, '').trim()
  try {
    return JSON.parse(cleaned)
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/)
    if (!match) {
      throw new Error(`Claude returned non-JSON structure response:\n${response.slice(0, 500)}`)
    }
    return JSON.parse(match[0])
  }
}

// ── Page content generation ───────────────────────────────────────────────

async function generatePageContent(page, sample, readme, structure) {
  return callClaude({
    system:
      'You are a technical writer creating a documentation page. Write accurate, specific markdown. Use ## and ### headings, code blocks, and tables where appropriate. Do NOT include a top-level # heading — it is added separately.',
    prompt: `Write the documentation page titled "${page.title}" for the "${structure.title}" docs site.

What this page covers: ${page.description}

Source code (first 6000 chars):
${sample.slice(0, 6000)}

README (first 2000 chars):
${readme.slice(0, 2000)}

Write the full page content. Start directly with the first ## heading or prose. Be specific and technical.`,
    maxTokens: 2500,
  })
}

// ── Changelog ────────────────────────────────────────────────────────────

async function updateChangelog(sha, engine) {
  const lastSha = existsSync(statePath)
    ? JSON.parse(readFileSync(statePath, 'utf8')).sha
    : null
  const commits = commitsSince(root, lastSha)

  if (commits.length === 0) {
    console.log('No new commits since last run — changelog unchanged.')
    writeFileSync(statePath, JSON.stringify({ sha }, null, 2) + '\n')
    return
  }

  let entryBody
  if (engine === 'deterministic') {
    entryBody = commits
      .map((c) => `- ${c.subject} (${c.author}, ${c.date}, \`${c.hash.slice(0, 7)}\`)`)
      .join('\n')
  } else {
    const raw = commits
      .map((c) => `${c.hash.slice(0, 7)} ${c.date} ${c.author}: ${c.subject}`)
      .join('\n')
    entryBody = await callClaude({
      system:
        "You write clean changelog entries from raw commit lists. Group under '### Added', '### Changed', '### Fixed' as appropriate. Omit empty groups. Never invent changes.",
      prompt: `Raw commits, most recent last:\n\n${raw}\n\nWrite the grouped changelog entry.`,
      maxTokens: 1500,
    })
  }

  const date = new Date().toISOString().slice(0, 10)
  const entry = `## ${date} — ${commits.length} commit${commits.length === 1 ? '' : 's'} (\`${sha.slice(0, 7)}\`)\n\n_engine: \`${engine}\`_\n\n${entryBody.trim()}\n`

  const existing = existsSync(changelogPath)
    ? readFileSync(changelogPath, 'utf8')
    : CHANGELOG_HEADING
  const afterHeading = existing.startsWith(CHANGELOG_HEADING)
    ? existing.slice(CHANGELOG_HEADING.length).trim()
    : existing.trim()
  const rest = afterHeading.startsWith('##') ? afterHeading : ''

  writeFileSync(
    changelogPath,
    `${CHANGELOG_HEADING}\n${entry}\n${rest}\n`.replace(/\n{3,}/g, '\n\n'),
  )
  writeFileSync(statePath, JSON.stringify({ sha }, null, 2) + '\n')
  console.log(`Updated changelog (${commits.length} new commits, engine=${engine})`)
}

// ── Token file ────────────────────────────────────────────────────────────

function writeTokens(accent, accentHover) {
  const soft = accent + '1a'
  const selection = accent + '4d'
  const shadow = hexToRgba(accent, 0.25)
  const light = lighten(accent, 0.15)

  writeFileSync(
    generatedTokensPath,
    `/* AUTO-GENERATED by scripts/generate-site.mjs — do not edit by hand */
:root,
.dark {
  --bb-accent:           ${accent};
  --bb-accent-hover:     ${accentHover};
  --bb-accent-soft:      ${soft};
  --bb-accent-light:     ${light};
  --bb-accent-selection: ${selection};
  --bb-accent-shadow:    ${shadow};

  --vp-c-brand-1:    ${accent};
  --vp-c-brand-2:    ${accent};
  --vp-c-brand-3:    ${accentHover};
  --vp-c-brand-soft: ${soft};
}
`,
  )
}

function hexToRgba(hex, alpha) {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function lighten(hex, amount) {
  const h = hex.replace('#', '')
  const r = Math.min(255, Math.round(parseInt(h.slice(0, 2), 16) * (1 + amount)))
  const g = Math.min(255, Math.round(parseInt(h.slice(2, 4), 16) * (1 + amount)))
  const b = Math.min(255, Math.round(parseInt(h.slice(4, 6), 16) * (1 + amount)))
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

run().catch((err) => {
  console.error(err.message)
  process.exit(1)
})
