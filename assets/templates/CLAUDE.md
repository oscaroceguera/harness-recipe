# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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

## Rules in `.claude/rules/`

{{rulesIndex}}  <!-- one line per rule file: name, what it covers, when it loads -->

## Commits

{{commitInstruction}}  <!-- e.g. "Before every commit, use the `conventional-commits` skill." -->

## Context

- When you need the full output of a long run (whole test suite, e2e, logs, broad code search), do it in a subagent and bring back only the failures and a summary.

# Compact instructions

When compacting, keep: the current task and its acceptance criteria, files changed and why, failing test names with their first error line, and decisions the user made. Drop: output of checks that passed, file contents that can be re-read, and exploration that led nowhere.
