---
name: improve-harness
description: Use at the end of a feature, or when a hook, rule or skill did not work as expected, to find harness problems from this session and fix the ones the user approves.
---

# Improve the harness

## 1. Collect

Find harness problems in this session from three sources:

- Symptoms: read `references/symptoms.md` and note every symptom that happened in this session, for example a hook that did not run or an instruction that was ignored.
- User requests: everything the user corrected in chat or asked to fix in the harness.
- Code review findings that a lint rule or a project rule could have caught.

Do not write a log; the session already holds these signals.
Keep only problems likely to repeat in the next feature. Drop one-offs and matters of taste.

## 2. Ask

Sort by how often the problem repeated in this session, broken harness before missing rules.
Ask about four at most, in one `AskUserQuestion` call.
List the rest in one line each under "Not fixed this time".

Each problem is one question. The question text is one to three connected
sentences: what happened, where, and why the harness missed it.

- One sensible fix: the options are "Fix", with a short description of what will change, and "Skip".
- Several fixes: each fix is its own option with a short description, the recommended one first, plus "Skip".

Change nothing without the user's answer.

## 3. Fix

For each approved fix, pick the case:

- Harness is broken (a symptom from `references/symptoms.md`): check the causes listed under that symptom one by one and fix the one you confirm.
- Harness lacked a rule: put it in `eslint.config.mjs` if a machine can check it, in matching files under `.claude/rules/` and `.cursor/rules/` if it applies to one folder, in `AGENTS.md` only if it applies to the whole project.

## 4. Hard rules

- One minimal fix per problem.
- Never weaken a check: no turning rules off, no `warn` instead of `error`, no `ignores`, no higher timeouts.
- Extend an existing rule before adding a new one.
- Keep `AGENTS.md` (and the always-loaded set) under 200 lines; keep `CLAUDE.md` thin with `@AGENTS.md`.

## 5. Prove

Prove each fix: pipe a fake event into the hook, or run lint on a bad snippet. Commit the changes and show the user a short summary of what was fixed.
