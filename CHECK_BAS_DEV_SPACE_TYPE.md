# How to Check Your BAS Dev Space Type

## 🎯 Overview

This guide helps you identify which dev space type you're using in SAP Business Application Studio (BAS) and understand the differences.

---

## 🔍 Method 1: Check in BAS UI

### Step 1: View Dev Space Details

1. **Open BAS** in your BTP account
2. Click on **"Dev Spaces"** in the left sidebar (or top menu)
3. You'll see a list of your dev spaces
4. **Hover over or click** on your dev space name
5. Look for the **"Type"** or **"Template"** column

**You'll see one of these:**
- `Full Stack Cloud Application`
- `SAP Predefined Extensions`
- `Additional SAP Extensions`
- `SAP Fiori`
- `SAP Mobile`
- etc.

---

## 🔍 Method 2: Check via Terminal

### Check Installed Tools

**Open Terminal in BAS** (`Ctrl + ~` or `Terminal > New Terminal`):

```bash
# Check if CDS is installed (Full Stack usually has this)
cds --version

# Check if MTA tools are available
mbt --version

# Check Node.js version
node --version

# Check npm packages
npm list -g --depth=0
```

**Full Stack Cloud Application** typically includes:
- ✅ `@sap/cds-dk` (CDS Development Kit)
- ✅ `mbt` (MTA Build Tool)
- ✅ Node.js runtime
- ✅ Git
- ✅ Cloud Foundry CLI

---

## 🔍 Method 3: Check Project Structure

### Look for These Files/Folders

**Full Stack Cloud Application** projects usually have:
- ✅ `package.json` with `@sap/cds` dependencies
- ✅ `mta.yaml` or `manifest.yml`
- ✅ `srv/` folder (service layer)
- ✅ `db/` folder (database schema)
- ✅ `app/` folder (UI5 application)

**Check your project:**

```bash
# List project structure
ls -la

# Check package.json
cat package.json | grep -A 5 "dependencies"

# Check if mta.yaml exists
ls -la mta.yaml
```

---

## 📊 Dev Space Types Comparison

### 1. Full Stack Cloud Application

**Best for:** CAP (Cloud Application Programming Model) projects

**Includes:**
- ✅ SAP Cloud Application Programming Model (CAP)
- ✅ Node.js runtime
- ✅ MTA Build Tool
- ✅ Cloud Foundry CLI
- ✅ Git
- ✅ Database tools (HDI, SQL)
- ✅ OData service development

**Your project type:** ✅ **This is what you need!**

---

### 2. SAP Predefined Extensions

**Best for:** Extending SAP standard applications

**Includes:**
- ✅ SAP Fiori Elements tools
- ✅ Extension tools
- ✅ Key user tools
- ⚠️ Limited CAP support
- ⚠️ May need additional tools

**Not ideal for:** Standalone CAP applications

---

### 3. Additional SAP Extensions

**Best for:** Custom extensions with additional tools

**Includes:**
- ✅ Extension development tools
- ✅ Custom UI5 development
- ⚠️ May need to install CAP tools manually

**May require:** Manual installation of `@sap/cds-dk`

---

## ✅ Verify Your Current Setup

### Quick Check Script

**Run this in BAS Terminal:**

