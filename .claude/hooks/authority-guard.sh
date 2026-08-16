#!/bin/bash
# PreToolUse — deny direct writes to authority/boundary surfaces.
#
# Layer 2 of the mechanical floor (docs/product/arbi-permission-model.md). The
# settings.json `deny` array covers the file-editing tools; this closes the gap that
# layer admits — arbitrary subprocesses that write files indirectly, e.g.
#   echo x > CLAUDE.md
#   node -e 'require("fs").writeFileSync("CLAUDE.md", "...")'
#   sed -i 's/.../.../' .claude/agents/arbi.md
#
# DENY-ONLY. Exit 0 falls through to the normal permission flow; exit 2 blocks. A false
# negative here costs a permission prompt; a false negative in an allow-rule would
# silently execute. Only the fail-safe direction is acceptable.
#
# Paths are realpath-resolved before matching so a symlink cannot alias an authority
# target.
set -uo pipefail

ROOT="${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}"
# shellcheck source=lib-authority.sh
source "$ROOT/.claude/hooks/lib-authority.sh"

INPUT=$(cat)
TOOL=$(printf '%s' "$INPUT" | jq -r '.tool_name // empty')

deny() {
  echo "BLOCKED by authority-guard: $1" >&2
  echo "" >&2
  echo "This path defines what arbi is permitted to do. Editing it directly is circuit" >&2
  echo "breaker #7 (self-editing boundaries without review). Draft the change on a" >&2
  echo "claude/** branch and open a PR — CODEOWNERS routes it to James." >&2
  echo "See docs/product/arbi-permission-model.md." >&2
  exit 2
}

# Resolve any path to repo-relative, following symlinks.
to_rel() {
  local raw="$1" abs
  case "$raw" in
    /*) abs="$raw" ;;
    *)  abs="$ROOT/$raw" ;;
  esac
  # realpath -m tolerates not-yet-existing files (a Write to a new path).
  abs=$(realpath -m "$abs" 2>/dev/null || printf '%s' "$abs")
  printf '%s' "${abs#"$ROOT"/}"
}

case "$TOOL" in
  Edit|Write|MultiEdit|NotebookEdit)
    FP=$(printf '%s' "$INPUT" | jq -r '.tool_input.file_path // .tool_input.notebook_path // empty')
    [ -z "$FP" ] && exit 0
    REL=$(to_rel "$FP")
    is_authority_path "$REL" && deny "$REL"
    ;;

  Bash)
    CMD=$(printf '%s' "$INPUT" | jq -r '.tool_input.command // empty')
    [ -z "$CMD" ] && exit 0

    # Scan the raw command text for any authority path. Deliberately blunt: a mention
    # inside a read-only command (grep/cat) costs a prompt, which is the cheap direction.
    # Only flag when the command also looks like it could write.
    if printf '%s' "$CMD" | grep -qE '(>|>>|\bsed\b.*-i|\btee\b|\bcp\b|\bmv\b|\brm\b|\btruncate\b|writeFileSync|open\(.*[wa]|\bdd\b|\bpatch\b|\bgit\s+checkout\b|\bgit\s+restore\b)'; then
      for p in "${AUTHORITY_PATHS[@]}" "${AUTHORITY_EXACT[@]}" "${AUTHORITY_PREFIXES[@]}"; do
        if printf '%s' "$CMD" | grep -qF -- "$p"; then
          deny "command may write to authority path '$p'"
        fi
      done
    fi
    ;;
esac

exit 0
