import { execFileSync } from 'node:child_process'

export function currentSha(root) {
  return execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root }).toString().trim()
}

export function commitsSince(root, sinceSha) {
  const range = sinceSha ? `${sinceSha}..HEAD` : 'HEAD'
  const format = '%H%x1f%ad%x1f%an%x1f%s'
  const out = execFileSync(
    'git',
    ['log', range, `--pretty=format:${format}`, '--date=short'],
    { cwd: root },
  )
    .toString()
    .trim()

  if (!out) return []

  return out.split('\n').map((line) => {
    const [hash, date, author, subject] = line.split('\x1f')
    return { hash, date, author, subject }
  })
}
