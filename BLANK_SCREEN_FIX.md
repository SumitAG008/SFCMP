# Fix Blank Screen Issue

## Problem
The UI5 application shows a blank screen when accessed.

## Root Causes

1. **Routing Configuration Conflict**: The manifest.json has routing configured but no App control in the view
2. **OData Model Failing**: The OData model might fail to load, preventing view rendering
3. **Missing Model Initialization**: Compensation model not properly initialized

## Solutions Applied

### Fix 1: Removed Routing Configuration
- Removed routing from manifest.json since we're using rootView
- Routing was looking for control ID "app" which doesn't exist

### Fix 2: Changed to JSONModel
- Changed compensation model from OData to JSONModel
- OData model requires service to be running and accessible
- JSONModel works immediately and can be populated via API calls

### Fix 3: Proper Model Initialization
- Initialize compensation model in Component.js
- Set default values
- Ensure model exists before view tries to use it

## Testing

### Step 1: Pull Latest Changes
```bash
git pull origin main
```

### Step 2: Restart Application
```bash
# Stop current server (Ctrl+C)
npm start
```

### Step 3: Check Browser Console
- Open Developer Tools (F12)
- Check Console tab for errors
- Check Network tab for failed requests

### Step 4: Verify View Loads
- Should see "Compensation Worksheet" title
- Should see input fields for Company ID, User ID, Form ID
- Should see empty compensation table

## If Still Blank

### Check 1: Browser Console Errors
```javascript
// Open browser console (F12)
// Look for errors like:
// - "Failed to load resource"
// - "Control with ID app could not be found"
// - "Cannot read property of undefined"
```

### Check 2: Verify Files Exist
```bash
# In BAS terminal
ls -la app/webapp/view/CompensationWorksheet.view.xml
ls -la app/webapp/controller/CompensationWorksheet.controller.js
ls -la app/webapp/Component.js
```

### Check 3: Check Server Logs
```bash
# In BAS terminal where npm start is running
# Look for errors in the console output
```

### Check 4: Verify Service is Running
```bash
# Check if CAP server is running
# Should see: [cds] - server listening on http://localhost:4004
```

## Alternative: Simple Test View

If the view still doesn't load, try a simple test:

1. Create a minimal view to test
2. Verify UI5 is loading
3. Gradually add components back

## Expected Result

After fixes, you should see:
- ✅ Page title: "Compensation Worksheet"
- ✅ Header with buttons: Refresh, Save, Budgets, Approvals
- ✅ Form section with: Company ID, User ID, Form ID, Effective Date
- ✅ Summary section
- ✅ Compensation Worksheet table (empty initially)
