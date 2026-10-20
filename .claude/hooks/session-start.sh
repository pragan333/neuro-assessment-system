#!/bin/bash
set -euo pipefail

# Only run in remote (Claude Code on the web) environments
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

# Install npm dependencies for ultrasound-proposal-generator
cd "$CLAUDE_PROJECT_DIR/ultrasound-proposal-generator"
npm install
