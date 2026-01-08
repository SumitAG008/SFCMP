# How to Clone Git Repository to New BAS Dev Space

## 🎯 Overview

This guide shows you how to clone your GitHub repository (`https://github.com/SumitAG008/SFCMP.git`) into a new SAP BTP BAS dev space.

---

## 🚀 Method 1: Clone from BAS Welcome Screen (Easiest)

### Step 1: Open Your New Dev Space

1. **Log into your new SAP BTP account**
2. **Open Business Application Studio**
3. **Open your dev space** (e.g., "OCOMP" or "Full Stack Cloud Application")
4. Wait for the dev space to start (takes 1-2 minutes)

### Step 2: Clone from Welcome Screen

1. **In BAS Welcome Screen**, you'll see options:
   - "Clone from Git"
   - "Create Project"
   - "Open Folder"

2. **Click "Clone from Git"** (or "Clone Git Repository")

3. **Enter your repository URL:**
   ```
   https://github.com/SumitAG008/SFCMP.git
   ```

4. **Select folder location:**
   - Default: `/home/user/projects/SFCMP`
   - Or choose a different location

5. **Click "Clone"** or "OK"

6. **If prompted for authentication:**
   - **For Public Repository:** No authentication needed
   - **For Private Repository:** Enter GitHub credentials or use Personal Access Token

### Step 3: Verify Clone

1. **Check Explorer panel** (left sidebar)
2. You should see `SFCMP` folder with all your files
3. **Open terminal** (`Ctrl + ~` or `Terminal > New Terminal`)
4. **Navigate to project:**
   ```bash
   cd /home/user/projects/SFCMP
   ls -la
   ```

---

## 🖥️ Method 2: Clone from Terminal

### Step 1: Open Terminal in BAS

1. **Open BAS dev space**
2. **Open Terminal:**
   - Press `Ctrl + ~` (tilde key)
   - Or: `Terminal > New Terminal`
   - Or: `View > Terminal`

### Step 2: Navigate to Projects Folder

```bash
# Go to projects directory
cd /home/user/projects

# List existing projects (if any)
ls -la
```

### Step 3: Clone Repository

**For Public Repository:**
```bash
git clone https://github.com/SumitAG008/SFCMP.git
```

**For Private Repository (with authentication):**
```bash
# Option 1: Using HTTPS with Personal Access Token
git clone https://YOUR_TOKEN@github.com/SumitAG008/SFCMP.git

# Option 2: Using SSH (if you've set up SSH keys)
git clone git@github.com:SumitAG008/SFCMP.git
```

### Step 4: Navigate to Project

```bash
cd SFCMP
ls -la
```

---

## 🔐 Method 3: Clone Private Repository (Authentication Setup)

### Option A: Personal Access Token (Recommended)

**1. Create GitHub Personal Access Token:**

- Go to: `https://github.com/settings/tokens`
- Click **"Generate new token"** > **"Generate new token (classic)"**
- Name: `BAS-Development`
- Select scopes:
  - ✅ `repo` (Full control of private repositories)
  - ✅ `workflow` (if using GitHub Actions)
