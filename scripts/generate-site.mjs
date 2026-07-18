/**
 * Unified site generator — ALWAYS regenerates the full site on every run.
 *
 * llm mode:
 *   Asks Claude to design the site structure (nav, sidebar, page list, accent color)
 *   and write prose content for every page. Updates generated-config.json,
 *   generated-tokens.css, all .md files, codebase-overview.md, and changelog.md.
 *
 * deterministic mode:
 *   Reads the existing generated-config.json for structure (or derives a minimal
 *   default from the README). Regenerates every page from README sections and
 *   matching source files. Also regenerates codebase-overview.md and changelog.md.
 *   Does not need an API key. Does not add new pages/sections — that requires llm.
 *
 * Either way: every page reflects the current state of the repo after each run.
 */

import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { basename, dirname, extname, join } from 'node:path'
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
const CODE_EXTS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.py', '.go', '.rb', '.rs', '.java'])

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
// Asks Claude for site structure + prose content for every page.

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

  // Phase 3: accent color tokens
  writeTokens(structure.accentColor || '#5169dd', structure.accentColorHover || '#4257c4')
  console.log('Wrote generated-tokens.css')

  // Phase 4: generate content for every non-reference page
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
      'You are a senior engineer writing a concise, accurate architecture overview for a docs site. Only describe what is actually present — never invent files or behavior. Use markdown with ## headings. Cover: purpose, key modules/files and what each does, notable patterns.',
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
// No API key needed. Fully regenerates all pages from README + source files.

