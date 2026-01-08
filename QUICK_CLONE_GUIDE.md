# Quick Guide: Clone Git to New BAS

## 🚀 3-Minute Setup

### Step 1: Open BAS Welcome Screen

1. Open your new BAS dev space
2. Look for **"Clone from Git"** button
3. Click it

### Step 2: Enter Repository URL

```
https://github.com/SumitAG008/SFCMP.git
```

### Step 3: Click "Clone"

- For public repo: No authentication needed
- For private repo: Enter GitHub username and Personal Access Token

### Step 4: Install Dependencies

```bash
cd /home/user/projects/SFCMP
npm install
cd srv && npm install && cd ..
```

### Step 5: Configure Credentials

```bash
cp default-env.json.example default-env.json
# Edit default-env.json with your SF credentials
```

### Step 6: Test

```bash
npm start
```

**Done!** ✅

---

## 🔐 For Private Repository

### Create Personal Access Token:

1. Go to: `https://github.com/settings/tokens`
2. Click **"Generate new token (classic)"**
3. Select scope: ✅ `repo`
4. Copy token

### Clone with Token:

```bash
git clone https://YOUR_TOKEN@github.com/SumitAG008/SFCMP.git
```

---

## ✅ Verification

```bash
cd /home/user/projects/SFCMP
ls -la                    # Should see all files
cds --version            # Should show version
npm start               # Should start server
```

**That's it!** 🎉
