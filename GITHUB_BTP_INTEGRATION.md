# GitHub Integration with SAP BTP CAP

## Overview

You can integrate GitHub directly with SAP BTP to enable:
- ✅ **Direct Code Push** from GitHub to BTP
- ✅ **Automated Deployment** via CI/CD pipelines
- ✅ **Version Control** for your CAP project
- ✅ **Collaborative Development**

## Method 1: Direct Git Integration in Business Application Studio

### Step 1: Clone Repository in BAS

1. **Open Terminal in BAS**:
   - In your Dev Space, open a terminal
   - Or use: `Terminal > New Terminal`

2. **Clone Your GitHub Repository**:
   ```bash
   git clone https://github.com/SumitAG008/SFCMP.git
   cd SFCMP
   ```

3. **Configure Git** (if not already done):
   ```bash
   git config --global user.name "Your Name"
   git config --global user.email "your.email@example.com"
   ```

### Step 2: Work with Git in BAS

**Push Changes to GitHub**:
```bash
git add .
git commit -m "Your commit message"
git push origin main
```

**Pull Latest Changes**:
```bash
git pull origin main
```

## Method 2: GitHub Actions for Automated Deployment

### Setup GitHub Actions CI/CD

Create `.github/workflows/deploy-to-btp.yml`:

```yaml
name: Deploy to SAP BTP

on:
  push:
    branches: [ main ]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Install MBT
        run: npm install -g mbt
      
      - name: Build MTA
        run: mbt build
      
      - name: Deploy to Cloud Foundry
        env:
          CF_API: ${{ secrets.CF_API }}
          CF_ORG: ${{ secrets.CF_ORG }}
          CF_SPACE: ${{ secrets.CF_SPACE }}
          CF_USERNAME: ${{ secrets.CF_USERNAME }}
          CF_PASSWORD: ${{ secrets.CF_PASSWORD }}
        run: |
          cf login -a $CF_API -u $CF_USERNAME -p $CF_PASSWORD -o $CF_ORG -s $CF_SPACE
          cf deploy mta_archives/*.mtar
```

### Configure GitHub Secrets

In your GitHub repository:
1. Go to **Settings > Secrets and variables > Actions**
2. Add these secrets:
   - `CF_API`: `https://api.cf.us10-001.hana.ondemand.com`
   - `CF_ORG`: Your Cloud Foundry organization
   - `CF_SPACE`: Your Cloud Foundry space
   - `CF_USERNAME`: Your BTP username
   - `CF_PASSWORD`: Your BTP password

## Method 3: SAP Continuous Integration and Delivery (CI/CD)

### Using SAP Build

1. **Connect GitHub Repository**:
   - Go to SAP Build (build.cloud.sap)
   - Create a new project
   - Connect your GitHub repository: `https://github.com/SumitAG008/SFCMP`

2. **Configure Build Pipeline**:
   - Select "SAP Cloud Application Programming Model"
   - Configure build steps:
     - Install dependencies
     - Build MTA
     - Deploy to Cloud Foundry

3. **Set Deployment Target**:
   - API Endpoint: `https://api.cf.us10-001.hana.ondemand.com`
   - Organization: Your CF org
   - Space: Your CF space

## Method 4: Git Integration in BAS (Visual)

### Using BAS Git Integration

1. **Open Source Control**:
   - Click the Source Control icon in the sidebar (or `Ctrl+Shift+G`)
   - Or: `View > Source Control`

2. **Initialize Repository** (if not already):
   - Click "Initialize Repository"
   - Or use terminal: `git init`

3. **Add Remote**:
   ```bash
   git remote add origin https://github.com/SumitAG008/SFCMP.git
   ```

4. **Push/Pull**:
   - Use the Source Control panel to stage, commit, and push
   - Or use the terminal commands

## Recommended Workflow

### Development Workflow

1. **Develop in BAS**:
   - Make changes in Business Application Studio
   - Test locally: `npm start`

2. **Commit to Git**:
   ```bash
   git add .
   git commit -m "Feature: Added compensation calculation"
   ```

3. **Push to GitHub**:
   ```bash
   git push origin main
   ```

4. **Automated Deployment** (if CI/CD configured):
   - GitHub Actions automatically builds and deploys
   - Or manually deploy: `cf deploy mta_archives/*.mtar`

## Best Practices

### 1. Branch Strategy
```bash
# Create feature branch
git checkout -b feature/new-feature

# Work on feature
# ... make changes ...

# Commit and push
git add .
git commit -m "Add new feature"
git push origin feature/new-feature

# Merge to main (via GitHub PR or locally)
```

### 2. Environment Variables
- Store sensitive data in BTP service bindings
- Use GitHub Secrets for CI/CD
- Never commit `.env` files

### 3. MTA Build
- Always build MTA before deployment: `mbt build`
- Commit `mta_archives/` to `.gitignore` (already done)

## Troubleshooting

### Git Authentication Issues
```bash
# Use Personal Access Token instead of password
# GitHub > Settings > Developer settings > Personal access tokens
git remote set-url origin https://<TOKEN>@github.com/SumitAG008/SFCMP.git
```

### BAS Terminal Issues
- If terminal doesn't work, use external terminal
- Or use BAS's built-in Git UI

### Deployment Failures
- Check Cloud Foundry logs: `cf logs compensation-service --recent`
- Verify service bindings: `cf services`
- Check MTA build output for errors
