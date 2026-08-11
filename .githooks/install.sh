#!/bin/bash
# Install tracked git hooks for this checkout.
# Run once per clone / worktree.
set -e

HOOKS_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$HOOKS_DIR/.." && pwd)"

cd "$REPO_ROOT"

git config core.hooksPath .githooks
chmod +x .githooks/pre-commit

echo "Installed: core.hooksPath=.githooks"
echo "Active hooks:"
ls -1 .githooks/ | grep -vE '^install\.sh$|^README' | sed 's/^/  /'
