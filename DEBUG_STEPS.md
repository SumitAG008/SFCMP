# Debug Steps - Page Not Loading

## Current Issue
- Page title shows "Compensation Worksheet" ✅
- Header buttons visible ✅
- But content (panels, forms, table) is blank ❌

## Debug Steps

### Step 1: Check Browser Console
Open F12 → Console tab and look for:
- `=== UI5 Core Initialized ===`
- `Model created and set`
- `Dependencies loaded`
- `Component created:`
- `Root view from component:`
- Any **red error messages**

### Step 2: Try Simple Test Page
Try this URL:
```
http://localhost:4004/app/index-simple.html
```

This loads the view directly without component. If this works, the issue is with component initialization.

### Step 3: Check Network Tab
Open F12 → Network tab:
- Look for **404 errors** (red)
- Check if `CompensationWorksheet.view.xml` is loading
- Check if `Component.js` is loading
- Check if `manifest.json` is loading

### Step 4: Check Elements Tab
Open F12 → Elements tab:
- Look for `<div id="content">`
- Check if it has child elements
- Look for `sap-ui-component` or view elements

### Step 5: Manual Console Test
In browser console (F12), try:
```javascript
// Check if component exists
sap.ui.getCore().getComponent("compensation")

// Check if view exists
sap.ui.getCore().byId("compensation---CompensationWorksheet")

// Check if model exists
sap.ui.getCore().getModel("compensation")

// Check content div
document.getElementById("content")
```

## Common Issues

### Issue 1: View Not Loading
**Symptom**: Console shows "View creation failed"
**Fix**: Check view XML syntax, check file path

### Issue 2: Model Not Bound
**Symptom**: View loads but fields are empty
**Fix**: Check model name matches binding path

### Issue 3: Component RootView Not Created
**Symptom**: Component exists but no rootView
**Fix**: Check manifest.json rootView configuration

## Quick Fixes

### Fix 1: Use Simple Page
If `index-simple.html` works, use that instead:
```bash
# Rename files
mv app/webapp/index.html app/webapp/index-component.html
mv app/webapp/index-simple.html app/webapp/index.html
```

### Fix 2: Check View XML
Verify view file exists and is valid:
```bash
ls -la app/webapp/view/CompensationWorksheet.view.xml
```

### Fix 3: Check Model Binding
In view XML, ensure binding paths match:
- `{compensation>/companyId}` ✅
- `{compensation>companyId}` ❌ (missing /)

## What to Share

If still not working, share:
1. **Console output** (all messages)
2. **Network tab** (any 404s or errors)
3. **Result of index-simple.html** (does it work?)
4. **Result of console commands** above

This will help identify the exact issue!
