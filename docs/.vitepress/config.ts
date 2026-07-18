import { defineConfig } from 'vitepress'
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const configPath = join(__dirname, 'generated-config.json')
const g = existsSync(configPath) ? JSON.parse(readFileSync(configPath, 'utf8')) : {}

export default defineConfig({
  title: g.title ?? 'auto-docs-site',
  description: g.description ?? 'Auto-generated codebase documentation, kept live by GitHub Actions.',
  base: '/auto-docs-site/',
  cleanUrls: true,
  appearance: 'force-dark',
  themeConfig: {
    siteTitle: false,
    nav: g.nav ?? [
      { text: 'Codebase Overview', link: '/codebase-overview' },
      { text: 'Changelog', link: '/changelog' },
    ],
    sidebar: g.sidebar ?? [
      {
        text: 'Reference',
        items: [
          { text: 'Codebase Overview', link: '/codebase-overview' },
          { text: 'Changelog', link: '/changelog' },
        ],
      },
    ],
    socialLinks: [{ icon: 'github', link: 'https://github.com/HeyItsChloe/auto-docs-site' }],
    footer: {
      message: g.footer ?? 'Regenerated automatically on merge to main — powered by GitHub Actions.',
    },
  },
})
