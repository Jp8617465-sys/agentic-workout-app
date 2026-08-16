#!/bin/bash
# PreToolUse — fail-closed deny on the irreversible tiers.
#
# Layer 5 of the mechanical floor (docs/product/arbi-permission-model.md).
#
# The pack armed this only when ARBI_UNATTENDED=1, because unattended was the exception.
# Under James's grants unattended is the NORMAL mode, so this is always armed. It denies
# the tiers that are James's forever, regardless of who is watching:
#
#   I5   migrations · DB writes · infra mutation · secrets
#   I6b  deploy · CI-config change  (push/merge shapes live in push-guard.sh)
#   I7   EAS build submit · TestFlight · App Store release
#
# DENY-ONLY, fail-closed within these categories. Exit 0 falls through; exit 2 blocks.
set -uo pipefail

INPUT=$(cat)
TOOL=$(printf '%s' "$INPUT" | jq -r '.tool_name // empty')

deny() {
  echo "BLOCKED by unattended-guard: $1" >&2
  echo "" >&2
  echo "This is an irreversible tier reserved to James — it is never granted standing," >&2
  echo "and no track record promotes it. Surface it as a decision instead: add a row to" >&2
  echo "docs/product/inbox.md and continue with the rest of the mission." >&2
  echo "See docs/product/arbi-permission-model.md." >&2
  exit 2
}

# --- I5: write-capable database MCP namespaces --------------------------------------
# Read-only Supabase tools (list_tables, execute_sql on the read-only server) fall through.
case "$TOOL" in
  mcp__Supabase__apply_migration|mcp__Supabase__execute_sql|mcp__Supabase__deploy_edge_function)
    deny "$TOOL is a tier I5 database/infra write" ;;
  mcp__Supabase__create_project|mcp__Supabase__delete_branch|mcp__Supabase__merge_branch|\
  mcp__Supabase__pause_project|mcp__Supabase__restore_project|mcp__Supabase__rebase_branch|\
  mcp__Supabase__reset_branch|mcp__Supabase__create_branch)
    deny "$TOOL mutates Supabase project/branch state (tier I5)" ;;
esac

[ "$TOOL" = "Bash" ] || exit 0
CMD=$(printf '%s' "$INPUT" | jq -r '.tool_input.command // empty')
[ -z "$CMD" ] && exit 0

# --- I5: migrations -----------------------------------------------------------------
printf '%s' "$CMD" | grep -qE '\bsupabase\s+(db\s+(push|reset)|migration\s+up)\b' && \
  deny "supabase migration apply (tier I5)"
printf '%s' "$CMD" | grep -qE '\bnpm\s+run\s+db:push\b|\bdrizzle-kit\s+push\b' && \
  deny "drizzle-kit push writes schema to a live database (tier I5)"

# --- I5: secrets ---------------------------------------------------------------------
printf '%s' "$CMD" | grep -qE '\bsupabase\s+secrets\s+(set|unset)\b' && \
  deny "setting Supabase secrets (tier I5)"
printf '%s' "$CMD" | grep -qE '\bgh\s+secret\s+(set|delete)\b' && \
  deny "setting GitHub secrets (tier I5)"
printf '%s' "$CMD" | grep -qE '\beas\s+secret:(create|delete|push)\b' && \
  deny "setting EAS secrets (tier I5)"

# --- I7: release to a distribution channel ------------------------------------------
printf '%s' "$CMD" | grep -qE '\beas\s+(submit|build)\b' && \
  deny "EAS build/submit ships to real devices (tier I7)"
printf '%s' "$CMD" | grep -qE '\b(fastlane|altool|xcrun\s+altool|testflight)\b' && \
  deny "app distribution tooling (tier I7)"
printf '%s' "$CMD" | grep -qE '\bexpo\s+publish\b|\beas\s+update\b' && \
  deny "OTA publish reaches installed apps (tier I7)"

# --- I6b: deploy ---------------------------------------------------------------------
printf '%s' "$CMD" | grep -qE '\bsupabase\s+functions\s+deploy\b' && \
  deny "edge function deploy (tier I6b)"

exit 0
