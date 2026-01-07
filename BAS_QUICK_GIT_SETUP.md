# Quick Git Setup in BAS - Step by Step

## 🚀 Fastest Way: Clone from Git Button

### Step 1: In BAS "Get Started" Page
1. Look for **"Clone from Git"** button
2. Click it

### Step 2: Enter Repository URL
```
https://github.com/SumitAG008/SFCMP.git
```

### Step 3: Select Folder
- Choose workspace folder
- Click "Select Folder"

### Step 4: Authentication
- **Username**: Your GitHub username
- **Password**: Your GitHub Personal Access Token (not password!)

**Get Personal Access Token**:
1. Go to: https://github.com/settings/tokens
2. Generate new token (classic)
3. Select `repo` scope
4. Copy token and use as password

---

## 🖥️ Alternative: Terminal Method

### Open Terminal in BAS
- Press `` Ctrl+` `` (backtick)
- Or: `Terminal > New Terminal`

### Run Commands
```bash
# Clone repository
git clone https://github.com/SumitAG008/SFCMP.git

# Go into project
cd SFCMP

# Install dependencies
npm install

# Check Git status
git status
```

---

## 📋 After Cloning

### Verify Setup
```bash
# Check you're in the right directory
pwd
# Should show: .../SFCMP

# List files
ls -la
# Should show: app/, db/, srv/, package.json, etc.

# Check Git remote
git remote -v
# Should show: https://github.com/SumitAG008/SFCMP.git
```

### Start Development
```bash
# Start CAP server
npm start
```

---

## 🔄 Daily Git Workflow

### Pull Latest
```bash
git pull origin main
```

### Make Changes
- Edit files in BAS
- Files show in Source Control panel (Git icon)

### Commit & Push
```bash
git add .
git commit -m "Your changes"
git push origin main
```

**Or use Source Control Panel**:
1. Click Git icon (left sidebar)
2. Click `+` to stage files
3. Enter commit message
4. Click ✓ to commit
5. Click `...` > Push

---

## ✅ Done!

Your Git is integrated. You can now:
- ✅ Pull code from GitHub
- ✅ Make changes in BAS
- ✅ Commit and push to GitHub
- ✅ Use visual Git UI or terminal

**Happy coding!** 🎉
