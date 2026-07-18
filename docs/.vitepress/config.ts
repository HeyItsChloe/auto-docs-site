import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'auto-docs-site',
  description: 'Auto-generated codebase documentation, kept live by GitHub Actions.',
  base: '/auto-docs-site/',
  cleanUrls: true,
  appearance: 'force-dark',
  themeConfig: {
    siteTitle: false,
    nav: [
      { text: 'Overview', link: '/codebase-overview' },
      { text: 'Changelog', link: '/changelog' },
    ],
    sidebar: [
      {
        text: 'Getting Started',
        items: [
          { text: 'Introduction', link: '/' },
          { text: 'Codebase Overview', link: '/codebase-overview' },
          { text: 'Changelog', link: '/changelog' },
        ],
      },
    ],
    socialLinks: [{ icon: 'github', link: 'https://github.com/HeyItsChloe/auto-docs-site' }],
    footer: {
      message: 'Regenerated automatically on merge to main — powered by GitHub Actions.',
    },
  },
})
