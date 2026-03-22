#!/bin/bash
# Auto-deploy script for legend-of-new-generation-auto
# This script commits and pushes changes to GitHub

REPO_DIR="/root/.openclaw/workspace/legend-of-new-generation-auto"
BRANCH="main"

cd "$REPO_DIR" || exit 1

# Check if there are any changes
if git diff --quiet && git diff --staged --quiet; then
    echo "$(date): No changes to deploy"
    exit 0
fi

# Pull latest changes first
git pull origin "$BRANCH"

# Add all changes
git add -A

# Create commit with timestamp
COMMIT_MSG="Auto-update: $(date '+%Y-%m-%d %H:%M') - AI自动添加新功能"
git commit -m "$COMMIT_MSG"

# Push to GitHub
git push origin "$BRANCH"

echo "$(date): Deployed successfully"
