#!/usr/bin/env bash
# PreToolUse(Bash) / beforeShellExecution: block commands that skip checks, rewrite history, leak secrets or use the wrong package manager.
# Exit 2 + stderr reaches the agent; exit 0 lets the command run.
# Accepts Claude (.tool_input.command) and Cursor native (.command) stdin shapes.
raw=$(jq -r '.tool_input.command // .command // empty')
[ -z "$raw" ] && exit 0

# Match only what runs, not prose: drop heredoc bodies, then quoted -m/--message/--title/--body values.
# Otherwise `git commit -m "mention --no-verify"` or a PR body that quotes a blocked command is blocked.
heredoc=$'(^|[^<])<<-?[[:space:]]*[\"\']?([A-Za-z_][A-Za-z0-9_]*)'
code="" term=""
while IFS= read -r line; do
  if [ -n "$term" ]; then
    [[ "$line" =~ ^[[:space:]]*"$term"[[:space:]]*$ ]] && term=""
    continue
  fi
  code+="$line"$'\n'
  [[ "$line" =~ $heredoc ]] && term=${BASH_REMATCH[2]}
done <<<"$raw"
cmd=$(jq -Rrs --arg q "'" 'gsub("(?<f>(^|\\s)(-m|--message|--title|--body))(\\s+|=)(\"([^\"\\\\]|\\\\.)*\"|\($q)[^\($q)]*\($q))"; "\(.f) MSG")' <<<"$code")

block() { echo "Blocked by .claude/hooks/guard-commands.sh: $1" >&2; exit 2; }

case "{{pm}}" in
  npm) other='pnpm|pnpx|yarn|bun|bunx' ;;
  pnpm) other='npm|npx|yarn|bun|bunx' ;;
  yarn) other='npm|npx|pnpm|pnpx|bun|bunx' ;;
  bun) other='npm|npx|pnpm|pnpx|yarn' ;;
esac

grep -Eq 'git[[:space:]]+push.*(--force|[[:space:]]-f([[:space:]]|$))' <<<"$cmd" && block "no force push. Push normally or ask the user."
grep -Eq -- '--no-verify|SKIP_VERIFY=' <<<"$cmd" && block "do not skip git hooks. Fix what they report."
grep -Eq 'git[[:space:]]+reset[[:space:]]+--hard|git[[:space:]]+clean[[:space:]]+-[a-zA-Z]*f' <<<"$cmd" && block "destructive git command. Ask the user first."
grep -Eq "(^|[[:space:];&|(\"'])\\.env([.][a-zA-Z0-9_-]+)?([[:space:];&|)\"']|\$)" <<<"$cmd" && block ".env files hold secrets; do not read, print or source them."
grep -Eq "(^|[[:space:];&|(])($other)([[:space:]]|\$)" <<<"$cmd" && block "this project uses {{pm}} ({{run}} <script> / {{pmx}} <bin>)."
exit 0
