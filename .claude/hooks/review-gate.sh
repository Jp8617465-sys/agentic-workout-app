#!/bin/bash
# PreToolUse (Bash) — product source may not be committed without a review pass.
#
# Layer 6 of the mechanical floor (docs/product/arbi-permission-model.md).
#
# Enforces two things:
#
#   1. SAME-STEP STAGING IS DENIED. `git commit -a`, `git commit -am`, and compound
#      `git add X && git commit` in a single command all stage and commit in one
#      indivisible step, which leaves no moment at which a staged diff exists to be
#      reviewed. Stage first, review, then commit — three steps, on purpose.
#
#   2. STAGED src/** REQUIRES A REVIEW MARKER matching the staged tree. /arbi-mission
#      step 3 routes every code edit through the review loop (security-engineer /
#      refactoring-expert / technical-writer) and writes the marker afterwards. An agent
#      never writes the marker for a loop that did not run.
#
# WHERE THE MARKER LIVES, AND WHY IT MATTERS
# .git/arbi-review-marker — inside .git, so it is never committed and never an authority
# path. The pack's hardest-won warning is that denying the whole .claude/** tree also
# denies the review gate's own marker file and deadlocks every future commit. Keeping the
# marker outside every denied surface is what makes that impossible here.
#
# SCOPE: src/** only. Docs, scripts, config and test-infra commits pass freely — gating
# those would be ceremony, and a gate that fires on everything gets routed around.
#
# DENY-ONLY. Exit 0 falls through; exit 2 blocks.
set -uo pipefail

INPUT=$(cat)
TOOL=$(printf '%s' "$INPUT" | jq -r '.tool_name // empty')
[ "$TOOL" = "Bash" ] || exit 0

CMD=$(printf '%s' "$INPUT" | jq -r '.tool_input.command // empty')
[ -z "$CMD" ] && exit 0
printf '%s' "$CMD" | grep -qE '\bgit\s+commit\b' || exit 0

ROOT="${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}"
MARKER="$ROOT/.git/arbi-review-marker"

deny() {
  echo "BLOCKED by review-gate: $1" >&2
  exit 2
}

# --- 1. same-step staging ------------------------------------------------------------
if printf '%s' "$CMD" | grep -qE '\bgit\s+commit\b[^|;&]*\s-[A-Za-z]*a'; then
  deny "'git commit -a/-am' stages and commits in one step, leaving no staged diff to review. Run 'git add <paths>', then commit separately."
fi
if printf '%s' "$CMD" | grep -qE '\bgit\s+add\b[^|;&]*(&&|;)[^|;&]*\bgit\s+commit\b'; then
  deny "compound 'git add && git commit' stages and commits indivisibly. Split into two commands."
fi

# --- 2. review marker for staged product source --------------------------------------
STAGED_SRC=$(git -C "$ROOT" diff --cached --name-only 2>/dev/null | grep -E '^src/.*\.(ts|tsx)$' | grep -v '\.test\.' || true)
[ -z "$STAGED_SRC" ] && exit 0

TREE=$(git -C "$ROOT" write-tree 2>/dev/null || echo "unknown")

if [ ! -f "$MARKER" ]; then
  deny "$(printf 'staged product source has not been through the review loop:\n%s\n\nRun the review loop (security-engineer / refactoring-expert / technical-writer on the staged diff), then record it:\n  echo %s > .git/arbi-review-marker' "$STAGED_SRC" "$TREE")"
fi

RECORDED=$(cat "$MARKER" 2>/dev/null | tr -d '[:space:]')
if [ "$RECORDED" != "$TREE" ]; then
  deny "$(printf 'the review marker is stale — it records tree %s but the staged tree is %s.\nThe staged content changed after it was reviewed. Re-run the review loop and re-record.' "${RECORDED:0:12}" "${TREE:0:12}")"
fi

exit 0
