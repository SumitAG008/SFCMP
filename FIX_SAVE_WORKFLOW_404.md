# Fix "Save Workflow" 404 Error

## 🔍 Problem

When clicking "Save & Activate" in Workflow Builder, you get:
- **Error**: `'CompensationService' is not an entity set, a singleton, an action import, or a function import`
- **404 Error**: POST to `/odata/v4/compensation/CompensationService/saveWorkflow` returns 404

## ✅ Solution Steps

### Step 1: Clear Browser Cache

**The browser may be using cached JavaScript with old URLs.**

**In Browser (F12 → Console):**
```javascript
// Clear cache and hard refresh
location.reload(true);
```

**OR manually:**
1. Press `Ctrl + Shift + Delete` (Windows) or `Cmd + Shift + Delete` (Mac)
2. Select "Cached images and files"
3. Click "Clear data"
4. Refresh page (`F5` or `Ctrl + R`)

### Step 2: Restart Development Server

**In BAS Terminal:**

```bash
# Stop current server (Ctrl + C)
# Then restart
npm start
```

**Wait for:**
```
[cds] - serving CompensationService { impl: 'srv/compensation-service.js', path: '/compensation' }
[cds] - server listening on { url: 'http://localhost:4004' }
```

### Step 3: Verify Service Path

**After restart, check the service path in server logs.**

**Should see:**
```
path: '/compensation'
```

**NOT:**
```
path: '/odata/v4/compensation'
```

### Step 4: Test Service Path

**In Browser Console (F12):**

```javascript
// Test metadata endpoint
$.ajax({
    url: "/compensation/CompensationService/$metadata",
    method: "GET",
    success: function(data) {
        console.log("✅ Service path is CORRECT: /compensation");
    },
    error: function(error) {
        console.error("❌ Service path wrong. Status:", error.status);
        // Try alternative
        console.log("Trying /odata/v4/compensation...");
    }
});
```

### Step 5: Verify Frontend Code

**Check that controllers use correct path:**

**File**: `app/webapp/controller/CompensationWorksheet.controller.js`

**Should have:**
```javascript
var sServiceUrl = "/compensation/CompensationService/saveWorkflow";
```

**NOT:**
```javascript
var sServiceUrl = "/odata/v4/compensation/CompensationService/saveWorkflow";
```

**File**: `app/webapp/controller/WorkflowBuilder.controller.js`

**Should have:**
```javascript
var sServiceUrl = "/compensation/CompensationService/saveWorkflow";
```

### Step 6: Test Save Workflow

**After clearing cache and restarting:**

1. Open Workflow Builder
2. Fill in workflow details
3. Click "Save & Activate"
4. Should see success message

**OR test in console:**
```javascript
$.ajax({
    url: "/compensation/CompensationService/saveWorkflow",
    method: "POST",
    contentType: "application/json",
    data: JSON.stringify({
        companyId: "SFHUB003674",
        formId: "test",
        workflow: {
            workflowName: "Test Workflow",
            formId: "test",
            description: "Test",
            steps: []
        }
    }),
    success: function(response) {
        console.log("✅ Save Workflow SUCCESS:", response);
    },
    error: function(error) {
        console.error("❌ Save Workflow FAILED:", error);
        console.error("Status:", error.status);
        console.error("URL:", error.responseURL);
    }
});
```

## 🐛 If Still Not Working

### Check 1: Service Registration

**In `package.json`, verify:**
```json
"cds": {
  "service": {
    "CompensationService": {
      "path": "/compensation"
    }
  }
}
```

### Check 2: Action Definition

**In `srv/compensation-service.cds`, verify:**
```cds
action saveWorkflow(companyId: String, formId: String, workflow: WorkflowConfig) returns WorkflowConfig;
```

### Check 3: Handler Implementation

**In `srv/compensation-service.js`, verify:**
```javascript
this.on('saveWorkflow', async (req) => {
  // Handler code exists
});
```

### Check 4: Browser Network Tab

**In Browser (F12 → Network tab):**
1. Click "Save & Activate"
2. Look for the `saveWorkflow` request
3. Check:
   - **Request URL**: Should be `/compensation/CompensationService/saveWorkflow`
   - **Status**: Should be `200` (not `404`)
   - **Request Method**: Should be `POST`

## ✅ Quick Fix Checklist

- [ ] Cleared browser cache
- [ ] Restarted server (`npm start`)
- [ ] Verified service path in server logs (`/compensation`)
- [ ] Tested metadata endpoint
- [ ] Verified frontend URLs use `/compensation` (not `/odata/v4/compensation`)
- [ ] Tested saveWorkflow in console
- [ ] Checked Network tab for correct URL

## 🎯 Expected Result

After fix:
- ✅ "Save & Activate" works
- ✅ Success message appears
- ✅ No 404 errors in console
- ✅ Workflow saved successfully
