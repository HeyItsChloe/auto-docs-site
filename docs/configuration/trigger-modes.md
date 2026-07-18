# Trigger Modes

The workflow registers two automatic triggers — a `push` event and a weekly `schedule` — but only one fires at a time, controlled by a repo variable. You switch behavior without editing any YAML.

## The three modes

| `DOCS_TRIGGER_MODE` | Push to `main` | Weekly schedule | Manual dispatch |
|---|---|---|---|
| `on-merge` | ✅ Runs | ❌ No-op | ✅ Always runs |
| `weekly` | ❌ No-op | ✅ Runs | ✅ Always runs |
| unset | ❌ No-op | ❌ No-op | ✅ Always runs |

Manual `workflow_dispatch` always works regardless of trigger mode — useful for testing, forced regeneration, or choosing a one-off engine without changing the default.

## How the gate works

The job's `if` condition checks the trigger source against the variable value:

```yaml
if: >
  github.event_name == 'workflow_dispatch' ||
  (github.event_name == 'push' && vars.DOCS_TRIGGER_MODE == 'on-merge') ||
  (github.event_name == 'schedule' && vars.DOCS_TRIGGER_MODE == 'weekly')
```

When the condition evaluates to false, the `generate-and-deploy` job is skipped entirely. The workflow run appears in the Actions tab but completes in seconds with no compute cost.

## Setting the variable

Under **Settings → Secrets and variables → Actions → Variables**:

```sh
gh variable set DOCS_TRIGGER_MODE --body "on-merge"
gh variable set DOCS_TRIGGER_MODE --body "weekly"
gh variable delete DOCS_TRIGGER_MODE   # disable automatic triggers
```

## Weekly schedule

The cron expression is `0 9 * * 1` — **Mondays at 9:00 AM UTC**. GitHub Actions cron jobs may fire a few minutes late during high-load periods. The schedule only activates when `DOCS_TRIGGER_MODE` is exactly `weekly`.

## Concurrency

The workflow uses `concurrency: { group: docs-site, cancel-in-progress: true }`. If a second run starts while a first is still in progress — two rapid pushes, for example — the older run is cancelled so only the latest commit generates docs. This also prevents two simultaneous runs from racing to push to `main` and clobbering each other's changelog state.
