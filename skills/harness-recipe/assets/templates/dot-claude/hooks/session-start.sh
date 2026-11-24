#!/usr/bin/env bash
# SessionStart: print project state so the agent starts with facts, not guesses.
cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0

# 1. Git state
branch=$(git branch --show-current 2>/dev/null)
dirty=$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')
echo "git: branch ${branch:-detached}, ${dirty} changed file(s). Do not discard or overwrite them."

# 2. Dependencies
[ -d node_modules ] || echo "deps: node_modules missing (run: {{install}})"

# 3. Dev server port
if lsof -iTCP:{{port}} -sTCP:LISTEN >/dev/null 2>&1; then
  echo "dev: something is listening on :{{port}} (reuse it; do not start another {{pm}} run dev)"
else
  echo "dev: port {{port}} free (start with: {{pm}} run dev)"
fi

# 4. Node version vs .nvmrc
want=$(cat .nvmrc 2>/dev/null)
have=$(node -v 2>/dev/null | sed 's/^v//; s/\..*//')
if [ -n "$want" ] && [ "$have" != "$want" ]; then
  echo "node: v${have:-none} running, .nvmrc wants ${want} (run: nvm use)"
else
  echo "node: v${have:-none}"
fi
exit 0
