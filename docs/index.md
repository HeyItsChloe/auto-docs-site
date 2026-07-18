---
title: auto-docs-site
---

<p class="bb-breadcrumb">Documentation</p>

# <span class="bb-accent">auto</span>-docs-site

<p class="bb-hero-desc">A GitHub Actions pipeline that keeps a live VitePress docs site up to date on its own — codebase overview, changelog, and full site structure generated fresh on every merge to <code>main</code> or on a weekly schedule.</p>

<div class="bb-card-grid">
  <a href="/setup/quick-setup" class="bb-card">
    <div class="bb-card-icon bb-icon-blue">🚀</div>
    <div class="bb-card-title">Quick Setup</div>
    <div class="bb-card-desc">Enable GitHub Pages, set two repo variables, and trigger your first generation in under five minutes.</div>
  </a>
  <a href="/configuration/trigger-modes" class="bb-card">
    <div class="bb-card-icon bb-icon-green">⚙️</div>
    <div class="bb-card-title">Configuration</div>
    <div class="bb-card-desc">Choose between on-merge and weekly trigger modes, switch engines, and manage secrets and variables.</div>
  </a>
  <a href="/how-it-works/architecture" class="bb-card">
    <div class="bb-card-icon bb-icon-purple">🏗️</div>
    <div class="bb-card-title">How It Works</div>
    <div class="bb-card-desc">Workflow → generation scripts → VitePress build → GitHub Pages. Walk through every component.</div>
  </a>
  <a href="/codebase-overview" class="bb-card">
    <div class="bb-card-icon bb-icon-orange">📁</div>
    <div class="bb-card-title">Reference</div>
    <div class="bb-card-desc">Auto-generated codebase overview and running changelog, regenerated on every run.</div>
  </a>
</div>

<div class="bb-quick-start">

## Quick Start

Fork this repo, enable GitHub Pages, then trigger the workflow — it handles everything else.

```sh
# Set the trigger mode
gh variable set DOCS_TRIGGER_MODE --body "on-merge"

# Optional: enable LLM generation (produces prose instead of raw file trees)
gh secret set ANTHROPIC_API_KEY --body "sk-ant-..."
gh variable set DOCS_ENGINE --body "llm"

# Trigger the first run
gh workflow run "Generate & deploy docs site"
```

<a href="/setup/quick-setup" class="bb-btn">Full Setup Guide →</a>

</div>
