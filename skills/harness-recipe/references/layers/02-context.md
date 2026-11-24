# Layer 2 — Context (AGENTS.md, CLAUDE.md, and rules)

What the agent knows before it acts. Guidance, not enforcement.

**Dual-agent layout (Claude Code + Cursor):** put shared facts in root `AGENTS.md`. Keep root `CLAUDE.md` thin: `@AGENTS.md` plus Claude-only bits (`# Compact instructions`). Mirror path-scoped guidance as `.claude/rules/*.md` (`paths:`) and `.cursor/rules/*.mdc` (`globs` / `alwaysApply`). Cursor loads `AGENTS.md` and `.cursor/rules` natively; Claude Code loads `CLAUDE.md` (and thus `@AGENTS.md`) plus `.claude/rules`. Keep the always-loaded set under ~200 lines.

## Audit

| Item | Report field | ✅ | ⚠️ | ❌ |
|------|--------------|----|----|----|
| Shared root context | `harness.agentsMd` contains a root `AGENTS.md` | present | only `CLAUDE.md` (Cursor will not share that content unless mirrored) | none of `AGENTS.md` / `CLAUDE.md` |
| Claude imports shared file | `harness.agentsImportedByClaude` | true (`@AGENTS.md` in root `CLAUDE.md`) | `AGENTS.md` exists but Claude does not import it (two sources can drift) | — |
| Root context file (Claude) | `harness.claudeMd` / `harness.agentsMd` contains a root entry | present | only `AGENTS.md` (fine for Cursor; Claude Code falls back to it when no `CLAUDE.md`) | none |
| Size | root `AGENTS.md` (or `CLAUDE.md` if no AGENTS) plus always-on rules | ≤ 200 lines | 200–300 | > 300 |
| Commands section | read shared root file | lists the real scripts with `{{pm}}` | mentions another package manager | no commands |
| Compact instructions | grep root `CLAUDE.md` for `# Compact instructions` | present, says what to keep | — | absent when `CLAUDE.md` exists (compaction may drop failing tests and decisions) |
| Procedures out of the always-loaded set | AGENTS/CLAUDE sections + rules without `paths`/`globs`/`alwaysApply: true` | multi-step procedures live in skills or path-scoped rules | a procedure (numbered steps, > ~20 lines) in the always-loaded set | — |
| Delegation line | read shared root file | says to run verbose work in a subagent | absent | — |
| Path-scoped Claude rules | `harness.rules[].paths` | rules that apply to some files have `paths` | a rule without `paths` that only concerns some folder (loads every request) | — |
| Cursor rule mirrors | `harness.cursorRules` | each Claude path-scoped / always-on rule has a matching `.mdc` (same topic) | some mirrors missing | Claude rules exist and `cursorRules` is empty |
| Cursor globs match the tree | compare each `globs` entry with `srcDir` / package paths | match real files | — | glob matches nothing (rule never loads) |
| Rule globs match the tree | compare each Claude `paths` glob with `srcDir` / package paths | match real files | — | glob matches nothing (rule never loads) |
| Monorepo: per-package context | nested `AGENTS.md` / `CLAUDE.md` | each app has nested context | some apps | none, and root file describes all apps |

## Generate

- **No shared root context:** fill `assets/templates/AGENTS.md` first. Fill `{{projectSummary}}`, `{{layoutFacts}}` from what you read, not from the recipe. Prefer the `create-agentsmd` skill if installed and it produces a compatible file.
- **No / thin Claude file:** fill `assets/templates/CLAUDE.md` so it `@AGENTS.md` and includes `# Compact instructions`. Do not duplicate Project/Commands into `CLAUDE.md`.
- **Existing fat `CLAUDE.md` only:** propose extracting shared sections into `AGENTS.md`, leaving `@AGENTS.md` + Compact instructions in `CLAUDE.md`. Never rewrite the user's prose without a diff.
- **Context section and `# Compact instructions`:** add Compact instructions to `CLAUDE.md` when missing. Adapt the keep list to the project (e.g. failing Playwright spec names on apps with e2e). The heading must be exactly `# Compact instructions`.
- **Over 200 lines:** move multi-step procedures to a skill and folder-only rules to path-scoped rule files. Do not split into `@` imports to save context beyond the `AGENTS.md` bridge; other `@` imports still load. Notes for humans go in block HTML comments (`<!-- -->`), which are stripped before loading.
- **Claude rules** in `.claude/rules/`, each with `paths` frontmatter when it concerns only some files:
  - `tests.md` and `context7.md` from `assets/templates/dot-claude/rules/` (adjust `paths` globs).
  - The `feature-workflow` skill is optional and opinionated (works on `main`, TDD, Playwright). Offer it; do not install by default. Copy `assets/templates/dot-claude/skills/feature-workflow/` to `.claude/skills/feature-workflow/`. It is a skill, not a rule, so its steps load only when a feature starts.
  - A `.claude/rules/feature-workflow.md` from an earlier run loads on every request: propose moving it to `.claude/skills/feature-workflow/SKILL.md` with the template's frontmatter.
  - Do **not** copy the recipe's `structure.md` / `performance.md`. Write a `structure.md` from the folders that exist (one line per folder: what goes there), and only if the layout has real conventions.
- **Cursor rule mirrors** from `assets/templates/dot-cursor/rules/` into `.cursor/rules/` (templates under `assets/templates/dot-cursor/` go to the project's `.cursor/`):
  - `tests.mdc` and `context7.mdc` — same body as the Claude rules; `globs` mirrors `paths`; always-on Claude rules use `alwaysApply: true`.
  - When you write a custom Claude rule, write the matching `.mdc` in the same generate step so Claude ↔ Cursor switches keep the same guidance.
- **`{{rulesIndex}}`:** list both `.claude/rules/` and `.cursor/rules/` entries (one line each: name, what it covers, when it loads).
- **Commits line:** point at the `conventional-commits` skill if installed, otherwise at commitlint (layer 5).

## Session habits (for the user, not the agent)

Slash commands are typed by the user; putting them in AGENTS.md/CLAUDE.md costs context and the agent cannot run them. The audit report carries them in its "Session habits" section.

## Prove it works

| Request | Expected |
|---------|----------|
| New Claude session, `/context` | Root `CLAUDE.md` (+ `@AGENTS.md`) loaded; path-scoped Claude rules not loaded; memory files total stays small |
| Cursor: new Agent chat in the repo | `AGENTS.md` present in context; `.cursor/rules` with `alwaysApply: true` loaded |
| Open a file matched by a rule's `paths`/`globs`, then check loaded rules | That rule is now loaded (Claude `/context` or Cursor rule indicators) |
| Work a little, Claude `/compact`, then ask "what are we doing and what is failing?" | Answer keeps the items listed under `# Compact instructions` |
| Claude `/doctor prompt-audit CLAUDE.md` | No stale or conflicting instructions |
