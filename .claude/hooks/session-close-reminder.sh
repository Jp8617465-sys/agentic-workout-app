#!/bin/bash
# Stop hook — warn when a working session ends without /arbi-close.
#
# WHY THIS EXISTS
# James's configuration makes arbi-red-team advisory rather than blocking, so a CHALLENGE
# no longer stops a distorted call at the moment it fires. The only surviving correction
# is the "did it work?" column in docs/product/decision-log.md, which arbi reads at the
# NEXT wake before re-ranking.
#
# That column is written by /arbi-close. A session that ends without it is a session arbi
# cannot learn from — the loop degrades to an expensive status printer that resets every
# time. This hook makes that failure visible instead of silent.
#
# ADVISORY ONLY. Always exits 0. It never blocks a session from ending — blocking on Stop
# would be a trap, and the correct response to "you forgot to close" is a nudge, not a
# cage.
set -uo pipefail

ROOT="${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}"
LEDGER="$ROOT/docs/product/arbi-run-ledger.md"

# Did this session actually change anything? A read-only session needs no close.
CHANGED=$(git -C "$ROOT" status --porcelain 2>/dev/null | wc -l | tr -d ' ')
AHEAD=$(git -C "$ROOT" rev-list --count origin/main..HEAD 2>/dev/null || echo 0)
if [ "$CHANGED" = "0" ] && [ "$AHEAD" = "0" ]; then
  exit 0
fi

# An unscored ledger row is the pack's named failure: "Every '—' left in the run ledger
# is a session that didn't count toward the track record the promotion gate requires."
if [ -f "$LEDGER" ] && grep -qE '\|\s*—\s*\|?\s*$' "$LEDGER" 2>/dev/null; then
  echo "arbi: the run ledger has unscored rows (—). Run /arbi-close to score them —" >&2
  echo "an unscored row contributes nothing to the track record." >&2
  exit 0
fi

echo "arbi: this session changed the repo but has not been closed out." >&2
echo "Run /arbi-close to append the decision-log row, refresh roadmap-state.md, and" >&2
echo "write the handoff. With the red team advisory, the decision log is the only" >&2
echo "feedback arbi gets before its next ranking." >&2
exit 0
