# Codebase Overview

_Generated 2026-07-18T01:34:03.259Z · engine: `deterministic` · commit `0b517f9`_

## File tree

```
├── .github/
│   └── workflows/
│       └── docs-site.yml (2.5KB)
├── .gitignore (74B)
├── README.md (3.0KB)
├── docs/
│   ├── .vitepress/
│   │   ├── config.ts (906B)
│   │   └── theme/
│   │       ├── Layout.vue (254B)
│   │       ├── NavLogo.vue (213B)
│   │       ├── custom.css (14.0KB)
│   │       └── index.ts (154B)
│   ├── changelog.md (1.4KB)
│   ├── codebase-overview.md (1.1KB)
│   └── index.md (1.3KB)
├── package-lock.json (86.0KB)
├── package.json (404B)
└── scripts/
    ├── .last-sha.json (56B)
    ├── generate-changelog.mjs (2.5KB)
    ├── generate-overview.mjs (2.3KB)
    └── lib/
        ├── claude.mjs (1.3KB)
        ├── git-log.mjs (650B)
        └── repo-scan.mjs (2.8KB)
```

## Local import graph (3 files with local imports)

- `docs/.vitepress/theme/index.ts` → `./Layout.vue`
- `scripts/generate-changelog.mjs` → `./lib/git-log.mjs`, `./lib/claude.mjs`
- `scripts/generate-overview.mjs` → `./lib/repo-scan.mjs`, `./lib/git-log.mjs`, `./lib/claude.mjs`
