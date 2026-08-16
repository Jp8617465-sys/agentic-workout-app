#!/bin/bash
# PreToolUse — enforce PR *sequencing*, not a PR ceiling.
#
# Layer 4 of the mechanical floor (docs/product/arbi-permission-model.md).
#
# The pack shipped this as a ceiling: draft PRs only, never marked ready, because the
# draft PR was the agent's terminal state. Under the I6a grant that ceiling is gone — the
# agent marks its own PR ready and merges it once required checks are green.
#
# So this guard now enforces the ORDER rather than the ceiling: every PR is BORN draft,
# which guarantees CI has a chance to run and a reviewer a chance to look before anything
# is mergeable. Promoting draft -> ready is explicitly allowed; it is the step that
# precedes a legitimate merge.
#
# DENY-ONLY. Exit 0 falls through; exit 2 blocks.
set -uo pipefail

INPUT=$(cat)
TOOL=$(printf '%s' "$INPUT" | jq -r '.tool_name // empty')

deny() {
  echo "BLOCKED by pr-draft-guard: $1" >&2
  echo "Open PRs as drafts, let quality-gates.yml run, then mark ready and merge on green." >&2
  echo "See docs/product/arbi-permission-model.md (tiers I3/I6a)." >&2
  exit 2
}

case "$TOOL" in
  mcp__github__create_pull_request)
    DRAFT=$(printf '%s' "$INPUT" | jq -r '.tool_input.draft // false')
    [ "$DRAFT" = "true" ] || deny "create_pull_request without draft:true"
    ;;

  Bash)
    CMD=$(printf '%s' "$INPUT" | jq -r '.tool_input.command // empty')
    [ -z "$CMD" ] && exit 0
    if printf '%s' "$CMD" | grep -qE '\bgh\s+pr\s+create\b'; then
      printf '%s' "$CMD" | grep -qE '(^|\s)(--draft|-d)(\s|$)' || \
        deny "'gh pr create' without --draft"
    fi
    # Auto-merge queues a merge that fires later, outside any check this session can see.
    if printf '%s' "$CMD" | grep -qE '\bgh\s+pr\s+merge\b.*--auto\b'; then
      deny "--auto queues a merge to fire unobserved; merge explicitly once checks are green"
    fi
    ;;
esac

exit 0
