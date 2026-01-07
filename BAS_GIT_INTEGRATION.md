# Git Integration with SAP Business Application Studio

## Overview

This guide shows you how to integrate your GitHub repository (`https://github.com/SumitAG008/SFCMP`) with your SAP Business Application Studio instance.

**Your BAS URL**: `https://45dc37cbtrial.us10cf.trial.applicationstudio.cloud.sap/index.html`

---

## Method 1: Clone from Git (Recommended)

### Step 1: Open BAS and Navigate to Git Clone

1. **In your BAS Dev Space** (OCOMP), you should see the "Get Started" page
2. **Click "Clone from Git"** (visible in the main content area)
   - Or use: `File > Clone from Git...`

### Step 2: Enter GitHub Repository URL

1. **A dialog will appear** asking for the repository URL
2. **Enter your GitHub URL**:
   ```
   https://github.com/SumitAG008/SFCMP.git
   ```
3. **Click "Clone"**

### Step 3: Select Folder Location

1. **Choose where to clone** (usually the workspace root)
2. **Click "Select Folder"**

### Step 4: Authentication (if prompted)

If GitHub asks for authentication:
- **Option 1**: Use Personal Access Token
  - GitHub > Settings > Developer settings > Personal access tokens
  - Create token with `repo` permissions
  - Use token as password when prompted

- **Option 2**: Use GitHub credentials
  - Enter your GitHub username
  - Enter your GitHub password (or token)

---

## Method 2: Using Terminal in BAS

### Step 1: Open Terminal

1. **Open Terminal** in BAS:
   - `Terminal > New Terminal`
   - Or press `` Ctrl+` `` (backtick)

### Step 2: Clone Repository

```bash
# Navigate to workspace (if needed)
cd ~/projects

# Clone your repository
git clone https://github.com/SumitAG008/SFCMP.git

# Navigate into the project
cd SFCMP

# Check status
git status
```

### Step 3: Configure Git (if not already done)

```bash
# Set your Git identity
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

---

## Method 3: Using Source Control Panel

### Step 1: Open Source Control

1. **Click the Source Control icon** in the left sidebar (Git branch icon)
2. **Or use**: `View > Source Control`
3. **Or press**: `Ctrl+Shift+G`

### Step 2: Initialize Repository (if not cloned)

If you want to initialize a new Git repo in BAS:

```bash
# In terminal
cd ~/projects
git init
git remote add origin https://github.com/SumitAG008/SFCMP.git
git fetch
git checkout -b main
```

### Step 3: Use Source Control UI

1. **Stage changes**: Click `+` next to files
2. **Commit**: Enter message and click ✓
3. **Push**: Click `...` > Push

---

## Step-by-Step: Complete Git Setup in BAS

### 1. Clone Repository

**In BAS Terminal**:
```bash
# Clone your repository
git clone https://github.com/SumitAG008/SFCMP.git

# Navigate to project
cd SFCMP

# List files to verify
ls -la
```

### 2. Install Dependencies

```bash
# Install npm packages
npm install
```

### 3. Configure Git (if needed)

```bash
# Set Git user (replace with your info)
git config --global user.name "Sumit"
git config --global user.email "your.email@example.com"

# Verify configuration
git config --global --list
```

### 4. Verify Git Connection

```bash
# Check remote
git remote -v

# Should show:
# origin  https://github.com/SumitAG008/SFCMP.git (fetch)
# origin  https://github.com/SumitAG008/SFCMP.git (push)
```

### 5. Pull Latest Changes (if any)

```bash
# Pull latest from GitHub
git pull origin main
```

---

## Working with Git in BAS

### Daily Workflow

#### 1. **Pull Latest Changes**
```bash
git pull origin main
```

#### 2. **Make Changes**
- Edit files in BAS
- Files will show in Source Control panel

#### 3. **Stage Changes**
- **Via UI**: Click `+` next to files in Source Control panel
- **Via Terminal**: `git add .`

#### 4. **Commit Changes**
- **Via UI**: Enter message, click ✓
- **Via Terminal**: `git commit -m "Your commit message"`

#### 5. **Push to GitHub**
- **Via UI**: Click `...` > Push
- **Via Terminal**: `git push origin main`

---

