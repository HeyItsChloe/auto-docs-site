# Codebase Overview

_Generated 2026-07-18T02:23:03.797Z · engine: `deterministic` · commit `d9ca86e`_

## File tree

```
├── .github/
│   └── workflows/
│       └── docs-site.yml (2.2KB)
├── .gitignore (74B)
├── README.md (3.8KB)
├── docs/
│   ├── .vitepress/
│   │   ├── config.ts (1.2KB)
│   │   ├── generated-config.json (1.8KB)
│   │   └── theme/
│   │       ├── Layout.vue (254B)
│   │       ├── NavLogo.vue (213B)
│   │       ├── custom.css (12.3KB)
│   │       ├── generated-tokens.css (546B)
│   │       └── index.ts (154B)
│   ├── changelog.md (1.9KB)
│   ├── codebase-overview.md (2.1KB)
│   ├── configuration/
│   │   ├── engines.md (8.0KB)
│   │   ├── secrets-variables.md (8.0KB)
│   │   └── trigger-modes.md (7.0KB)
│   ├── how-it-works/
│   │   ├── architecture.md (13.1KB)
│   │   ├── claude-integration.md (16.0KB)
│   │   ├── git-log.md (14.3KB)
│   │   ├── repo-scanner.md (15.7KB)
│   │   └── workflow.md (15.1KB)
│   ├── index.md (1.0KB)
│   └── setup/
│       ├── local-development.md (5.1KB)
│       └── quick-setup.md (5.0KB)
├── package-lock.json (86.0KB)
├── package.json (459B)
└── scripts/
    ├── .last-sha.json (56B)
    ├── generate-changelog.mjs (2.5KB)
    ├── generate-overview.mjs (2.3KB)
    ├── generate-site.mjs (19.8KB)
    └── lib/
        ├── claude.mjs (1.3KB)
        ├── git-log.mjs (650B)
        └── repo-scan.mjs (2.8KB)
```

## Local import graph (4 files with local imports)

- `docs/.vitepress/theme/index.ts` → `./Layout.vue`
- `scripts/generate-changelog.mjs` → `./lib/git-log.mjs`, `./lib/claude.mjs`
- `scripts/generate-overview.mjs` → `./lib/repo-scan.mjs`, `./lib/git-log.mjs`, `./lib/claude.mjs`
- `scripts/generate-site.mjs` → `./lib/git-log.mjs`, `./lib/claude.mjs`
