#!/bin/bash
set -euo pipefail

# Only run in Claude Code remote (web) sessions
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

echo "Installing dependencies..."
cd "$CLAUDE_PROJECT_DIR"

# `npm ci` honours the lockfile exactly and never rewrites package.json or
# package-lock.json. The previous `npm install` + `npm install --save-dev ts-jest
# @types/jest babel-preset-expo` re-resolved those three packages on EVERY session
# start, dirtying the working tree before any work began. All three are already
# declared in devDependencies, so the second install was redundant as well.
if [ -f package-lock.json ]; then
  npm ci --legacy-peer-deps
else
  npm install --legacy-peer-deps
fi

echo "Session start complete."
