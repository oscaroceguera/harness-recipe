# Layer 5 — Git hooks and commit messages

Local gates for humans and agents: commit-msg validates the message, pre-push runs `verify`.

## Audit

| Item | Report field | ✅ | ⚠️ | ❌ |
|------|--------------|----|----|----|
| Hooks folder | `harness.gitHooks.dir` + `files` | `commit-msg` and `pre-push` | one of them | none (and no husky/lefthook) |
| Git uses it | `harness.gitHooks.hooksPath` | `.githooks` | — | `null` while `.githooks/` exists (hooks never run; run `{{pm}} run prepare`) |
| `prepare` script | root `package.json` | sets `core.hooksPath` | — | absent (new clones get no hooks) |
| commitlint | `harness.commitlint` | true | `commitlint.config.js` with an anonymous `export default` (lint error, Node warning) | false |
| Commit guidance for the agent | `harness.skills` or user skills | `conventional-commits` (or `committing-with-commitlint`) available | — | none |
| Already on husky / lefthook | `.husky/` or `lefthook.yml` | keep it; audit its hooks instead | — | — |

## Generate

- `assets/templates/commitlint.config.mjs`, `.githooks/commit-msg`, `.githooks/pre-push`; `chmod +x .githooks/*`; add the `prepare` script (layer 1) and run it once.
- Keep the `.mjs` extension and the named `config` constant: `.js` with `export default` warns `MODULE_TYPELESS_PACKAGE_JSON` when `package.json` has no `"type": "module"`, and an anonymous default export fails `import/no-anonymous-default-export`.
- If the repo already uses husky or lefthook, do not add `.githooks/`: put the same two commands into the existing tool.
- Commit skill: recommend the user's `conventional-commits` skill. Do not copy the recipe's `committing-with-commitlint` unless the user asks.
- `.githooks/pre-push` keeps the human escape `SKIP_VERIFY=1`; `guard-commands.sh` blocks it for the agent.

## Prove it works

| Check | Expected |
|-------|----------|
| `echo "fixed stuff" \| {{pmx}} commitlint` | Fails |
| `echo "feat: add x" \| {{pmx}} commitlint` | Exit 0 |
| `git config core.hooksPath` | `.githooks` |
| Ask the agent to push with `SKIP_VERIFY=1` | Blocked by `guard-commands.sh` |
