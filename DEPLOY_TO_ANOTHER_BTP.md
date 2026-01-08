# Deploy to Another SAP BTP Instance

## 🎯 Overview

This guide shows how to clone your entire application to a different SAP BTP instance and deploy it there.

---

## 📋 Prerequisites

- ✅ Access to new SAP BTP account
- ✅ BAS (Business Application Studio) access in new instance
- ✅ Git repository URL (your GitHub repo)
- ✅ SuccessFactors credentials for new instance (if different)

---

## 🚀 Step 1: Clone Repository in New BAS

### 1.1 Open BAS in New BTP Instance

1. Log into new SAP BTP account
2. Open **Business Application Studio**
3. Create new **Dev Space** (if needed):
   - Type: **Full Stack Cloud Application**
   - Name: `compensation-extension`

### 1.2 Clone from Git

**In BAS Welcome Screen:**

1. Click **"Clone from Git"**
2. Enter your repository URL:
   ```
   https://github.com/SumitAG008/SFCMP.git
   ```
3. Click **"Clone"**
4. Select folder: `/home/user/projects/SFCMP` (or create new)

**OR via Terminal:**

```bash
# Open terminal (Ctrl + ~)
cd /home/user/projects
git clone https://github.com/SumitAG008/SFCMP.git
cd SFCMP
```

---

## 🔧 Step 2: Configure for New BTP Instance

### 2.1 Update BTP Configuration

**File**: `mta.yaml`

**Update these sections:**

```yaml
ID: compensation-extension  # Change if needed
version: 1.0.0

modules:
  - name: compensation-service
    type: nodejs
    path: srv
    requires:
      - name: compensation-db
      - name: successfactors-credentials
    parameters:
      buildpack: nodejs_buildpack
      memory: 512M
      disk-quota: 512M
    properties:
      SAP_JWT_TRUST_ACL: '[{"clientid":"*","identityzone":"*"}]'
```

**Update Cloud Foundry settings:**

```yaml
resources:
  - name: compensation-db
    type: com.sap.xs.hdi-container
    parameters:
      service: hana
      service-plan: hdi-shared
      config:
        schema: COMPENSATION
```

### 2.2 Update Manifest (if using)

**File**: `manifest.yml`

```yaml
applications:
  - name: compensation-service
    memory: 512M
    disk_quota: 512M
    instances: 1
    buildpack: nodejs_buildpack
    services:
      - compensation-db
      - successfactors-credentials
```

---

## 🔐 Step 3: Configure SuccessFactors Credentials

### 3.1 Create Credentials File

**Create `default-env.json` in project root:**

```json
{
  "VCAP_SERVICES": {
    "user-provided": [
      {
        "name": "successfactors-credentials",
        "label": "user-provided",
        "tags": ["successfactors"],
        "credentials": {
          "url": "https://apisalesdemo2.successfactors.eu",
          "username": "YOUR_SF_USERNAME",
          "password": "YOUR_SF_PASSWORD",
          "companyId": "YOUR_COMPANY_ID"
        }
      }
    ]
  }
}
```

**Replace with new instance credentials if different.**

### 3.2 For Production: Create User-Provided Service

**In BAS Terminal (connected to new BTP):**

```bash
# Login to Cloud Foundry
cf login -a https://api.cf.REGION.hana.ondemand.com

# Select org and space
cf target -o YOUR_ORG -s YOUR_SPACE

# Create user-provided service
cf create-user-provided-service successfactors-credentials \
  -p '{"url":"https://apisalesdemo2.successfactors.eu","username":"YOUR_USERNAME","password":"YOUR_PASSWORD","companyId":"YOUR_COMPANY_ID"}'
```

---

## 📦 Step 4: Install Dependencies

**In BAS Terminal:**

```bash
# Navigate to project
cd /home/user/projects/SFCMP

# Install dependencies
npm install

# Install CDS CLI (if not already installed)
npm install -g @sap/cds-dk
```

---

## 🧪 Step 5: Test Locally

### 5.1 Start Development Server

```bash
npm start
```

**Should see:**
```
[cds] - serving CompensationService { path: '/compensation' }
[cds] - server listening on { url: 'http://localhost:4004' }
```

### 5.2 Test Application

1. Open port forwarding URL (shown in BAS)
2. Test all features:
   - Compensation Worksheet
   - Workflow Builder
   - Data loading
   - Save operations

---

## 🚀 Step 6: Deploy to New BTP Instance

### 6.1 Build MTA Archive

```bash
# Install MTA builder (if not installed)
npm install -g mbt

# Build
mbt build
```

**Output:** `mta_archives/compensation-extension_1.0.0.mtar`

### 6.2 Deploy to Cloud Foundry

```bash
# Login to CF (if not already)
cf login -a https://api.cf.REGION.hana.ondemand.com

# Target org and space
cf target -o YOUR_ORG -s YOUR_SPACE

# Deploy
cf deploy mta_archives/compensation-extension_1.0.0.mtar
```

### 6.3 Verify Deployment

```bash
# Check apps
cf apps

# Check services
cf services

# View logs
cf logs compensation-service --recent
```

---

## 🔄 Step 7: Update Git Remote (Optional)

**If you want to push changes to a different repository:**

```bash
# Check current remote
git remote -v

# Change remote URL
git remote set-url origin https://github.com/NEW_USERNAME/NEW_REPO.git

# Or add new remote
git remote add new-origin https://github.com/NEW_USERNAME/NEW_REPO.git
```

---

## ✅ Step 8: Verify Everything Works

### Checklist:

- [ ] Repository cloned successfully
- [ ] Dependencies installed (`npm install`)
- [ ] Local server starts (`npm start`)
- [ ] Application loads in browser
- [ ] SuccessFactors credentials configured
- [ ] Data loads from SuccessFactors
- [ ] MTA build successful
- [ ] Deployed to new BTP instance
- [ ] Application accessible in new instance
- [ ] All features working

---

## 🐛 Troubleshooting

### Issue: "Repository not found"

**Solution:**
- Verify repository URL is correct
- Check you have access to the repository
- Use HTTPS with personal access token if private

### Issue: "Build failed"

**Solution:**
```bash
# Clean and rebuild
rm -rf node_modules
rm -rf mta_archives
npm install
mbt build
```

### Issue: "Deployment failed"

**Solution:**
```bash
# Check CF login
cf target

# Check service bindings
cf services

# View detailed logs
cf logs compensation-service --recent
```

### Issue: "Service not found"

**Solution:**
- Verify user-provided service exists: `cf services`
- Check service name matches in `mta.yaml`
- Recreate service if needed

---

## 📝 Important Notes

1. **Credentials**: Each BTP instance needs its own `default-env.json` or user-provided service
2. **Database**: Each deployment creates a new HDI container
3. **URLs**: Application URLs will be different in new instance
4. **Git**: You can keep same repository or fork to new one
5. **SuccessFactors**: Can use same SF instance or different one

---

## 🎯 Quick Summary

**To deploy to new BTP instance:**

1. ✅ Clone repo in new BAS
2. ✅ Install dependencies (`npm install`)
3. ✅ Configure credentials (`default-env.json`)
4. ✅ Test locally (`npm start`)
5. ✅ Build MTA (`mbt build`)
6. ✅ Deploy (`cf deploy`)
7. ✅ Verify deployment

**That's it! Your application is now running in the new BTP instance!** 🎉
