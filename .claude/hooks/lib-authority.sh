#!/bin/bash
# Shared authority-surface definition. Sourced by authority-guard.sh.
#
# THE SPLIT THAT MATTERS
#
# docs/product/ contains two different kinds of file and they must NOT be treated alike:
#
#   BOUNDARY files define what arbi is allowed to do. arbi editing them is circuit
#   breaker #7 (self-editing its own boundaries). These are denied.
#
#   MEMORY files are arbi's working state — the ranked queue, the decision log, the run
#   ledger, the handoffs. arbi MUST write these on every wake and every close; that is
#   tier I2 and it is the mechanism by which the project stops resetting each session.
#   Denying these would break /arbi and /arbi-close outright.
#
# The pack's warning generalises here: it says never deny the whole .claude/** tree
# because that also denies the review-gate marker and deadlocks every commit. The same
# mistake in docs/product/ would deadlock arbi's memory. Enumerate; never blanket.

# Denied: editing any of these is a boundary change and requires James's merge.
AUTHORITY_PATHS=(
  "CLAUDE.md"
  "docs/product/north-star.md"
  "docs/product/arbi-constitution.md"
  "docs/product/arbi-permission-model.md"
  "docs/product/arbi-authority.md"
  "docs/product/arbi-scorecard.md"
  "eas.json"
)

# Denied: everything beneath these prefixes.
AUTHORITY_PREFIXES=(
  ".claude/agents/"
  ".claude/commands/"
  ".claude/hooks/"
  ".github/"
  "supabase/migrations/"
  "drizzle/"
)

# Denied by exact match (settings.json only — NOT the whole .claude tree).
AUTHORITY_EXACT=(
  ".claude/settings.json"
)

# Explicitly writable, listed here so the intent is documented rather than implied:
#   docs/product/roadmap-state.md        arbi's ranked queue + last-wake snapshot
#   docs/product/decision-log.md         append-only; the learning loop
#   docs/product/arbi-run-ledger.md      dispatch + episode scores
#   docs/product/inbox.md                decisions only James can settle
#   docs/product/dark-launch-exit-plan.md
#   docs/product/risk-register.md
#   docs/product/cleanup-backlog.md
#   docs/session-handoff-*.md
#   .claude/settings.local.json          gitignored local overrides
#
# These still pass through CODEOWNERS on merge where applicable.

# Returns 0 (true) if the given repo-relative path is an authority surface.
is_authority_path() {
  local rel="$1"
  local p
  for p in "${AUTHORITY_PATHS[@]}" "${AUTHORITY_EXACT[@]}"; do
    [ "$rel" = "$p" ] && return 0
  done
  for p in "${AUTHORITY_PREFIXES[@]}"; do
    case "$rel" in "$p"*) return 0 ;; esac
  done
  return 1
}
