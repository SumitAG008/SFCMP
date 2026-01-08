# Why Run `npm start` from Root (SFCMP), Not from `srv`

## 🎯 Quick Answer

**You should run `npm start` from the ROOT directory (`SFCMP`), not from `srv`!**

### Correct Way:
```bash
user: SFCMP $ npm start
```

### Why Not from `srv`:
- `srv/package.json` has `"start": "node server.js"` (custom server)
- Root `package.json` has `"start": "cds run"` (standard CAP command) ✅
- `mta.yaml` is in root, so `mbt build` must run from root
- CDS configuration is in root `package.json`

---

## 📁 Directory Structure Explained

```
SFCMP/                          ← ROOT (run commands here!)
├── package.json                ← Main package.json with "cds run"
├── mta.yaml                    ← MTA configuration (must be in root)
├── db/
│   └── schema.cds
├── srv/                        ← Service layer
│   ├── package.json            ← Has "node server.js" (for deployment)
│   ├── server.js               ← Custom server (optional)
│   └── compensation-service.cds
└── app/                        ← UI5 frontend
    └── webapp/
```

---

## 🔍 Why You're Seeing Version 7.9

### The Problem:
Even though `srv/package.json` shows `"@sap/cds": "^9"`, npm installed version 7.9.5 because:
- `package-lock.json` still has version 7 locked
- npm cache might have old version
- Need to delete `node_modules` and `package-lock.json`

### The Fix:
```bash
# Go to root
cd /home/user/projects/SFCMP

# Delete old dependencies
rm -rf node_modules
rm -rf srv/node_modules
rm -f package-lock.json
rm -f srv/package-lock.json

# Fresh install
npm install
cd srv && npm install && cd ..

# Verify
cds --version
# Should show 9.x.x
```

---

## ✅ Correct Workflow

### 1. Always Start from Root:
```bash
user: SFCMP $ pwd
/home/user/projects/SFCMP

user: SFCMP $ npm start
```

### 2. For MTA Build:
```bash
user: SFCMP $ mbt build
# mta.yaml is in root, so must run from root
```

### 3. For CDS Commands:
```bash
user: SFCMP $ cds --version
user: SFCMP $ cds watch
user: SFCMP $ cds deploy
```

---

## 🔄 Why `srv/npm start` Works But Isn't Recommended

### What Happens in `srv`:
```bash
user: srv $ npm start
> node server.js
```
- Runs your **custom server** (`server.js`)
- This is a **workaround**, not the standard way
- Works, but bypasses CAP's built-in server

### What Happens in Root:
```bash
user: SFCMP $ npm start
> cds run
[cds] - serving CompensationService { path: '/compensation' }
[cds] - server listening on { url: 'http://localhost:4004' }
```
- Runs **CAP's standard server** ✅
- Uses all CAP features (auto-reload, service discovery, etc.)
- **This is the correct way!**

---

## 🐛 Current Issues to Fix

### Issue 1: CDS Still Version 7.9
**Problem:** `npm install` in `srv` installed old version

**Fix:**
```bash
cd /home/user/projects/SFCMP
rm -rf node_modules srv/node_modules
rm -f package-lock.json srv/package-lock.json
npm install
cd srv && npm install && cd ..
cds --version  # Should show 9.x.x
```

### Issue 2: `mbt build` Error
**Problem:** Running from `srv` directory, but `mta.yaml` is in root

**Fix:**
```bash
cd /home/user/projects/SFCMP  # Go to root
mbt build  # Now it will find mta.yaml
```

### Issue 3: Navigation Confusion
**Problem:** `cd SFCMP` fails because you're already inside it

**Fix:**
```bash
# If you're in srv, go back to root:
cd /home/user/projects/SFCMP
# OR
cd ..  # Go up one level from srv
```

---

## 📋 Complete Correct Workflow

```bash
# 1. Navigate to root
cd /home/user/projects/SFCMP

# 2. Clean install (to fix CDS version)
rm -rf node_modules srv/node_modules
rm -f package-lock.json srv/package-lock.json
npm install
cd srv && npm install && cd ..

# 3. Verify CDS version
cds --version
# Should show: @sap/cds 9.x.x

# 4. Start application (from root!)
npm start

# 5. Build MTA (from root!)
mbt build
```

---

## ✅ Summary

| Command | Run From | Why |
|---------|----------|-----|
| `npm start` | **Root (SFCMP)** | Uses `cds run` from root package.json |
| `mbt build` | **Root (SFCMP)** | `mta.yaml` is in root |
| `cds --version` | **Root (SFCMP)** | CDS config in root package.json |
| `cds watch` | **Root (SFCMP)** | Watches entire project |
| `cds deploy` | **Root (SFCMP)** | Deploys from root |

**Remember:** Always work from the **ROOT directory** (`SFCMP`)! 🎯
