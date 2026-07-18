import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'auto-docs-site',
  description: 'Auto-generated codebase overview and changelog, kept live by GitHub Actions.',
  base: '/auto-docs-site/',
  cleanUrls: true,
  themeConfig: {
    nav: [
      { text: 'Overview', link: '/codebase-overview' },
      { text: 'Changelog', link: '/changelog' },
    ],
    sidebar: [
      {
        text: 'Docs',
        items: [
          { text: 'Overview', link: '/codebase-overview' },
          { text: 'Changelog', link: '/changelog' },
        ],
      },
    ],
    socialLinks: [{ icon: 'github', link: 'https://github.com/HeyItsChloe/auto-docs-site' }],
    footer: {
      message: 'Regenerated automatically on merge to main or weekly — see the workflow for the trigger currently in use.',
    },
  },
})
