#!/usr/bin/env bash
# Stop: run every project check before the agent may finish. Failures go back to the agent (exit 2).
# Without --force it only runs when the working tree has changes. `{{pm}} run check` passes --force.
# Never reads stdin: the Stop hook has no TTY, and a blocking read hangs the session.
cd "${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel)}" || exit 0

if [ "$1" != "--force" ] && [ -z "$(git status --porcelain)" ]; then
  exit 0
fi

scripts="{{typecheckScript}} lint format:check test knip dupes"
failed=()
for script in $scripts; do
  if ! out=$({{run}} "$script" 2>&1); then
    failed+=("$script")
    printf '\n=== %s failed ===\n%s\n' "$script" "$(tail -n 40 <<<"$out")" >&2
  fi
done

if [ ${#failed[@]} -gt 0 ]; then
  echo "Checks failed: ${failed[*]}. Fix them before finishing." >&2
  exit 2
fi
[ -t 1 ] && echo "All checks passed: $scripts"
exit 0
