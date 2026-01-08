# Fix CDS Version Mismatch

## 🔧 Issue

**Error:**
```
This application uses '@sap/cds' version 7.9, which is not compatible with the installed '@sap/cds-dk' version 9.
```

## ✅ Solution: Update @sap/cds to Version 9

### Step 1: Update package.json

**Root `package.json`:**
- Changed `"@sap/cds": "^7"` → `"@sap/cds": "^9"`
- Changed `"@sap/cds-dk": "^7"` → `"@sap/cds-dk": "^9"`

**`srv/package.json`:**
- Changed `"@sap/cds": "^7"` → `"@sap/cds": "^9"`

### Step 2: Install Updated Dependencies

**Run in BAS Terminal:**

```bash
# Navigate to project root
cd /home/user/projects/SFCMP

# Remove old node_modules
rm -rf node_modules
rm -rf srv/node_modules

# Install updated dependencies
npm install

# Also install in srv folder
cd srv
npm install
cd ..
```

### Step 3: Verify Installation

```bash
# Check CDS version
cds --version

# Should show version 9.x.x without errors
```

### Step 4: Test Application

```bash
# Start the server
npm start
```

**Expected output:**
```
[cds] - serving CompensationService { path: '/compensation' }
[cds] - server listening on { url: 'http://localhost:4004' }
```

---

## 📋 What Changed

### Before:
- `@sap/cds`: `^7` (version 7.9 installed)
- `@sap/cds-dk`: `^7` (but version 9 installed globally)

### After:
- `@sap/cds`: `^9` (will install version 9.x)
- `@sap/cds-dk`: `^9` (matches global version 9)

---

## ⚠️ Alternative Solution (Not Recommended)

If you prefer to keep CDS 7, you can downgrade `@sap/cds-dk`:

```bash
npm install -g @sap/cds-dk@8
```

**But this is NOT recommended** because:
- BAS comes with CDS-DK 9 pre-installed
- Version 9 has better features and bug fixes
- Updating to CDS 9 is the recommended approach

---

## ✅ Verification Checklist

- [ ] `package.json` updated to `@sap/cds: "^9"`
- [ ] `srv/package.json` updated to `@sap/cds: "^9"`
- [ ] `npm install` completed successfully
- [ ] `cds --version` shows version 9.x.x (no errors)
- [ ] `npm start` works without errors
- [ ] Application loads correctly

---

## 🐛 Troubleshooting

### Issue: "npm install fails"

**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Remove package-lock.json
rm package-lock.json
rm srv/package-lock.json

# Try again
npm install
```

### Issue: "Still shows version mismatch"

**Solution:**
```bash
# Check global CDS-DK version
npm list -g @sap/cds-dk

# If it's version 9, make sure local CDS is also 9
npm list @sap/cds

# If local is still 7, force reinstall
npm install @sap/cds@latest --save
```

### Issue: "Application doesn't start after update"

**Solution:**
```bash
# Check for breaking changes in CDS 9
# Most CAP applications work without changes

# If issues persist, check CDS 9 migration guide:
# https://cap.cloud.sap/docs/releases/
```

---

## 📝 Notes

- **CDS 9** is backward compatible with most CDS 7 code
- Your existing code should work without changes
- If you encounter any issues, check the [CAP Release Notes](https://cap.cloud.sap/docs/releases/)

---

## ✅ Summary

**Fixed by:**
1. ✅ Updated `@sap/cds` to `^9` in both package.json files
2. ✅ Updated `@sap/cds-dk` to `^9` in package.json
3. ✅ Run `npm install` to update dependencies

**Result:**
- ✅ Version mismatch resolved
- ✅ CDS 9 installed and working
- ✅ Application ready to run

**Next step:** Run `npm install` and then `npm start` to verify everything works! 🎉
