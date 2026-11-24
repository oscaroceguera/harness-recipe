---
name: harness-recipe
description: >-
  Audits and generates a Claude Code + Cursor agent harness (AGENTS.md,
  CLAUDE.md, rules, permissions, hooks, git hooks, MCP tools, observability)
  for JS/TS projects. Use when setting up or improving agent tooling, auditing
  what a project's harness is missing, generating permissions or hooks, making
  rules survive Claude↔Cursor switches, or working with Turborepo, pnpm/npm/yarn/bun
  workspaces, or Module Federation.
license: MIT
compatibility: Requires Node.js 18+ to run the bundled detect.mjs scanner.
metadata:
  author: oscaroceguera
  version: "1.1.0"
model: sonnet
---

# Harness recipe

A harness is the environment around the agent, in 7 **layers**: sensors, context, permissions, hooks, git hooks, tools, observability. This skill fits the recipe to the project in front of you: it reads the project first, audits each layer, then generates what is missing, one layer at a time.

It targets **Claude Code and Cursor together**: shared facts in `AGENTS.md`, thin `CLAUDE.md` with `@AGENTS.md`, mirrored rules under `.claude/rules/` and `.cursor/rules/`, Claude hooks (imported by Cursor via Third-Party Imports) plus Cursor-native gaps such as `beforeReadFile`.

The guiding rule for every gap: a missing **fact** goes in AGENTS.md or a rule, a missing **limit** in a deny rule or Cursor read hook, a missing **check** in a hook, lint rule or test.

Paths below are relative to this skill's folder.

## 1. Analyze

Run the scan from the project root:

```bash
node <this-skill>/scripts/detect.mjs .
```

It prints the **Report** (JSON): package manager, topology, packages (framework, `srcDir`, port, scripts, Module Federation role), and the existing harness (Claude + Cursor). It reads files only.

Summarize the Report for the user in at most 10 lines: topology, package manager, each package with framework and port, and which harness pieces exist (including `AGENTS.md`, `.cursor/rules`, `.cursor/hooks.json`).

- `supported: false` → tell the user the `unsupportedReason` and stop. Offer only the parts that still apply (for example permissions and git hooks), clearly labeled.
- Topology unclear (for example a workspace with one package, or a federation role `unknown`) → ask the user one question before going on.

Done when the user has seen the summary and the topology is settled.

## 2. Audit

Load the topology reference that matches the Report:

| Report | Reference |
|--------|-----------|
| `topology: "single"` | `references/topologies/single-app.md` |
| `topology: "monorepo"` | `references/topologies/turborepo.md` |
| any package with `moduleFederation` | `references/topologies/module-federation.md` (in addition) |

Then, for each layer in order, load its file and evaluate every row of its `## Audit` table against the Report and the files it names:

1. `references/layers/01-sensors.md`
2. `references/layers/02-context.md`
3. `references/layers/03-permissions.md`
4. `references/layers/04-hooks.md`
5. `references/layers/05-git-hooks.md`
6. `references/layers/06-tools.md`
7. `references/layers/07-observability.md`

Fill `references/audit-report-template.md` in English: one table row per audit row, with ✅/⚠️/❌, why it matters, and the concrete fix. Add the topology rows. Order "Next step" by layer, ❌ first.

The audit is read-only: show the report in the conversation. Offer to save it as `docs/harness-audit.md`; write it only if the user says yes.

Done when every audit row of all 7 layers and the topology reference has a state.

## 3. Generate

Ask which layers to generate (default: every layer with ❌, in layer order). For each chosen layer:

1. Read its `## Generate` section and the templates it names in `assets/templates/`. Templates under `assets/templates/dot-claude/` go to the project's `.claude/`; templates under `assets/templates/dot-cursor/` go to the project's `.cursor/` (folders are renamed so `.gitignore` rules for those dirs and skill installers that skip dot-folders keep them).
2. Fill the placeholders (table below) and apply the topology reference's changes.
3. Show the user each file as a diff against what exists today. Merge into existing files (`settings.json`, `hooks.json`, `package.json`, `.gitignore`); keep the user's content.
4. Wait for a yes. Then write the files. Hooks and git hooks: `chmod +x`.
5. Run the layer's `## Prove it works` checks that can run from the shell, and report the output. List the ones that need a live Claude or Cursor session for the user to try.

Done with a layer when its checks ran and the user has the results. Then move to the next layer.

### Placeholders

| Placeholder | Fill with |
|-------------|-----------|
| `{{pm}}` | `packageManager` (`npm` if null) |
| `{{pmx}}` | npm → `npx --no-install`, pnpm → `pnpm exec`, yarn → `yarn`, bun → `bunx` |
| `{{install}}` | npm → `npm ci`, pnpm → `pnpm install --frozen-lockfile`, yarn → `yarn install --immutable`, bun → `bun install --frozen-lockfile` |
| `{{lockfile}}` | npm → `package-lock.json`, pnpm → `pnpm-lock.yaml`, yarn → `yarn.lock`, bun → `bun.lock` |
| `{{src}}` | `src/` when the package's `srcDir` is `src`, otherwise empty |
| `{{run}}` | npm → `npm run -s`, pnpm → `pnpm --silent run`, yarn → `yarn run`, bun → `bun run --silent` |
| `{{typecheckScript}}` | the package's `typecheckScript` (e.g. `typecheck` or `check-types`); when null, layer 1 adds a `typecheck` script |
| `{{port}}` | the package's `port`. When null, ask the user for the dev port; if there is no dev server, drop the whole port check in `session-start.sh` (its `if … fi` block) and skip Playwright |
| `{{projectSummary}}`, `{{layoutFacts}}`, `{{rulesIndex}}`, `{{commitInstruction}}` | written from what you read in the project |

Every generated file is free of `{{` when written: check with `grep -rn '{{' <files>`. Every generated shell script passes `bash -n <file>`.

## Hard rules

- Templates are adapted to the Report, never pasted as they are. A glob, path, port or package manager that does not match the project is a bug.
- Write files only in step 3, only after the user approves that layer's diff.
- Personal files stay personal: `.claude/settings.local.json` and `.env*` are never created, copied, or read.
- Project-specific rules (structure, performance) are written from the project's real folders, never copied from the recipe.
- When generating rules, write **both** `.claude/rules/*.md` and matching `.cursor/rules/*.mdc` in the same step so Claude ↔ Cursor switches keep the same guidance.
- Do not duplicate Claude PreToolUse/Stop hooks into `.cursor/hooks.json` while Cursor Third-Party Imports loads `.claude/settings.json` (double fire). Cursor `hooks.json` is for native gaps only.
- Reuse the user's skills: `create-agentsmd` for a missing CLAUDE.md/AGENTS.md, `conventional-commits` for commit messages.
- Outside the supported stacks (JS/TS; single, workspaces/Turborepo, Module Federation), say so plainly in the report.
