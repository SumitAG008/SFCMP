# BAS Troubleshooting - Missing package.json

## Issue
`npm install` fails because `package.json` is not found.

## Solution

### Step 1: Check Current Location
```bash
pwd
```

### Step 2: List Files in Current Directory
```bash
ls -la
```

### Step 3: Find package.json
```bash
find . -name "package.json" -type f
```

### Step 4: Navigate to Correct Directory
If package.json is in a subdirectory:
```bash
# If files are in the root
cd ~/projects/SFCMP

# Or check what's actually there
ls -la ~/projects/
```

### Step 5: Verify Files Are Cloned
Check if all files are present:
```bash
ls -la
# Should show: app/, db/, srv/, package.json, etc.
```

### Step 6: If Files Are Missing
If package.json is missing, you may need to:
1. Re-clone the repository
2. Or pull the latest from GitHub

## Quick Fix

Try these commands in order:

```bash
# 1. Check where you are
pwd

# 2. Go to projects root
cd ~/projects

# 3. List what's there
ls -la

# 4. If SFCMP exists, go into it
cd SFCMP

# 5. Check if package.json exists
ls -la package.json

# 6. If it exists, install
npm install
```

## Alternative: Re-clone Repository

If files are missing:

```bash
# Go to projects directory
cd ~/projects

# Remove existing (if needed)
rm -rf SFCMP

# Clone fresh
git clone https://github.com/SumitAG008/SFCMP.git

# Go into project
cd SFCMP

# Install
npm install
```
