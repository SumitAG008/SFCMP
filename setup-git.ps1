# Git Repository Setup Script for Windows PowerShell
# This script initializes the Git repository and connects it to GitHub

$GITHUB_REPO = "https://github.com/SumitAG008/SFCMP.git"

Write-Host "🔧 Setting up Git repository..." -ForegroundColor Cyan

# Initialize git if not already initialized
if (-not (Test-Path .git)) {
    Write-Host "📦 Initializing Git repository..." -ForegroundColor Yellow
    git init
}

# Add all files
Write-Host "📝 Adding files to Git..." -ForegroundColor Yellow
git add .

# Create initial commit
Write-Host "💾 Creating initial commit..." -ForegroundColor Yellow
$commitResult = git commit -m "Initial commit: SuccessFactors Compensation Extension on SAP BTP" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "ℹ️  No changes to commit or commit already exists" -ForegroundColor Gray
}

# Add remote if not exists
$remotes = git remote
if ($remotes -notcontains "origin") {
    Write-Host "🔗 Adding GitHub remote..." -ForegroundColor Yellow
    git remote add origin $GITHUB_REPO
} else {
    Write-Host "🔄 Updating GitHub remote..." -ForegroundColor Yellow
    git remote set-url origin $GITHUB_REPO
}

# Check if we can fetch
Write-Host "📤 Checking remote connection..." -ForegroundColor Yellow
$fetchResult = git fetch origin 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Could not fetch from remote. Make sure the repository exists on GitHub." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✅ Git setup completed!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "1. Review changes: git status"
Write-Host "2. Push to GitHub: git push -u origin main"
Write-Host "   (or 'git push -u origin master' if your default branch is master)"
