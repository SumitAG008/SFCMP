# Quick Guide: Clone to New BTP Instance

## 🚀 5-Minute Setup

### Step 1: Clone in New BAS

**In BAS Welcome Screen:**
1. Click **"Clone from Git"**
2. Enter: `https://github.com/SumitAG008/SFCMP.git`
3. Click **"Clone"**

**OR Terminal:**
```bash
cd /home/user/projects
git clone https://github.com/SumitAG008/SFCMP.git
cd SFCMP
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Configure Credentials

**Create `default-env.json`:**
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
          "username": "YOUR_USERNAME",
          "password": "YOUR_PASSWORD",
          "companyId": "YOUR_COMPANY_ID"
        }
      }
    ]
  }
}
```

### Step 4: Test Locally

```bash
npm start
```

### Step 5: Deploy (Optional)

```bash
# Build
mbt build

# Deploy
cf login -a https://api.cf.REGION.hana.ondemand.com
cf deploy mta_archives/*.mtar
```

**Done!** ✅

---

## 📝 What Gets Cloned?

✅ All source code
✅ Configuration files
✅ Documentation
✅ Git history

❌ **NOT cloned:**
- `node_modules/` (install with `npm install`)
- `default-env.json` (create manually)
- BTP services (create in new instance)
- Database data (new instance = new database)

---

## 🔄 Same Repository, Different Instances?

**Yes!** You can:
- Use same GitHub repo for multiple BTP instances
- Each instance clones independently
- Each has its own credentials
- Each has its own database
- Changes can be synced via Git

**Workflow:**
1. Clone in Instance A → Develop
2. Push to Git
3. Pull in Instance B → Deploy
4. Both instances use same codebase!

---

## ✅ That's It!

Your application is now cloned and ready in the new BTP instance! 🎉
