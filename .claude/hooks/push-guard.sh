#!/bin/bash
# PreToolUse (Bash) — deny dangerous git/gh shapes.
#
# Layer 3 of the mechanical floor (docs/product/arbi-permission-model.md).
#
# THE LOAD-BEARING RULE IS `--admin`.
# Tier I6a grants the agent standing authority to merge its own PR *once required status
# checks are green*. `gh pr merge --admin` bypasses required checks entirely, which would
# silently convert that conditional grant into an unconditional one. Ordinary `gh pr merge`
# is allowed on purpose; `--admin` never is.
#
# DENY-ONLY. Exit 0 falls through to the normal permission flow; exit 2 blocks.
#
# These regexes are imperfect and cannot be made otherwise. Variable indirection
# (`r=main; git push origin HEAD:$r`), command substitution, and git aliases all defeat
# them. That is why branch protection on `main` is the real backstop and this hook is
# defence in depth, not the guarantee.
set -uo pipefail

INPUT=$(cat)
TOOL=$(printf '%s' "$INPUT" | jq -r '.tool_name // empty')
[ "$TOOL" = "Bash" ] || exit 0

CMD=$(printf '%s' "$INPUT" | jq -r '.tool_input.command // empty')
[ -z "$CMD" ] && exit 0

deny() {
  echo "BLOCKED by push-guard: $1" >&2
  echo "See docs/product/arbi-permission-model.md (tier I6b / circuit breaker #2)." >&2
  exit 2
}

# --- I6b: bypassing required status checks -----------------------------------------
printf '%s' "$CMD" | grep -qE '\bgh\s+pr\s+merge\b.*--admin' && \
  deny "'gh pr merge --admin' bypasses the required status checks that the I6a merge grant is conditioned on. Fix the failing check instead."

printf '%s' "$CMD" | grep -qE '\bgh\s+api\b.*(branch_protection|protection).*(-X|--method)\s*(DELETE|PUT|PATCH)' && \
  deny "modifying branch protection is James's alone"

# --- I6b: force / destructive pushes to main ---------------------------------------
printf '%s' "$CMD" | grep -qE '\bgit\s+push\b.*(--force\b|--force-with-lease\b|-f\b).*\b(main|master|origin/main)\b' && \
  deny "force-push to main"
printf '%s' "$CMD" | grep -qE '\bgit\s+push\b.*\b(main|master)\b.*(--force\b|-f\b)' && \
  deny "force-push to main"
printf '%s' "$CMD" | grep -qE '\bgit\s+push\b.*--(delete|mirror)\b' && \
  deny "delete/mirror push"
printf '%s' "$CMD" | grep -qE '\bgit\s+push\b.*:\s*(refs/heads/)?(main|master)\b' && \
  deny "refspec push targeting main (e.g. HEAD:main or claude/x:main)"

# Direct push to main. Merging via `gh pr merge` is the granted path; pushing straight
# to main skips CI entirely.
printf '%s' "$CMD" | grep -qE '\bgit\s+push\b\s+\S+\s+(main|master)\s*$' && \
  deny "direct push to main — open a PR and merge on green instead"

# --- I6b: CI configuration ----------------------------------------------------------
printf '%s' "$CMD" | grep -qE '\bgh\s+workflow\s+(disable|enable)\b' && \
  deny "enabling/disabling workflows is a CI-config change"
printf '%s' "$CMD" | grep -qE '\bgh\s+workflow\s+run\b.*(\$\(|`)' && \
  deny "gh workflow run carrying command substitution"
printf '%s' "$CMD" | grep -qE '\bgh\s+run\s+rerun\b' && \
  deny "gh run rerun — re-running a job is not a fix; diagnose the failure"

# --- history rewriting --------------------------------------------------------------
printf '%s' "$CMD" | grep -qE '\bgit\s+(reset\s+--hard\s+.*\b(origin/)?(main|master)\b|filter-branch\b|filter-repo\b)' && \
  deny "history rewrite / hard reset onto main"

exit 0
