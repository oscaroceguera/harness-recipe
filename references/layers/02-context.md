# Layer 2 — Context (CLAUDE.md and rules)

What the agent knows before it acts. Guidance, not enforcement. Keep root `CLAUDE.md` under ~200 lines: everything in it, and in rules without `paths`, is paid for on every request.

## Audit

| Item | Report field | ✅ | ⚠️ | ❌ |
|------|--------------|----|----|----|
| Root context file | `harness.claudeMd` / `harness.agentsMd` contains a root entry | present | only `AGENTS.md` (fine if `CLAUDE.md` imports it with `@AGENTS.md`) | none |
| Size | root file plus its `@` imports (imports do not reduce cost) | ≤ 200 lines | 200–300 | > 300 |
| Commands section | read root file | lists the real scripts with `{{pm}}` | mentions another package manager | no commands |
| Compact instructions | grep root file for `# Compact instructions` | present, says what to keep | — | absent (compaction may drop failing tests and decisions) |
| Procedures out of the always-loaded set | CLAUDE.md sections + rules without `paths` | multi-step procedures live in skills or path-scoped rules | a procedure (numbered steps, > ~20 lines) in CLAUDE.md or a rule without `paths` | — |
| Delegation line | read root file | says to run verbose work in a subagent | absent | — |
| Path-scoped rules | `harness.rules[].paths` | rules that apply to some files have `paths` | a rule without `paths` that only concerns some folder (loads every request) | — |
| Rule globs match the tree | compare each `paths` glob with `srcDir` / package paths | match real files | — | glob matches nothing (rule never loads) |
| Monorepo: per-package context | nested `CLAUDE.md` in `harness.claudeMd` | each app has one | some apps | none, and root file describes all apps |

## Generate

- **No root context file:** recommend the `create-agentsmd` skill if installed; otherwise fill `assets/templates/CLAUDE.md`. Fill `{{projectSummary}}`, `{{layoutFacts}}` from what you read, not from the recipe.
- **Existing file:** propose only the missing sections (Commands, Rules index, Commits) as a diff. Never rewrite the user's prose.
- **Context section and `# Compact instructions`:** add both from `assets/templates/CLAUDE.md` when missing. Adapt the keep list to the project (e.g. failing Playwright spec names on apps with e2e). The heading must be exactly `# Compact instructions`.
- **Over 200 lines:** move multi-step procedures to a skill and folder-only rules to `.claude/rules/` with `paths`. Do not split into `@` imports to save context; they load anyway. Notes for humans go in block HTML comments (`<!-- -->`), which are stripped before loading.
- **Rules** in `.claude/rules/`, each with `paths` frontmatter when it concerns only some files:
  - `tests.md` and `context7.md` from `assets/templates/dot-claude/rules/` (adjust `paths` globs).
  - The `feature-workflow` skill is optional and opinionated (works on `main`, TDD, Playwright). Offer it; do not install by default. Copy `assets/templates/dot-claude/skills/feature-workflow/` to `.claude/skills/feature-workflow/`. It is a skill, not a rule, so its steps load only when a feature starts.
  - A `.claude/rules/feature-workflow.md` from an earlier run loads on every request: propose moving it to `.claude/skills/feature-workflow/SKILL.md` with the template's frontmatter.
  - Do **not** copy the recipe's `structure.md` / `performance.md`. Write a `structure.md` from the folders that exist (one line per folder: what goes there), and only if the layout has real conventions.
- **Commits line:** point at the `conventional-commits` skill if installed, otherwise at commitlint (layer 5).

## Session habits (for the user, not the agent)

Slash commands are typed by the user; putting them in CLAUDE.md costs context and the agent cannot run them. The audit report carries them in its "Hábitos de sesión" section.

## Prove it works

| Request | Expected |
|---------|----------|
| New session, `/context` | Root `CLAUDE.md` loaded; path-scoped rules not loaded; memory files total stays small |
| Open a file matched by a rule's `paths`, then `/context` | That rule is now loaded |
| Work a little, `/compact`, then ask "what are we doing and what is failing?" | Answer keeps the items listed under `# Compact instructions` |
| `/doctor prompt-audit CLAUDE.md` | No stale or conflicting instructions |
