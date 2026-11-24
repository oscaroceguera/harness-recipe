# Layer 4 — Hooks (verification the agent cannot skip)

Hooks need `bash`, `jq`, `git`, `lsof`. Paths start with `"$CLAUDE_PROJECT_DIR"`. To block and reach the agent: message on stderr, exit 2 (exit 1 is invisible to the agent).

## Audit

| Item | Report field | ✅ | ⚠️ | ❌ |
|------|--------------|----|----|----|
| Hooks registered | `harness.settings.hooks` | `SessionStart`, `PreToolUse`, `PostToolUse`, `Stop` | some | none |
| Scripts executable | `harness.hooks[].executable` | all true | — | any false (hook never runs) |
| Scripts exist for each registered command | read `hooks` commands in settings vs `harness.hooks[].file` | match | — | a command points at a missing file |
| Stop hook scripts exist in `package.json` | the scripts `check-all.sh` calls (`typecheck`, `lint`, `format:check`, `test`, `knip`, `dupes`) vs layer 1 | all present | — | a called script is missing (Stop always red) |
| Stop hook never waits on stdin | grep `check-all.sh` for `cat`, `read`, `[ -t 0 ]` | none | — | reads stdin (the Stop hook has no TTY; the session hangs) |
| Stop hook skips a clean tree | read `check-all.sh` | exits 0 when `git status --porcelain` is empty, unless `--force` | — | runs every turn |
| Test output trimmed | `PreToolUse` `Bash` hooks in settings | `filter-test-output.sh` (or quiet reporters in the test scripts) | full test output reaches the agent | — |
| SessionStart matcher | read settings | includes `clear` | only `startup\|resume` | — |
| Package manager in scripts | grep hook files for `npm`/`pnpm`/`yarn` | matches `packageManager` | — | another pm |
| `jq` installed | `command -v jq` | found | — | missing |

## Generate

From `assets/templates/dot-claude/hooks/`: `session-start.sh`, `guard-commands.sh`, `filter-test-output.sh`, `format-lint-file.sh`, `check-all.sh`. Then `chmod +x .claude/hooks/*.sh`.

- `filter-test-output.sh`: drop from `pattern` the scripts the project does not have (`test:e2e`, `verify`, `playwright`).
- Remove names from the `scripts=` list in `check-all.sh` whose script the project does not have; say which ones in the diff.
- `{{port}}` in `session-start.sh` comes from the package's `port`; if `null`, drop check 3 (the dev-server block).
- Monorepo / Module Federation: see the topology reference — `check-all.sh` and `format-lint-file.sh` change.

`guard-commands.sh` matches patterns (`push --force`, `--no-verify`, `SKIP_VERIFY=`, `.env`, another package manager) in the command text. Before matching it drops heredoc bodies and the quoted values of `-m`, `--message`, `--title` and `--body`, so commit messages and PR bodies may mention those words. Other quoted text still counts: `echo "git push --force" > notes.md` is blocked. Workaround: write that text with the Write tool, not through Bash.

Merge into `.claude/settings.json`:

```json
{
  "hooks": {
    "SessionStart": [{ "matcher": "startup|resume|clear", "hooks": [{ "type": "command", "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/session-start.sh" }] }],
    "PreToolUse": [{ "matcher": "Bash", "hooks": [
      { "type": "command", "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/guard-commands.sh", "statusMessage": "Checking command" },
      { "type": "command", "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/filter-test-output.sh" }
    ] }],
    "PostToolUse": [{ "matcher": "Edit|Write", "hooks": [{ "type": "command", "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/format-lint-file.sh", "timeout": 60, "statusMessage": "Formatting and linting" }] }],
    "Stop": [{ "hooks": [{ "type": "command", "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/check-all.sh", "timeout": 600, "statusMessage": "Running checks" }] }]
  }
}
```

## Prove it works

```bash
echo '{"tool_input":{"command":"git push --force origin main"}}' | CLAUDE_PROJECT_DIR="$PWD" .claude/hooks/guard-commands.sh; echo "exit=$?"   # 2
echo '{"tool_input":{"command":"git commit --no-verify -m x"}}'  | CLAUDE_PROJECT_DIR="$PWD" .claude/hooks/guard-commands.sh; echo "exit=$?"   # 2
echo '{"tool_input":{"command":"{{pm}} test"}}'                    | CLAUDE_PROJECT_DIR="$PWD" .claude/hooks/guard-commands.sh; echo "exit=$?"   # 0
echo '{"tool_input":{"command":"git commit -m \"block push --force\""}}' | CLAUDE_PROJECT_DIR="$PWD" .claude/hooks/guard-commands.sh; echo "exit=$?"   # 0 (message text)
echo '{"tool_input":{"command":"git commit -m \"$(cat <<EOF\nskip --no-verify\nEOF\n)\""}}' | CLAUDE_PROJECT_DIR="$PWD" .claude/hooks/guard-commands.sh; echo "exit=$?"   # 0 (heredoc body)
echo '{"tool_input":{"command":"git commit -m x --no-verify"}}'    | CLAUDE_PROJECT_DIR="$PWD" .claude/hooks/guard-commands.sh; echo "exit=$?"   # 2 (flag outside the message)
echo '{"tool_input":{"command":"cat \".env.local\""}}'            | CLAUDE_PROJECT_DIR="$PWD" .claude/hooks/guard-commands.sh; echo "exit=$?"   # 2
echo '{"tool_input":{"command":"{{pm}} test"}}'      | .claude/hooks/filter-test-output.sh   # updatedInput: "set -o pipefail; {{pm}} test 2>&1 | tail -n 100"
echo '{"tool_input":{"command":"{{pm}} test && x"}}' | .claude/hooks/filter-test-output.sh   # {}
echo '{"tool_input":{"command":"git status"}}'       | .claude/hooks/filter-test-output.sh   # {}
CLAUDE_PROJECT_DIR="$PWD" .claude/hooks/session-start.sh          # three state lines
{{pm}} run check                                                    # all green
```
