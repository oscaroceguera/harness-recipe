# AGENTS.md

Shared project guidance for coding agents (Claude Code, Cursor, and others). Keep this file under ~200 lines: everything in it is paid for on every request.

## Project

{{projectSummary}}  <!-- one line: framework + versions, topology, what the app does -->

## Commands

```bash
{{pm}} run dev        # dev server at http://localhost:{{port}}
{{pm}} run build
{{pm}} run lint       # eslint --max-warnings 0
{{pm}} test           # unit tests
{{pm}} run test:e2e   # end-to-end tests (Playwright)
{{pm}} run check      # typecheck, lint, format, unit tests, knip, dupes
{{pm}} run verify     # check + e2e (used by pre-push)

# Single file / single test
{{pmx}} vitest run <file>
{{pmx}} vitest run -t "test name substring"
{{pmx}} playwright test tests/x/y.spec.ts
```

{{layoutFacts}}  <!-- 2-4 lines: where entry points live, import alias, where tests sit -->

## Rules

{{rulesIndex}}  <!-- one line per rule: name, what it covers, when it loads; mention both .claude/rules and .cursor/rules mirrors -->

## Commits

{{commitInstruction}}  <!-- e.g. "Before every commit, use the `conventional-commits` skill." -->

## Context

- When you need the full output of a long run (whole test suite, e2e, logs, broad code search), do it in a subagent and bring back only the failures and a summary.
- Prefer facts in this file (or path-scoped rules) over repeating them in chat. Limits belong in deny rules / hooks; checks belong in hooks, lint, or tests.
