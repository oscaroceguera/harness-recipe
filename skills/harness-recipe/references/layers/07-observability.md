# Layer 7 — Observability and improvement

When an agent fails, fix the harness, not the prompt: a missing **fact** → AGENTS.md / CLAUDE.md / rule; a missing **limit** → deny rule or Cursor `beforeReadFile`; a missing **check** → hook, lint rule or test. Then resend the same request.

## Audit

| Item | Report field | ✅ | ⚠️ | ❌ |
|------|--------------|----|----|----|
| Improvement loop | `harness.skills` includes `improve-harness` | yes | — | no |
| Review checklist | `FEATURE_REVIEW_CHECKLIST.md` at root | present | — | absent (optional; ⚠️ at most) |
| Context budget | root `AGENTS.md` (or `CLAUDE.md`) lines + always-on rules (no `paths` / `alwaysApply: true`) + MCP servers | small | large always-loaded set | — |
| Dual-agent drift | compare `.claude/rules` topics vs `harness.cursorRules` | mirrors in sync | Cursor missing mirrors | — |

## Generate

- Copy `assets/templates/dot-claude/skills/improve-harness/` (SKILL.md + `references/symptoms.md`) to `.claude/skills/improve-harness/`.
- Optional: `assets/templates/FEATURE_REVIEW_CHECKLIST.md` at the root.

## Prove it works

| Request | Expected |
|---------|----------|
| `/context` | Shows the always-loaded set; nothing unexpected |
| "Use improve-harness: the agent ignored rule X." | Skill collects, asks, proposes a fact/limit/check fix, then resends the original request |
