# Quick SuccessFactors Connection Setup

## 🎯 3-Minute Setup

### Step 1: Create Credentials File

**In BAS, create**: `default-env.json` (root folder)

```json
{
  "VCAP_SERVICES": {
    "user-provided": [
      {
        "name": "successfactors-credentials",
        "label": "user-provided",
        "tags": ["successfactors"],
        "credentials": {
          "url": "https://api.successfactors.eu",
          "username": "YOUR_USERNAME_HERE",
          "password": "YOUR_PASSWORD_HERE",
          "companyId": "SFHUB003674"
        }
      }
    ]
  }
}
```

**Replace:**
- `YOUR_USERNAME_HERE` → Your SF username
- `YOUR_PASSWORD_HERE` → Your SF password
- `https://api.successfactors.eu` → Your SF API URL

### Step 2: Find Your SF API URL

**From your SF sign-in URL:**
- `https://www.successfactors.eu/...` → API: `https://api.successfactors.eu`
- `https://www.successfactors.com/...` → API: `https://api.successfactors.com`

### Step 3: Restart Server

```bash
# In BAS Terminal
npm start
```

### Step 4: Test

**Open app and click "Refresh" button**

**OR test in console:**
```javascript
$.ajax({
    url: "/compensation/CompensationService/getCompensationData",
    method: "POST",
    contentType: "application/json",
    data: JSON.stringify({
        companyId: "SFHUB003674",
        userId: "YOUR_USER_ID"
    }),
    success: function(data) {
        console.log("✅ Connected! Records:", data.length);
    },
    error: function(e) {
        console.error("❌ Error:", e.status, e.responseJSON);
    }
});
```

**Done!** 🎉

---

## 🔍 Check Service Path First

**Before connecting, check which path your service uses:**

**After `npm start`, look for:**
```
[cds] - serving CompensationService { path: '/compensation' }
```

**If you see `/compensation` (not `/odata/v4/compensation`), update frontend:**

**In `app/webapp/controller/CompensationWorksheet.controller.js`:**

Change all URLs from:
```javascript
"/odata/v4/compensation/CompensationService/..."
```

To:
```javascript
"/compensation/CompensationService/..."
```

**Then restart and test!**
