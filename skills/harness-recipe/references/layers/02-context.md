# Layer 2 — Context (AGENTS.md, CLAUDE.md, and rules)

What the agent knows before it acts. Guidance, not enforcement.

**Dual-agent layout:** shared facts in root `AGENTS.md`. Thin root `CLAUDE.md` = `@AGENTS.md` + Claude-only bits (`# Compact instructions`). Path-scoped guidance lives twice: `.claude/rules/*.md` (`paths:`) and `.cursor/rules/*.mdc` (`globs` / `alwaysApply`). Keep the always-loaded set under ~200 lines.

## Audit

Score every row against the Report and the files it names. One report table row per audit row.

| Item | Report / check | ✅ | ⚠️ | ❌ |
|------|----------------|----|----|----|
| Shared root context | `harness.agentsMd` has root `AGENTS.md` | present | only `CLAUDE.md` (Cursor won't share it unless mirrored) | neither `AGENTS.md` nor `CLAUDE.md` |
| Claude imports shared file | `harness.agentsImportedByClaude` | true (`@AGENTS.md` in root `CLAUDE.md`) | `AGENTS.md` exists but Claude does not import it | — |
| Root context for Claude | root `harness.claudeMd` or `harness.agentsMd` | present | only `AGENTS.md` (Claude falls back; Cursor is fine) | none |
| Size | root shared file + always-on rules | ≤ 200 lines | 200–300 | > 300 |
| Commands | shared root file | real scripts with `{{pm}}` | wrong package manager | no commands |
| Compact instructions | root `CLAUDE.md` has `# Compact instructions` | present, lists what to keep | — | absent when `CLAUDE.md` exists |
| Procedures out of always-loaded | AGENTS/CLAUDE + rules without `paths`/`globs`/`alwaysApply: true` | multi-step procedures in skills or path-scoped rules | numbered procedure > ~20 lines still always-loaded | — |
| Delegation | shared root file | says run verbose work in a subagent | absent | — |
| Path-scoped Claude rules | `harness.rules[].paths` | folder-specific rules have `paths` | folder-specific rule without `paths` (loads every request) | — |
| Cursor rule mirrors | `harness.cursorRules` | each Claude path-scoped / always-on rule has a matching `.mdc` | some mirrors missing | Claude rules exist and `cursorRules` is empty |
| Rule targeting matches tree | each Claude `paths` and Cursor `globs` vs `srcDir` / package paths | globs hit real files | — | any glob matches nothing |
| Monorepo: per-package context | nested `AGENTS.md` / `CLAUDE.md` | each app has nested context | some apps | none, and root file describes all apps |

## Generate

Do only the steps the audit marked ❌/⚠️. Show one combined diff, wait for yes, then write.

1. **Shared root** — If no `AGENTS.md`, fill `assets/templates/AGENTS.md` from the project (`{{projectSummary}}`, `{{layoutFacts}}`, real scripts). Prefer `create-agentsmd` when installed and compatible.
2. **Thin Claude bridge** — Ensure root `CLAUDE.md` has `@AGENTS.md` and `# Compact instructions` (exact heading). Do not duplicate Project/Commands into `CLAUDE.md`. Fat `CLAUDE.md` only: extract shared sections into `AGENTS.md`; never rewrite user prose without a diff. Adapt the Compact keep-list to the project (e.g. failing Playwright names when e2e exists).
3. **Budget** — If always-loaded > 200 lines, move multi-step procedures into a skill and folder-only guidance into path-scoped rules. Do not add extra `@` imports to save context (they still load). Human-only notes go in `<!-- -->`.
4. **Claude rules** — From `assets/templates/dot-claude/rules/`: `tests.md`, `context7.md` (adjust `paths`). Optional `feature-workflow` skill: offer, do not install by default; copy `assets/templates/dot-claude/skills/feature-workflow/` → `.claude/skills/feature-workflow/`. If `.claude/rules/feature-workflow.md` exists, propose moving it to that skill.
5. **Project-only structure rule** — Never copy the recipe's structure or performance rule files. Write a structure rule only from real folders (one line each), and only when the layout has real conventions.
6. **Cursor mirrors** — Same pass as Claude rules. From `assets/templates/dot-cursor/rules/`: `tests.mdc`, `context7.mdc` (`globs` ↔ `paths`; always-on Claude → `alwaysApply: true`). Every custom Claude rule gets its `.mdc` in this same step. Templates under `assets/templates/dot-cursor/` land in the project's `.cursor/`.
7. **Index + commits** — `{{rulesIndex}}`: one line per `.claude/rules/` and `.cursor/rules/` entry. Commits line: `conventional-commits` skill if installed, else commitlint (layer 5).

Done when the chosen ❌/⚠️ rows would score ✅, every written file is free of `{{`, and the user approved the diff.

## Session habits (for the user, not the agent)

Slash commands are typed by the user; putting them in AGENTS.md/CLAUDE.md costs context and the agent cannot run them. Put them only in the audit report's "Session habits" section.

## Prove it works

| Request | Expected |
|---------|----------|
| New Claude session, `/context` | Root `CLAUDE.md` (+ `@AGENTS.md`) loaded; path-scoped rules not; memory total stays small |
| Cursor: new Agent chat in the repo | `AGENTS.md` in context; `.cursor/rules` with `alwaysApply: true` loaded |
| Open a file matched by a rule's `paths`/`globs` | That rule loads (Claude `/context` or Cursor indicators) |
| After Claude `/compact`, ask "what are we doing and what is failing?" | Answer keeps `# Compact instructions` items |
| Claude `/doctor prompt-audit CLAUDE.md` | No stale or conflicting instructions |
