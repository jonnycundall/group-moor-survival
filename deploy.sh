#!/bin/bash

# Simple deployment script for Group Moor Survival

echo "🎮 Group Moor Survival - Deployment Script"
echo "==========================================="

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo "❌ Not in a git repository. Initializing..."
    git init
fi

# Add all files
echo "📦 Adding files to git..."
git add .

# Commit changes
echo "💾 Committing changes..."
read -p "Enter commit message (or press Enter for default): " commit_msg
if [ -z "$commit_msg" ]; then
    commit_msg="Deploy to Vercel: $(date '+%Y-%m-%d %H:%M:%S')"
fi
git commit -m "$commit_msg"

# Check if origin remote exists
if ! git remote get-url origin >/dev/null 2>&1; then
    echo "🔗 No git remote found."
    echo "Please set up your git repository first:"
    echo "  git remote add origin https://github.com/yourusername/your-repo.git"
    echo "Then run this script again."
    exit 1
fi

# Push to repository
echo "🚀 Pushing to repository..."
git push origin main

echo ""
echo "✅ Code pushed to repository!"
echo ""
echo "Next steps for Vercel deployment:"
echo "1. Go to https://vercel.com/dashboard"
echo "2. Click 'Import Project'"
echo "3. Connect your Git repository"
echo "4. Vercel will automatically deploy your static site!"
echo ""
echo "🌐 Your game will be live at: https://your-project-name.vercel.app"
