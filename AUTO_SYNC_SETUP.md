# Automatic Sync Setup - GitHub ↔ BAS ↔ BTP

## Overview

This setup enables automatic synchronization between:
- **GitHub** (source of truth)
- **BAS** (development environment)
- **BTP** (deployment target)

## Architecture

```
┌─────────────┐
│   GitHub    │ ← Source of Truth
│  Repository │
└──────┬──────┘
       │
       │ git push/pull
       │
┌──────▼──────┐
│     BAS     │ ← Development
│  Dev Space  │
└──────┬──────┘
       │
       │ GitHub Actions
       │ (Auto Deploy)
       │
┌──────▼──────┐
│     BTP     │ ← Production
│  Cloud      │
└─────────────┘
```

## Setup Complete ✅

### 1. Local Git Repository
- ✅ Initialized
- ✅ All files committed
- ✅ Remote configured: `https://github.com/SumitAG008/SFCMP.git`

### 2. GitHub Actions Workflow
- ✅ File created: `.github/workflows/deploy-to-btp.yml`
- ✅ Configured for automatic deployment on push to `main`

### 3. Next Steps

#### A. Push to GitHub
```bash
git push -u origin main
```

**Authentication**: Use Personal Access Token
- Get token: https://github.com/settings/tokens
- Use token as password when prompted

#### B. Configure GitHub Secrets

Go to: https://github.com/SumitAG008/SFCMP/settings/secrets/actions

Add these secrets:
- `CF_API`: `https://api.cf.us10-001.hana.ondemand.com`
- `CF_ORG`: Your Cloud Foundry organization
- `CF_SPACE`: Your Cloud Foundry space
- `CF_USERNAME`: Your BTP email
- `CF_PASSWORD`: Your BTP password

#### C. Clone in BAS

1. Open BAS: https://45dc37cbtrial.us10cf.trial.applicationstudio.cloud.sap
2. Click "Clone from Git"
3. Enter: `https://github.com/SumitAG008/SFCMP.git`
4. Authenticate
5. Select folder

## Workflow: Automatic Sync

### Development Flow

1. **Pull Latest** (in BAS):
   ```bash
   git pull origin main
   ```

2. **Make Changes**:
   - Edit files in BAS
   - Test locally: `npm start`

3. **Commit & Push**:
   ```bash
   git add .
   git commit -m "Feature: Added new functionality"
   git push origin main
   ```

4. **Automatic Deployment**:
   - GitHub Actions triggers
   - Builds MTA archive
   - Deploys to BTP
   - Your app is updated automatically!

### Manual Deployment (if needed)

```bash
# In BAS terminal
mbt build
cf login -a https://api.cf.us10-001.hana.ondemand.com
cf deploy mta_archives/*.mtar
```

## Sync Status

### Current State
- ✅ Git initialized locally
- ✅ Remote repository configured
- ✅ GitHub Actions workflow ready
- ⏳ **Pending**: Push to GitHub
- ⏳ **Pending**: Configure GitHub Secrets
- ⏳ **Pending**: Clone in BAS

### After Push
- ✅ Code on GitHub
- ✅ Ready to clone in BAS
- ✅ Auto-deployment ready (after secrets configured)

## Troubleshooting

### Git Push Fails
- **Issue**: Authentication failed
- **Solution**: Use Personal Access Token, not password

### GitHub Actions Fails
- **Issue**: Missing secrets
- **Solution**: Add all required secrets in GitHub Settings

### BAS Clone Fails
- **Issue**: Repository not found
- **Solution**: Verify repository is public or you have access

## Quick Commands Reference

```bash
# Push to GitHub
git push -u origin main

# Pull from GitHub
git pull origin main

# Check status
git status

# View remote
git remote -v

# Clone in BAS (after push)
git clone https://github.com/SumitAG008/SFCMP.git
```

## Summary

✅ **Local Git**: Ready  
✅ **GitHub Remote**: Configured  
✅ **Auto-Deploy**: Workflow ready  
⏳ **Next**: Push to GitHub, then clone in BAS  

**You're all set for automatic sync!** 🚀
