# Your SAP BTP Setup Guide

## ✅ Your Configuration

- **BTP API Endpoint**: `https://api.cf.us10-001.hana.ondemand.com`
- **Region**: `us10-001` (US East - Trial)
- **GitHub Repository**: `https://github.com/SumitAG008/SFCMP`

---

## 📸 What to Choose in Business Application Studio

Based on your screenshot, here's exactly what to select:

### **Option 1: "Full-Stack Cloud Application" (RECOMMENDED)**
If this option is available in your list, **SELECT THIS**:
- ✅ Best for SAP CAP projects
- ✅ Includes all CAP development tools
- ✅ Supports both backend (CAP) and frontend (UI5)
- ✅ Perfect for your SuccessFactors extension

### **Option 2: "SAP Fiori Dev Space" (If Full-Stack not available)**
If "Full-Stack Cloud Application" is not visible, select **"SAP Fiori Dev Space"**:

#### ✅ Predefined Extensions (Auto-selected - Keep these):
- ✅ **Basic Tools** - For build and deployment
- ✅ **MTA Tools** - For Multi-Target Application (your `mta.yaml`)
- ✅ **Fiori Freestyle Tools** - For UI5 frontend
- ✅ **HTML5 Runner** - For local testing

#### ✅ Additional Extensions to ENABLE (Check these boxes):
- ✅ **CDS Graphical Modeler** - Visualize your CAP data models (`db/schema.cds`)
- ✅ **Application Frontend Service CLI** - Frontend deployment tools

#### ❌ You can skip these (optional):
- SAPUI5 Adaptation Project
- Docker Image Builder

### Dev Space Name
- Use: **"OCOMP"** (as you have) or **"sf-compensation"**

### Then Click: **"Create Dev Space"** (Blue button)

---

## 🔗 How GitHub Interacts with SAP BTP CAP

### Method 1: Direct Development in BAS (Recommended)

**Workflow**:
```
GitHub ←→ Business Application Studio ←→ SAP BTP
```

1. **Clone GitHub in BAS**:
   ```bash
   git clone https://github.com/SumitAG008/SFCMP.git
   cd SFCMP
   ```

2. **Develop in BAS**:
   - Edit files directly in BAS
   - Test locally: `npm start`

3. **Commit & Push to GitHub**:
   ```bash
   git add .
   git commit -m "Your changes"
   git push origin main
   ```

4. **Deploy to BTP**:
   ```bash
   mbt build
   cf deploy mta_archives/*.mtar
   ```

### Method 2: Automated CI/CD (GitHub Actions)

**Workflow**:
```
GitHub → GitHub Actions → SAP BTP (Automatic)
```

I've already created `.github/workflows/deploy-to-btp.yml` for you!

**Setup Steps**:

1. **Add GitHub Secrets**:
   - Go to: `https://github.com/SumitAG008/SFCMP/settings/secrets/actions`
   - Click "New repository secret"
   - Add these secrets:
     ```
     CF_API = https://api.cf.us10-001.hana.ondemand.com
     CF_ORG = [Your Cloud Foundry Organization]
     CF_SPACE = [Your Cloud Foundry Space]
     CF_USERNAME = [Your BTP Email]
     CF_PASSWORD = [Your BTP Password]
     ```

2. **Push Code to GitHub**:
   ```bash
   git add .
   git commit -m "Add GitHub Actions workflow"
   git push origin main
   ```

3. **Automatic Deployment**:
   - Every push to `main` branch automatically:
     - Builds MTA archive
     - Deploys to your BTP instance
   - Check status: GitHub > Actions tab

### Method 3: SAP Build (Alternative CI/CD)

1. Go to: `https://build.cloud.sap`
2. Create new project
3. Connect GitHub: `https://github.com/SumitAG008/SFCMP`
4. Configure deployment to: `https://api.cf.us10-001.hana.ondemand.com`

---

## 🚀 Complete Setup Process

### Step 1: Create Dev Space in BAS
- Select: "Full-Stack Cloud Application" or "SAP Fiori Dev Space"
- Enable: MTA Tools, CDS Graphical Modeler
- Name: `OCOMP`
- Click: "Create Dev Space"

### Step 2: Clone GitHub Repository
```bash
git clone https://github.com/SumitAG008/SFCMP.git
cd SFCMP
npm install
```

### Step 3: Configure Cloud Foundry
```bash
# Login
cf login -a https://api.cf.us10-001.hana.ondemand.com

# Create SuccessFactors service
cf create-user-provided-service successfactors-credentials \
  -p '{"url":"https://api.successfactors.eu","username":"sfadmin","password":"Part@dc57","companyId":"SFHUB003674"}'
```

### Step 4: Test Locally
```bash
npm start
# Open: http://localhost:4004/app/index.html
```

### Step 5: Deploy to BTP
```bash
mbt build
cf deploy mta_archives/successfactors-compensation-extension_1.0.0.mtar
```

### Step 6: Push to GitHub
```bash
git add .
git commit -m "SuccessFactors Compensation Extension"
git push -u origin main
```

---

## 📋 Integration Summary

### GitHub ↔ BAS ↔ BTP Flow

```
┌─────────┐         ┌─────────┐         ┌─────────┐
│ GitHub  │ ◄─────► │   BAS   │ ◄─────► │   BTP   │
│  Repo   │  Git    │  Dev    │  CF     │  Cloud  │
│         │  Push   │  Space  │  Deploy │         │
└─────────┘         └─────────┘         └─────────┘
     ▲                                      ▲
     │                                      │
     └────────── GitHub Actions ───────────┘
              (Auto Deploy on Push)
```

### What Happens:

1. **You code in BAS** → Files saved locally
2. **You commit & push** → Code goes to GitHub
3. **GitHub Actions triggers** → Automatically builds & deploys to BTP
4. **Your app is live** → Accessible on BTP

---

## 🎯 Quick Reference

### Dev Space Selection
- ✅ **"Full-Stack Cloud Application"** (Best)
- ✅ **"SAP Fiori Dev Space"** (Alternative)
- ✅ Enable: MTA Tools, CDS Graphical Modeler

### GitHub Integration
- ✅ Clone repo in BAS: `git clone https://github.com/SumitAG008/SFCMP.git`
- ✅ Push changes: `git push origin main`
- ✅ Auto-deploy: Configure GitHub Actions secrets

### BTP Deployment
- ✅ API: `https://api.cf.us10-001.hana.ondemand.com`
- ✅ Deploy: `cf deploy mta_archives/*.mtar`

---

**You're all set!** 🎉

Follow `BAS_QUICKSTART.md` for detailed step-by-step instructions.
