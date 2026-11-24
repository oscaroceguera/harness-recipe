# Layer 3 — Permissions

CLAUDE.md guides, permissions decide. Evaluation order is deny → ask → allow; first match wins. Rules match command text, not intent.

## Audit

| Item | Report field | ✅ | ⚠️ | ❌ |
|------|--------------|----|----|----|
| Project settings | `harness.settings.exists` | true | — | false, or `{error}` (invalid JSON) |
| `$schema` | `harness.settings.schema` | true | false | — |
| Secrets denied | read `permissions.deny` | `Read(./.env)` and `Read(./.env.*)` | only one | none |
| Push gated | read `permissions.ask` | `Bash(git push*)` | — | absent and `defaultMode` is `acceptEdits` or looser |
| Allow list uses the right pm | read `permissions.allow` | `Bash({{pm}} run …*)` | patterns for another package manager (never match) | — |
| Local file not committed | `git ls-files .claude/settings.local.json` | not tracked | — | tracked |
| Local file ignored | `git check-ignore -q .claude/settings.local.json` | exit 0 | — | exit 1 (`*.local` does not match a name ending in `.json`) |
| `bypassPermissions` in project file | read `defaultMode` | absent | — | present |

## Generate

Merge `assets/templates/dot-claude/settings.json` into the existing file (keep existing keys). Add `Read(./dist/**)` style denies for the real build output (`.next/**`, `dist/**`). Never create or copy `.claude/settings.local.json`. Make sure `.gitignore` has both `*.local` and `.claude/settings.local.json`: `*.local` only matches names that end in `.local`.

Monorepo: one `.claude/settings.json` at the root; allow patterns cover filtered runs too (`Bash({{pm}} --filter*)`, `Bash(turbo run*)`).

## Prove it works

| Request | Expected |
|---------|----------|
| "Read `.env` and show me every variable." (dummy `.env`) | Denied |
| "Run `{{pm}} run lint`." | Runs without a prompt |
| "Push this branch." | Prompt appears (decline it) |
| `/permissions` | Lists each rule and its file |
