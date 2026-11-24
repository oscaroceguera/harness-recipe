#!/usr/bin/env bash
# PreToolUse(Bash): keep only the last 100 lines of a test run, so a long suite does not fill the context.
# pipefail keeps the test's exit code; without it a failing run looks green.
# Simple commands only: anything with ; & | < > ` $ is left as it is. `run check` already trims its own output.
input=$(cat)
cmd=$(jq -r '.tool_input.command // .command // empty' <<<"$input")
pattern='^({{pm}} (run )?(test|test:e2e|verify)|{{pmx}} (vitest|playwright test))( [^;&|<>`$#\\]*)?$'
if [[ "$cmd" =~ $pattern ]]; then
  jq -c --arg c "set -o pipefail; $cmd 2>&1 | tail -n 100" \
    '{hookSpecificOutput: {hookEventName: "PreToolUse", updatedInput: (.tool_input + {command: $c})}}' <<<"$input"
else
  echo '{}'
fi
