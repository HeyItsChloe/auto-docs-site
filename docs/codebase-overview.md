# Codebase Overview

_Generated 2026-07-18T00:34:53.710Z · engine: `deterministic` · commit `279302a`_

## File tree

```
├── .github/
│   └── workflows/
│       └── docs-site.yml (2.5KB)
├── .gitignore (74B)
├── README.md (3.0KB)
├── docs/
│   ├── .vitepress/
│   │   ├── config.ts (832B)
│   │   └── theme/
│   │       ├── custom.css (868B)
│   │       └── index.ts (94B)
│   ├── changelog.md (753B)
│   ├── codebase-overview.md (1.1KB)
│   └── index.md (1.6KB)
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

## Local import graph (2 files with local imports)

- `scripts/generate-changelog.mjs` → `./lib/git-log.mjs`, `./lib/claude.mjs`
- `scripts/generate-overview.mjs` → `./lib/repo-scan.mjs`, `./lib/git-log.mjs`, `./lib/claude.mjs`
