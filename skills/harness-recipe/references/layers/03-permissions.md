# Layer 3 — Permissions

CLAUDE.md / AGENTS.md guide; permissions and hooks decide. Claude Code: evaluation order is deny → ask → allow; first match wins. Rules match command text, not intent. Cursor has no `settings.json` allow/ask/deny — enforce secrets and risky shell via hooks (layer 4), especially `beforeReadFile` for `.env`.

## Audit

| Item | Report field | ✅ | ⚠️ | ❌ |
|------|--------------|----|----|----|
| Project settings | `harness.settings.exists` | true | — | false, or `{error}` (invalid JSON) |
| `$schema` | `harness.settings.schema` | true | false | — |
| Secrets denied (Claude) | read `permissions.deny` | `Read(./.env)` and `Read(./.env.*)` | only one | none |
| Secrets denied (Cursor) | `harness.cursorHooks.events` includes `beforeReadFile` and deny-env script exists | present | Claude deny only (Cursor Agent can still read `.env` unless Third-Party hooks cover it) | neither Claude deny nor Cursor `beforeReadFile` |
| Push gated | read `permissions.ask` | `Bash(git push*)` | — | absent and `defaultMode` is `acceptEdits` or looser |
| Allow list uses the right pm | read `permissions.allow` | `Bash({{pm}} run …*)` | patterns for another package manager (never match) | — |
| Local file not committed | `git ls-files .claude/settings.local.json` | not tracked | — | tracked |
| Local file ignored | `git check-ignore -q .claude/settings.local.json` | exit 0 | — | exit 1 (`*.local` does not match a name ending in `.json`) |
| `bypassPermissions` in project file | read `defaultMode` | absent | — | present |

## Generate

Merge `assets/templates/dot-claude/settings.json` into the existing file (keep existing keys). Add `Read(./dist/**)` style denies for the real build output (`.next/**`, `dist/**`). Never create or copy `.claude/settings.local.json`. Make sure `.gitignore` has both `*.local` and `.claude/settings.local.json`: `*.local` only matches names that end in `.local`.

Also generate the Cursor secrets gate from layer 4 templates (`assets/templates/dot-cursor/hooks.json` + `assets/templates/dot-cursor/hooks/deny-env-read.sh`) when `beforeReadFile` is missing — same generate step, same user approval.

Monorepo: one `.claude/settings.json` at the root; allow patterns cover filtered runs too (`Bash({{pm}} --filter*)`, `Bash(turbo run*)`).

## Prove it works

| Request | Expected |
|---------|----------|
| Claude: "Read `.env` and show me every variable." (dummy `.env`) | Denied |
| Cursor Agent: same request with `beforeReadFile` hook installed | Denied (hook message) |
| "Run `{{pm}} run lint`." | Runs without a prompt |
| "Push this branch." | Prompt appears (decline it) |
| Claude `/permissions` | Lists each rule and its file |
