# Codebase Overview

_Generated 2026-07-18T00:22:12.998Z · engine: `deterministic` · commit `d94e73f`_

## File tree

```
├── .github/
│   └── workflows/
│       └── docs-site.yml (2.5KB)
├── .gitignore (74B)
├── README.md (3.0KB)
├── docs/
│   ├── .vitepress/
│   │   ├── config.ts (804B)
│   │   └── theme/
│   │       ├── custom.css (868B)
│   │       └── index.ts (94B)
│   ├── changelog.md (528B)
│   ├── codebase-overview.md (536B)
│   └── index.md (1.6KB)
├── package-lock.json (86.0KB)
├── package.json (404B)
└── scripts/
    ├── generate-changelog.mjs (2.3KB)
    ├── generate-overview.mjs (2.3KB)
    └── lib/
        ├── claude.mjs (1.3KB)
        ├── git-log.mjs (650B)
        └── repo-scan.mjs (2.8KB)
```

## Local import graph (2 files with local imports)

- `scripts/generate-changelog.mjs` → `./lib/git-log.mjs`, `./lib/claude.mjs`
- `scripts/generate-overview.mjs` → `./lib/repo-scan.mjs`, `./lib/git-log.mjs`, `./lib/claude.mjs`
