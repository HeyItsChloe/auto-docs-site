# Repo Scanner

`scripts/lib/repo-scan.mjs` provides the file discovery and source analysis functions used by the overview generator and the site structure generator.

## walkRepo(root)

Recursively walks the directory tree from `root`, skipping ignored directories, and returns an array of `{ path, size }` objects. `path` is relative to `root`. `size` is the file size in bytes from `fs.statSync`.

**Ignored directories:**

```js
const IGNORED_DIRS = new Set([
  'node_modules', '.git', 'dist', 'cache',
  '.vitepress/dist', '.vitepress/cache',
])
```

## buildTree(files) + renderTree(node)

`buildTree` converts the flat file array into a nested object where directory names are object keys and file entries hold their byte size. `renderTree` converts that tree into printable lines using Unicode box-drawing characters:

```
├── scripts/
│   ├── generate-site.mjs (3.8KB)
│   └── lib/
│       ├── claude.mjs (1.2KB)
│       ├── git-log.mjs (0.8KB)
│       └── repo-scan.mjs (2.3KB)
└── docs/
    └── index.md (1.1KB)
```

File sizes are formatted as bytes (`B`) below 1 KB and as kilobytes (`KB`) above.

## buildImportGraph(root, files)

Scans all files with code extensions (`.ts`, `.tsx`, `.js`, `.jsx`, `.mjs`, `.cjs`) for local import and require statements using a single regex:

```js
const LOCAL_IMPORT_RE = /(?:import\s+.*?from\s+|require\()\s*['"](\.[^'"]+)['"]/g
```

Only relative paths (starting with `.`) are captured — npm package imports are excluded. Returns an object mapping each file path to its array of local import strings.

The deterministic overview generator shows the first 60 entries.

## pickSourceSample(root, files, maxChars)

Used by the LLM engine to build the source sample sent to Claude. Selects code and markdown files, sorts them alphabetically, and reads each until the character budget is exhausted (`maxChars` defaults to 40,000). Each file is prefixed with its path:

```
--- scripts/lib/claude.mjs ---
[file content]

--- scripts/lib/git-log.mjs ---
[file content]
```

Alphabetical ordering means files starting with letters early in the alphabet are prioritized. The 40,000 character cap keeps API costs predictable regardless of repo size.
