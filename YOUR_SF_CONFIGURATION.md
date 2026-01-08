# Your SuccessFactors Configuration

## ✅ Your SuccessFactors API URL

**Your API URL:** `https://apisalesdemo2.successfactors.eu/odata/v2/`

**Base URL for configuration:** `https://apisalesdemo2.successfactors.eu`

> **Note:** Use the base URL without `/odata/v2/` - the code automatically appends the endpoint paths.

---

## 🔧 Step 1: Create `default-env.json`

**In BAS, create file**: `default-env.json` (in project root)

```json
{
  "VCAP_SERVICES": {
    "user-provided": [
      {
        "name": "successfactors-credentials",
        "label": "user-provided",
        "tags": ["successfactors"],
        "credentials": {
          "url": "https://apisalesdemo2.successfactors.eu",
          "username": "YOUR_SF_USERNAME",
          "password": "YOUR_SF_PASSWORD",
          "companyId": "SFHUB003674"
        }
      }
    ]
  }
}
```

**Replace:**
- `YOUR_SF_USERNAME` → Your SuccessFactors username
- `YOUR_SF_PASSWORD` → Your SuccessFactors password
- `SFHUB003674` → Your Company ID (if different)

---

## 🚀 Step 2: Restart Server

**In BAS Terminal:**

```bash
# Stop current server (Ctrl + C if running)
# Then start:
npm start
```

**Wait for:**
```
[cds] - serving CompensationService { impl: 'srv/compensation-service.js', path: '/compensation' }
[cds] - server listening on { url: 'http://localhost:4004' }
```

---

## 🧪 Step 3: Test Connection

### Test 1: Check Service Metadata

**In Browser Console (F12):**

```javascript
$.ajax({
    url: "/compensation/CompensationService/$metadata",
    method: "GET",
    success: function(data) {
        console.log("✅ Service is accessible!");
    },
    error: function(error) {
        console.error("❌ Service not found. Status:", error.status);
    }
});
```

### Test 2: Test SuccessFactors Connection

**In Browser Console:**

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
        console.log("✅ SuccessFactors Connected!");
        console.log("Records:", data.length);
        console.log("Sample:", data[0]);
    },
    error: function(error) {
        console.error("❌ Connection Failed:", error);
        console.error("Status:", error.status);
        if (error.status === 401) {
            console.error("Authentication failed - check username/password");
        } else if (error.status === 404) {
            console.error("API endpoint not found - check URL");
        } else if (error.status === 403) {
            console.error("Permission denied - check RBP");
        }
    }
});
```

### Test 3: Test RBP Check

```javascript
$.ajax({
    url: "/compensation/CompensationService/checkUserRBP",
    method: "POST",
    contentType: "application/json",
    data: JSON.stringify({
        companyId: "SFHUB003674",
        userId: "YOUR_USER_ID",
        permission: "COMPENSATION_VIEW"
    }),
    success: function(result) {
        console.log("✅ RBP Check Success:", result);
        console.log("Has Permission:", result.hasPermission);
    },
    error: function(error) {
        console.error("❌ RBP Check Failed:", error);
    }
});
```

---

## 🔍 How the URL is Used

**Your configuration:**
```json
"url": "https://apisalesdemo2.successfactors.eu"
```

**The service code constructs full URLs like:**
- Base: `https://apisalesdemo2.successfactors.eu`
- Endpoint: `/odata/v2/Employee_Compensation`
- **Full URL**: `https://apisalesdemo2.successfactors.eu/odata/v2/Employee_Compensation`

**This matches your API URL structure!** ✅

---

## 🐛 Troubleshooting

### Issue: "401 Unauthorized"

**Solution:**
- Double-check username and password in `default-env.json`
- Verify credentials work in SuccessFactors UI
- Test API directly: `https://apisalesdemo2.successfactors.eu/odata/v2/Employee_Compensation`

### Issue: "404 Not Found"

**Solution:**
- Verify URL is exactly: `https://apisalesdemo2.successfactors.eu` (no trailing slash)
- Check if endpoint exists: `https://apisalesdemo2.successfactors.eu/odata/v2/$metadata`
- Verify API version (v2 vs v4)

### Issue: "403 Forbidden"

**Solution:**
- Check user has compensation API access
- Verify RBP permissions in SuccessFactors
- Check company ID is correct

---

## ✅ Quick Checklist

- [ ] Created `default-env.json` with your SF URL
- [ ] URL set to: `https://apisalesdemo2.successfactors.eu` (no `/odata/v2/`)
- [ ] Added username and password
- [ ] Set correct company ID
- [ ] Restarted server (`npm start`)
- [ ] Tested metadata endpoint
- [ ] Tested data retrieval
- [ ] Verified authentication works

---

## 🎯 Next Steps

Once connected:
1. Test GET operations (Refresh button)
2. Test POST operations (Save button)
3. Test RBP permissions
4. Test workflow save (after fixing 404)

---

## 📝 Important Notes

1. **Base URL Only**: Use `https://apisalesdemo2.successfactors.eu` (not `https://apisalesdemo2.successfactors.eu/odata/v2/`)
2. **Security**: `default-env.json` is in `.gitignore` - credentials won't be committed
3. **API Version**: Your instance uses OData v2 (`/odata/v2/`), which is correct for SuccessFactors Employee Compensation API

---

## 🎉 You're Ready!

With this configuration, your application will connect to:
- **API Base**: `https://apisalesdemo2.successfactors.eu`
- **Full Endpoints**: `https://apisalesdemo2.successfactors.eu/odata/v2/...`

**Test the connection and you should see data flowing!** 🚀