```bash
#!/bin/bash
echo "=== Dev Space Type Check ==="
echo ""

# Check CDS
if command -v cds &> /dev/null; then
    echo "✅ CDS installed: $(cds --version)"
else
    echo "❌ CDS not found"
fi

# Check MTA
if command -v mbt &> /dev/null; then
    echo "✅ MTA Build Tool installed: $(mbt --version)"
else
    echo "❌ MTA Build Tool not found"
fi

# Check Node.js
if command -v node &> /dev/null; then
    echo "✅ Node.js: $(node --version)"
else
    echo "❌ Node.js not found"
fi

# Check CF CLI
if command -v cf &> /dev/null; then
    echo "✅ Cloud Foundry CLI: $(cf --version)"
else
    echo "❌ CF CLI not found"
fi

# Check project structure
echo ""
echo "=== Project Structure ==="
if [ -f "package.json" ]; then
    echo "✅ package.json found"
    if grep -q "@sap/cds" package.json; then
        echo "✅ CAP dependencies found"
    fi
else
    echo "❌ package.json not found"
fi

if [ -f "mta.yaml" ]; then
    echo "✅ mta.yaml found"
else
    echo "⚠️  mta.yaml not found (may use manifest.yml)"
fi

if [ -d "srv" ]; then
    echo "✅ srv/ folder found"
else
    echo "❌ srv/ folder not found"
fi

if [ -d "db" ]; then
    echo "✅ db/ folder found"
else
    echo "❌ db/ folder not found"
fi

echo ""
echo "=== Conclusion ==="
if command -v cds &> /dev/null && [ -f "package.json" ] && [ -d "srv" ]; then
    echo "✅ You're using: Full Stack Cloud Application (or compatible)"
    echo "✅ Perfect for CAP development!"
else
    echo "⚠️  You may need: Full Stack Cloud Application dev space"
    echo "⚠️  Or install missing tools manually"
fi
```

**Save as `check-dev-space.sh` and run:**

```bash
chmod +x check-dev-space.sh
./check-dev-space.sh
```

---

## 🔄 How to Change Dev Space Type

### Option 1: Create New Dev Space (Recommended)

1. **In BAS:**
   - Go to **"Dev Spaces"**
   - Click **"Create Dev Space"**
   - Select **"Full Stack Cloud Application"**
   - Name it (e.g., `compensation-extension`)
   - Click **"Create"**

2. **Clone your project:**
   ```bash
   cd /home/user/projects
   git clone https://github.com/SumitAG008/SFCMP.git
   cd SFCMP
   npm install
   ```

3. **Delete old dev space** (optional, after verifying new one works)

---

### Option 2: Install Missing Tools Manually

**If you're in a different dev space type, install CAP tools:**

```bash
# Install CDS Development Kit globally
npm install -g @sap/cds-dk

# Install MTA Build Tool
npm install -g mbt

# Verify installation
cds --version
mbt --version
```

**Note:** This may not work in all dev space types. Creating a new "Full Stack Cloud Application" dev space is recommended.

---

## 📋 What Your Project Needs

**Based on your project structure, you need:**

✅ **Full Stack Cloud Application** dev space because:
- You use CAP (Cloud Application Programming Model)
- You have `srv/compensation-service.cds` (CDS service)
- You have `db/schema.cds` (CDS database schema)
- You use `mta.yaml` for deployment
- You need OData v4 service support

---

## 🎯 Quick Identification

**Answer these questions:**

1. **Can you run `cds --version`?**
   - ✅ Yes → Likely "Full Stack Cloud Application"
   - ❌ No → Different type or tools not installed

2. **Do you have `mta.yaml` in your project?**
   - ✅ Yes → Designed for "Full Stack Cloud Application"
   - ❌ No → May be different project type

3. **Can you run `npm start` and see CAP server?**
   - ✅ Yes → You're in the right dev space type!
   - ❌ No → Check dev space type or install tools

---

## ✅ Summary

**To check your dev space type:**

1. ✅ **BAS UI:** Dev Spaces → Check "Type" column
2. ✅ **Terminal:** Run `cds --version` and `mbt --version`
3. ✅ **Project:** Check for `mta.yaml`, `srv/`, `db/` folders

**For your project, you need:**
- ✅ **Full Stack Cloud Application** dev space

**If you're not sure:**
- ✅ Run the check script above
- ✅ Or create a new "Full Stack Cloud Application" dev space
- ✅ Clone your repo there and test

---

## 🚀 Next Steps

1. **Check your current dev space type** (use methods above)
2. **If not "Full Stack Cloud Application":**
   - Create new dev space with correct type
   - Clone your repo
   - Install dependencies
3. **Verify everything works:**
   ```bash
   npm install
   npm start
   ```

**That's it!** Now you know which dev space type you're using! 🎉
