# Quick Start: BAS + GitHub + BTP

## Your Configuration

- **BTP API Endpoint**: `https://api.cf.us10-001.hana.ondemand.com`
- **Region**: `us10-001` (US East - Trial)
- **GitHub Repository**: `https://github.com/SumitAG008/SFCMP`

## Step-by-Step Setup

### 1. Create Dev Space in BAS

**Select**: "Full-Stack Cloud Application" (or "SAP Fiori Dev Space" if not available)

**Enable Extensions**:
- ✅ Basic Tools
- ✅ MTA Tools  
- ✅ Fiori Freestyle Tools
- ✅ HTML5 Runner
- ✅ CDS Graphical Modeler (Additional)

**Dev Space Name**: `OCOMP` or `sf-compensation`

Click **"Create Dev Space"**

### 2. Clone GitHub Repository in BAS

Once your Dev Space is ready:

1. **Open Terminal** in BAS (Terminal > New Terminal)

2. **Clone Repository**:
   ```bash
   git clone https://github.com/SumitAG008/SFCMP.git
   cd SFCMP
   ```

3. **Install Dependencies**:
   ```bash
   npm install
   ```

### 3. Configure SuccessFactors Service

```bash
# Login to Cloud Foundry
cf login -a https://api.cf.us10-001.hana.ondemand.com

# Create SuccessFactors service
cf create-user-provided-service successfactors-credentials \
  -p '{"url":"https://api.successfactors.eu","username":"sfadmin","password":"Part@dc57","companyId":"SFHUB003674"}'
```

### 4. Test Locally

```bash
# Start CAP server
npm start
```

Access:
- Frontend: http://localhost:4004/app/index.html
- API: http://localhost:4004/compensation/CompensationService

### 5. Deploy to BTP

```bash
# Build MTA
mbt build

# Deploy
cf deploy mta_archives/successfactors-compensation-extension_1.0.0.mtar
```

### 6. Push Changes to GitHub

```bash
# Add all files
git add .

# Commit
git commit -m "Initial SuccessFactors Compensation Extension"

# Push to GitHub
git push -u origin main
```

## GitHub Integration Workflow

### Daily Development

1. **Pull Latest**:
   ```bash
   git pull origin main
   ```

2. **Make Changes** in BAS

3. **Test Locally**:
   ```bash
   npm start
   ```

4. **Commit & Push**:
   ```bash
   git add .
   git commit -m "Description of changes"
   git push origin main
   ```

5. **Auto-Deploy** (if GitHub Actions configured):
   - Changes automatically deploy to BTP
   - Or manually: `cf deploy mta_archives/*.mtar`

## GitHub Actions Setup (Optional - Automated Deployment)

1. **Add Secrets in GitHub**:
   - Repository > Settings > Secrets and variables > Actions
   - Add:
     - `CF_API`: `https://api.cf.us10-001.hana.ondemand.com`
     - `CF_ORG`: Your CF organization
     - `CF_SPACE`: Your CF space
     - `CF_USERNAME`: Your BTP username
     - `CF_PASSWORD`: Your BTP password

2. **Workflow File**:
   - Already created: `.github/workflows/deploy-to-btp.yml`
   - Automatically runs on push to `main` branch

## Visual Git in BAS

You can also use BAS's built-in Git UI:

1. **Open Source Control**: Click Git icon in sidebar (or `Ctrl+Shift+G`)
2. **Stage Changes**: Click `+` next to files
3. **Commit**: Enter message and click ✓
4. **Push**: Click `...` > Push

## Troubleshooting

### Git Authentication
If GitHub asks for credentials:
- Use Personal Access Token (GitHub > Settings > Developer settings)
- Or use SSH keys

### CF Login Issues
```bash
# If login fails, try:
cf login -a https://api.cf.us10-001.hana.ondemand.com --sso
```

### MTA Build Errors
```bash
# Check Node version
node --version  # Should be 16+

# Clean and rebuild
rm -rf mta_archives .mta
mbt build
```