- Click **"Generate token"**
- **Copy the token** (you won't see it again!)

**2. Clone with Token:**

```bash
git clone https://YOUR_TOKEN@github.com/SumitAG008/SFCMP.git
```

**3. Or Configure Git Credentials:**

```bash
# Set up credential helper
git config --global credential.helper store

# Clone (will prompt for username and token)
git clone https://github.com/SumitAG008/SFCMP.git
# Username: SumitAG008
# Password: YOUR_PERSONAL_ACCESS_TOKEN
```

### Option B: SSH Keys

**1. Generate SSH Key in BAS:**

```bash
# Generate SSH key
ssh-keygen -t ed25519 -C "your_email@example.com"

# Press Enter to accept default location
# Enter passphrase (optional)

# View public key
cat ~/.ssh/id_ed25519.pub
```

**2. Add SSH Key to GitHub:**

- Copy the public key output
- Go to: `https://github.com/settings/keys`
- Click **"New SSH key"**
- Title: `BAS Dev Space`
- Paste the public key
- Click **"Add SSH key"**

**3. Test SSH Connection:**

```bash
ssh -T git@github.com
# Should see: "Hi SumitAG008! You've successfully authenticated..."
```

**4. Clone with SSH:**

```bash
git clone git@github.com:SumitAG008/SFCMP.git
```

---

## ✅ After Cloning: Setup Steps

### Step 1: Install Dependencies

```bash
# Navigate to project
cd /home/user/projects/SFCMP

# Install root dependencies
npm install

# Install service dependencies
cd srv
npm install
cd ..
```

### Step 2: Configure Environment

**Create `default-env.json` (if not already in repo):**

```bash
# Copy example file
cp default-env.json.example default-env.json

# Edit with your credentials
# Use BAS editor or:
nano default-env.json
```

**Fill in your SuccessFactors credentials:**
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

### Step 3: Verify Setup

```bash
# Check CDS version
cds --version

# Check Node.js version
node --version

# Check Git status
git status

# Test build
npm start
```

---

## 🔄 Method 4: Clone from BAS Git UI

### Step 1: Open Source Control

1. **Click Git icon** in left sidebar (or `Ctrl+Shift+G`)
2. **Click "Clone Repository"**
3. **Enter URL:** `https://github.com/SumitAG008/SFCMP.git`
4. **Select folder:** `/home/user/projects/SFCMP`
5. **Click "Select Repository Location"**

### Step 2: Authenticate (if needed)

- Enter GitHub username
- Enter Personal Access Token (not password!)

---

## 📋 Complete Setup Checklist

### Before Cloning:
- [ ] New BAS dev space created ("Full Stack Cloud Application")
- [ ] Dev space is running
- [ ] You have GitHub repository URL
- [ ] You have authentication method ready (if private repo)

### Cloning:
- [ ] Repository cloned successfully
- [ ] Project folder visible in Explorer
- [ ] All files present

### After Cloning:
- [ ] `npm install` completed (root)
- [ ] `npm install` completed (srv folder)
- [ ] `default-env.json` created with credentials
- [ ] `cds --version` shows correct version
- [ ] `npm start` works without errors
- [ ] Application accessible at `http://localhost:4004`

---

## 🐛 Troubleshooting

### Issue: "Repository not found"

**Solution:**
- Check repository URL is correct
- Verify repository is public or you have access
- For private repo, use Personal Access Token

### Issue: "Authentication failed"

**Solution:**
```bash
# Clear stored credentials
git config --global --unset credential.helper
git config --global credential.helper store

# Try cloning again with token
git clone https://YOUR_TOKEN@github.com/SumitAG008/SFCMP.git
```

### Issue: "Permission denied (publickey)"

**Solution:**
- Set up SSH keys (see Method 3, Option B above)
- Or use HTTPS with Personal Access Token

### Issue: "fatal: could not read Username"

**Solution:**
- Use Personal Access Token instead of password
- Or set up SSH keys

### Issue: "npm install fails"

**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules
rm -rf node_modules srv/node_modules

# Try again
npm install
cd srv && npm install && cd ..
```

---

## 🎯 Quick Reference

### Clone Public Repository:
```bash
cd /home/user/projects
git clone https://github.com/SumitAG008/SFCMP.git
cd SFCMP
npm install
cd srv && npm install && cd ..
```

### Clone Private Repository (with Token):
```bash
cd /home/user/projects
git clone https://YOUR_TOKEN@github.com/SumitAG008/SFCMP.git
cd SFCMP
npm install
cd srv && npm install && cd ..
```

### Clone Private Repository (with SSH):
```bash
cd /home/user/projects
git clone git@github.com:SumitAG008/SFCMP.git
cd SFCMP
npm install
cd srv && npm install && cd ..
```

---

## 📝 Summary

**Easiest Method:**
1. ✅ Open BAS Welcome Screen
2. ✅ Click "Clone from Git"
3. ✅ Enter: `https://github.com/SumitAG008/SFCMP.git`
4. ✅ Click "Clone"
5. ✅ Run `npm install` in root and `srv` folders

**For Private Repositories:**
- Use Personal Access Token (recommended)
- Or set up SSH keys

**After Cloning:**
- Install dependencies: `npm install`
- Configure credentials: `default-env.json`
- Test: `npm start`

**That's it! Your repository is now cloned and ready in your new BAS dev space!** 🎉
