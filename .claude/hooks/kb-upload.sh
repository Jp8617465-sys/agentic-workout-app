#!/bin/bash
# Fires after Edit or Write tool calls.
# If the edited file is inside kb-source/, uploads it to Supabase Storage.
# No-ops silently if env vars are missing or the file isn't a KB file.

set -euo pipefail

# Read tool call details from stdin (JSON provided by Claude Code)
INPUT=$(cat)

# Extract the file path from the tool input
FILE_PATH=$(echo "$INPUT" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    tool_input = d.get('tool_input', {})
    print(tool_input.get('file_path', ''))
except Exception:
    print('')
" 2>/dev/null || true)

# Only act on files inside kb-source/
if [[ "$FILE_PATH" != *"/kb-source/"* ]]; then
  exit 0
fi

FILENAME=$(basename "$FILE_PATH")

# Require env vars — skip silently if not set (local dev without keys)
if [[ -z "${SUPABASE_SERVICE_ROLE_KEY:-}" || -z "${SUPABASE_URL:-}" ]]; then
  echo "KB upload skipped: SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set"
  exit 0
fi

echo "KB file changed: $FILENAME — uploading to Storage..."

cd "$CLAUDE_PROJECT_DIR"

FILE="$FILENAME" \
  SUPABASE_URL="$SUPABASE_URL" \
  SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY" \
  npx ts-node --project tsconfig.node.json scripts/upload-kb-to-storage.ts

echo "KB upload complete: $FILENAME"
