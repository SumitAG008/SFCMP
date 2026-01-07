#!/bin/bash

# Git Repository Setup Script
# This script initializes the Git repository and connects it to GitHub

set -e

GITHUB_REPO="https://github.com/SumitAG008/SFCMP.git"

echo "🔧 Setting up Git repository..."

# Initialize git if not already initialized
if [ ! -d .git ]; then
    echo "📦 Initializing Git repository..."
    git init
fi

# Add all files
echo "📝 Adding files to Git..."
git add .

# Create initial commit
echo "💾 Creating initial commit..."
git commit -m "Initial commit: SuccessFactors Compensation Extension on SAP BTP" || echo "No changes to commit"

# Add remote if not exists
if ! git remote | grep -q origin; then
    echo "🔗 Adding GitHub remote..."
    git remote add origin "$GITHUB_REPO"
else
    echo "🔄 Updating GitHub remote..."
    git remote set-url origin "$GITHUB_REPO"
fi

# Check if we can push
echo "📤 Checking remote connection..."
git fetch origin || echo "⚠️  Could not fetch from remote. Make sure the repository exists on GitHub."

echo "✅ Git setup completed!"
echo ""
echo "📋 Next steps:"
echo "1. Review changes: git status"
echo "2. Push to GitHub: git push -u origin main"
echo "   (or 'git push -u origin master' if your default branch is master)"