async function runDeterministic(files, sha) {
  const readmePath = join(root, 'README.md')
  const readme = existsSync(readmePath) ? readFileSync(readmePath, 'utf8') : ''
  const readmeSections = parseReadmeSections(readme)

  // Load existing structure; fall back to a README-derived default
  const config = existsSync(generatedConfigPath)
    ? JSON.parse(readFileSync(generatedConfigPath, 'utf8'))
    : buildDefaultConfig(readme)

  // Write generated-config.json if it didn't exist yet
  if (!existsSync(generatedConfigPath)) {
    writeFileSync(generatedConfigPath, JSON.stringify(config, null, 2) + '\n')
    console.log('Wrote generated-config.json (default)')
  }

  // Write generated-tokens.css if it didn't exist yet
  if (!existsSync(generatedTokensPath)) {
    writeTokens('#5169dd', '#4257c4')
    console.log('Wrote generated-tokens.css (default)')
  }

  // Collect all non-reference pages from the current config
  const allPageLinks = []
  for (const group of config.sidebar || []) {
    for (const item of group.items || []) {
      if (item.link !== '/codebase-overview' && item.link !== '/changelog') {
        allPageLinks.push({ link: item.link, title: item.text })
      }
    }
  }

  // Regenerate content for every non-reference page
  for (const page of allPageLinks) {
    const mdPath = linkToPath(page.link)
    console.log(`Regenerating ${mdPath}…`)

    const content = buildDeterministicPageContent(page, files, readmeSections, readme, config)
    const fullPath = join(docsDir, mdPath)
    mkdirSync(dirname(fullPath), { recursive: true })

    const fm = mdPath === 'index.md' ? `---\ntitle: ${config.title}\n---\n\n` : ''
    writeFileSync(fullPath, `${fm}# ${page.title}\n\n${content.trim()}\n`)
  }

  // Codebase overview (file tree + import graph)
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

// ── Deterministic content helpers ─────────────────────────────────────────

function buildDeterministicPageContent(page, files, readmeSections, readme, config) {
  const parts = []

  // Special case: home page gets a card grid matching the current nav
  if (page.link === '/') {
    return buildDeterministicHomePage(config, readme)
  }

  // 1. Find a matching README section by title similarity
  const readmeSection = findReadmeSection(readmeSections, page.title)
  if (readmeSection) {
    parts.push(readmeSection.content)
  }

  // 2. Find relevant source files by page keywords
  const relevant = findRelevantFiles(files, page.link, page.title)
  if (relevant.length > 0) {
    parts.push(`## Source Files\n`)
    for (const f of relevant.slice(0, 6)) {
      const fullPath = join(root, f.path)
      if (!existsSync(fullPath)) continue
      const src = readFileSync(fullPath, 'utf8')
      const lang = extname(f.path).slice(1) || 'text'
      parts.push(`### \`${f.path}\`\n\n\`\`\`${lang}\n${src.slice(0, 3000).trimEnd()}\n\`\`\`\n`)
    }
  }

  // 3. Fallback if nothing was found
  if (parts.length === 0) {
    parts.push(
      `_This page is generated mechanically from the repository source._\n` +
      `_Run with \`--engine=llm\` to generate detailed prose documentation._\n`,
    )
  }

  return parts.join('\n\n')
}

function buildDeterministicHomePage(config, readme) {
  // Derive the hero description from the README first non-heading line
  const heroDesc =
    readme.match(/^#[^\n]*\n+([^\n#][^\n]+)/m)?.[1]?.trim() ||
    config.description ||
    `Documentation for ${config.title}.`

  // Build card grid from nav (skip home entry itself)
  const navCards = (config.nav || [])
    .filter((n) => n.link !== '/')
    .map((n) => {
      const icon = navIcon(n.text)
      const desc = navDescription(n.text, config)
      return (
        `  <a href="${n.link}" class="bb-card">\n` +
        `    <div class="bb-card-icon bb-icon-blue">${icon}</div>\n` +
        `    <div class="bb-card-title">${n.text}</div>\n` +
        `    <div class="bb-card-desc">${desc}</div>\n` +
        `  </a>`
      )
    })
    .join('\n')

  return (
    `<p class="bb-breadcrumb">Documentation</p>\n\n` +
    `# <span class="bb-accent">${config.title}</span>\n\n` +
    `<p class="bb-hero-desc">${heroDesc}</p>\n\n` +
    `<div class="bb-card-grid">\n${navCards}\n</div>\n`
  )
}

function navIcon(sectionText) {
  const t = sectionText.toLowerCase()
  if (t.includes('start') || t.includes('setup') || t.includes('install')) return '🚀'
  if (t.includes('api') || t.includes('reference') || t.includes('ref')) return '📖'
  if (t.includes('config') || t.includes('setting')) return '⚙️'
  if (t.includes('guide') || t.includes('how') || t.includes('arch')) return '🏗️'
  if (t.includes('deploy') || t.includes('ci') || t.includes('cd')) return '🔄'
  if (t.includes('test')) return '🧪'
  if (t.includes('changelog') || t.includes('change') || t.includes('release')) return '📋'
  if (t.includes('model') || t.includes('schema') || t.includes('data')) return '🗄️'
  return '📁'
}

function navDescription(sectionText, config) {
  const t = sectionText.toLowerCase()
  const title = config.title || 'this project'
  if (t.includes('start') || t.includes('setup')) return `Get ${title} running quickly.`
  if (t.includes('api')) return 'Endpoints, request formats, and response schemas.'
  if (t.includes('config')) return 'Configuration options, environment variables, and settings.'
  if (t.includes('arch') || t.includes('how')) return 'How the components fit together.'
  if (t.includes('deploy') || t.includes('ci')) return 'Build, test, and deployment pipeline.'
  if (t.includes('reference')) return 'Auto-generated reference documentation.'
  return `${sectionText} documentation.`
}

function parseReadmeSections(readme) {
  if (!readme) return []
  const sections = []
  let currentTitle = null
  let buffer = []

  for (const line of readme.split('\n')) {
    const h2 = line.match(/^## (.+)/)
    if (h2) {
      if (currentTitle) sections.push({ title: currentTitle, content: buffer.join('\n').trim() })
      currentTitle = h2[1].trim()
      buffer = []
    } else if (currentTitle) {
      buffer.push(line)
    }
  }
  if (currentTitle) sections.push({ title: currentTitle, content: buffer.join('\n').trim() })
  return sections
}

function findReadmeSection(sections, pageTitle) {
  const keywords = pageTitle.toLowerCase().split(/\W+/).filter((k) => k.length > 3)
  return sections.find((s) => keywords.some((k) => s.title.toLowerCase().includes(k))) ?? null
}

function findRelevantFiles(files, link, title) {
  const segments = link.replace(/^\//, '').split('/')
  const keywords = [
    ...segments,
    ...title.toLowerCase().split(/\W+/).filter((k) => k.length > 3),
  ]

  return files
    .filter((f) => {
      const lf = f.path.toLowerCase()
      const isCode = CODE_EXTS.has(extname(f.path)) || f.path.endsWith('.md')
      return isCode && keywords.some((k) => lf.includes(k))
    })
    .sort((a, b) => a.size - b.size) // prefer smaller files (more likely to be focused)
}

function buildDefaultConfig(readme) {
  const repoName = basename(root)
  const desc =
    readme.match(/^#[^\n]*\n+([^\n#][^\n]+)/m)?.[1]?.trim() ||
    `Documentation for ${repoName}.`

  return {
    title: repoName,
    description: desc,
    footer: 'Auto-generated docs — run with --engine=llm for full site structure.',
    nav: [
      { text: 'Overview', link: '/' },
      { text: 'Reference', link: '/codebase-overview' },
    ],
    sidebar: [
      {
        text: 'Overview',
        items: [{ text: 'Introduction', link: '/' }],
      },
      {
        text: 'Reference',
        items: [
          { text: 'Codebase Overview', link: '/codebase-overview' },
          { text: 'Changelog', link: '/changelog' },
        ],
      },
    ],
  }
}

function linkToPath(link) {
  if (link === '/') return 'index.md'
  return link.replace(/^\//, '') + '.md'
}

// ── LLM structure generation ──────────────────────────────────────────────

async function generateStructure(sample, readme) {
  const response = await callClaude({
    system:
      'You are a technical documentation architect. Return ONLY valid JSON — no markdown fences, no explanation.',
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
    if (!match) throw new Error(`Claude returned non-JSON:\n${response.slice(0, 500)}`)
    return JSON.parse(match[0])
  }
}

async function generatePageContent(page, sample, readme, structure) {
  return callClaude({
    system:
      'You are a technical writer creating a docs page. Write accurate, specific markdown. Use ## and ### headings, code blocks, and tables where appropriate. Do NOT include a top-level # heading.',
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

// ── Token helpers ─────────────────────────────────────────────────────────

function writeTokens(accent, accentHover) {
  writeFileSync(
    generatedTokensPath,
    `/* AUTO-GENERATED by scripts/generate-site.mjs — do not edit by hand */
:root,
.dark {
  --bb-accent:           ${accent};
  --bb-accent-hover:     ${accentHover};
  --bb-accent-soft:      ${accent}1a;
  --bb-accent-light:     ${lighten(accent, 0.15)};
  --bb-accent-selection: ${accent}4d;
  --bb-accent-shadow:    ${hexToRgba(accent, 0.25)};

  --vp-c-brand-1:    ${accent};
  --vp-c-brand-2:    ${accent};
  --vp-c-brand-3:    ${accentHover};
  --vp-c-brand-soft: ${accent}1a;
}
`,
  )
}

function hexToRgba(hex, alpha) {
  const h = hex.replace('#', '')
  return `rgba(${parseInt(h.slice(0, 2), 16)}, ${parseInt(h.slice(2, 4), 16)}, ${parseInt(h.slice(4, 6), 16)}, ${alpha})`
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