## Using Source Control Panel (Visual Git)

### Access Source Control

1. **Click Git icon** in left sidebar (branch icon)
2. **Or**: `View > Source Control`
3. **Or**: `Ctrl+Shift+G`

### Visual Git Operations

#### Stage Files
- Click `+` next to file name
- Or click `+` next to "Changes" to stage all

#### Commit
1. Enter commit message in text box
2. Click ✓ (checkmark) button
3. Or press `Ctrl+Enter`

#### Push/Pull
1. Click `...` (three dots) menu
2. Select:
   - **Push** - Send to GitHub
   - **Pull** - Get from GitHub
   - **Fetch** - Check for updates
   - **Sync** - Pull then Push

#### Branch Management
1. Click branch name (bottom left)
2. Create new branch
3. Switch branches
4. Merge branches

---

## Git Authentication Setup

### Personal Access Token (Recommended)

1. **Create Token on GitHub**:
   - Go to: `https://github.com/settings/tokens`
   - Click "Generate new token (classic)"
   - Name: "BAS Access"
   - Select scopes: `repo` (all)
   - Generate token
   - **Copy token** (you won't see it again!)

2. **Use Token in BAS**:
   - When Git asks for password, use the token
   - Username: Your GitHub username
   - Password: The token you copied

### SSH Keys (Alternative)

1. **Generate SSH Key in BAS**:
   ```bash
   ssh-keygen -t ed25519 -C "your.email@example.com"
   # Press Enter to accept default location
   # Enter passphrase (optional)
   ```

2. **Copy Public Key**:
   ```bash
   cat ~/.ssh/id_ed25519.pub
   # Copy the output
   ```

3. **Add to GitHub**:
   - Go to: `https://github.com/settings/keys`
   - Click "New SSH key"
   - Paste the public key
   - Save

4. **Update Remote URL**:
   ```bash
   git remote set-url origin git@github.com:SumitAG008/SFCMP.git
   ```

---

## Troubleshooting

### Issue: "Repository not found" or "Authentication failed"

**Solution**:
1. Check repository URL is correct
2. Verify you have access to the repository
3. Use Personal Access Token instead of password

### Issue: "Permission denied (publickey)"

**Solution**:
1. Set up SSH keys (see above)
2. Or use HTTPS with Personal Access Token

### Issue: Git commands not found

**Solution**:
```bash
# Git should be pre-installed in BAS
# If not, check terminal
which git
```

### Issue: Can't push to GitHub

**Solution**:
1. Check authentication: `git remote -v`
2. Verify branch name: `git branch`
3. Pull first: `git pull origin main`
4. Then push: `git push origin main`

---

## Quick Reference Commands

```bash
# Clone repository
git clone https://github.com/SumitAG008/SFCMP.git

# Check status
git status

# Add all changes
git add .

# Commit
git commit -m "Your message"

# Push to GitHub
git push origin main

# Pull from GitHub
git pull origin main

# Create new branch
git checkout -b feature/new-feature

# Switch branch
git checkout main

# View branches
git branch

# View remote
git remote -v
```

---

## BAS Git Integration Features

### Built-in Git Support

BAS includes:
- ✅ **Git extension** (pre-installed)
- ✅ **Source Control panel** (visual Git UI)
- ✅ **GitLens** (advanced Git features)
- ✅ **Terminal** (command-line Git)

### GitLens Features

GitLens provides:
- File history
- Line-by-line blame
- Commit search
- Branch comparison
- Pull request integration

---

## Next Steps After Git Integration

1. **Clone Repository**:
   ```bash
   git clone https://github.com/SumitAG008/SFCMP.git
   cd SFCMP
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Start Development**:
   ```bash
   npm start
   ```

4. **Make Changes and Commit**:
   ```bash
   git add .
   git commit -m "Initial setup in BAS"
   git push origin main
   ```

---

## Summary

✅ **Clone from Git**: Use "Clone from Git" button in BAS  
✅ **Terminal**: Use `git clone` command  
✅ **Source Control Panel**: Visual Git UI in sidebar  
✅ **Authentication**: Use Personal Access Token  
✅ **Daily Workflow**: Pull → Edit → Commit → Push  

**Your repository is ready to use in BAS!** 🚀
