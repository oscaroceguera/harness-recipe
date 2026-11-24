#!/usr/bin/env bash
# PostToolUse(Edit|Write) / afterFileEdit: format the edited file, then lint it. Lint errors go back to the agent (exit 2).
cd "${CLAUDE_PROJECT_DIR:-${CURSOR_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}}" || exit 0
file=$(jq -r '.tool_input.file_path // .file_path // empty')
[ -z "$file" ] || [ ! -f "$file" ] && exit 0

case "$file" in
  "$PWD"/*) rel=${file#"$PWD"/} ;;
  /*) exit 0 ;;   # outside the project
  *) rel=$file ;;
esac
case "$rel" in node_modules/*|.next/*|dist/*|.agents/*|.claude/*) exit 0 ;; esac

case "$rel" in
  *.ts|*.tsx|*.js|*.jsx|*.mjs|*.mts|*.cjs|*.json|*.css|*.md|*.yml|*.yaml)
    {{pmx}} prettier --write --ignore-unknown --log-level warn "$rel" >/dev/null 2>&1 ;;
esac

case "$rel" in
  *.ts|*.tsx|*.js|*.jsx|*.mjs|*.mts|*.cjs)
    if ! out=$({{run}} lint:file "$rel" 2>&1); then
      echo "ESLint errors in $rel:" >&2
      echo "$out" >&2
      exit 2
    fi ;;
esac
exit 0
