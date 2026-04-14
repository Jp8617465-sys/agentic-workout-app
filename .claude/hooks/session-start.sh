#!/bin/bash
set -euo pipefail

# Only run in Claude Code remote (web) sessions
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

echo "Installing dependencies..."
cd "$CLAUDE_PROJECT_DIR"
npm install --legacy-peer-deps

echo "Installing ts-jest and types for unit tests..."
npm install --save-dev ts-jest @types/jest babel-preset-expo --legacy-peer-deps

echo "Session start complete."
