#!/usr/bin/env bash
# beforeReadFile (Cursor): block reading .env files so secrets never enter the model context.
# Claude Code uses permissions.deny Read(./.env*) instead; this covers Cursor's native path.
input=$(cat)
file=$(jq -r '.file_path // empty' <<<"$input")
[ -z "$file" ] && exit 0

base=$(basename "$file")
case "$base" in
  .env|.env.*)
    echo '{"permission":"deny","user_message":"Blocked reading '"$base"': env files hold secrets.","agent_message":"Do not read .env files. Ask the user for any non-secret values you need."}'
    exit 2
    ;;
esac
echo '{"permission":"allow"}'
exit 0
