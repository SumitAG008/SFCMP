# Connect SAP SuccessFactors to SAP BTP CAP Application

## 🔍 Current Status

**❌ No Connection Yet** - The application is ready but not connected to SuccessFactors.

**What's Missing:**
1. ❌ SuccessFactors API credentials not configured
2. ❌ No actual API calls being made (all failing)
3. ❌ Service path needs to be fixed first
4. ❌ Authentication not set up

---

## 📋 Prerequisites

Before connecting, you need:

1. **SuccessFactors API Access**:
   - API URL (e.g., `https://api.successfactors.eu` or `https://api.successfactors.com`)
   - Username and Password (for Basic Auth)
   - OR OAuth 2.0 Client ID and Secret
   - Company ID (e.g., `SFHUB003674`)

2. **API Permissions**:
   - Access to Employee Compensation API
   - Access to Employee Central API (for employee data)
   - Access to RBP API (for permissions)

3. **SAP BTP Account** (for production):
   - BTP Subaccount
   - Cloud Foundry Space
   - Destination Service (optional, for OAuth)

---

## 🚀 Step-by-Step Connection Guide

### Option 1: Local Development (BAS) - Quick Start

#### Step 1: Create `default-env.json` File

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
          "url": "https://api.successfactors.eu",
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
- `YOUR_SF_USERNAME` - Your SuccessFactors username
- `YOUR_SF_PASSWORD` - Your SuccessFactors password
- `https://api.successfactors.eu` - Your SuccessFactors API URL (check your SF instance)

**⚠️ Security Note**: Add `default-env.json` to `.gitignore` (already done)

#### Step 2: Get Your SuccessFactors API URL

**How to find your SF API URL:**

1. **Log into SuccessFactors**
2. **Go to**: Admin Center → Integration → API
3. **Check**: OData API URL
   - EU: `https://api.successfactors.eu`
   - US: `https://api.successfactors.com`
   - APJ: `https://api.successfactors.com` (Asia Pacific)

**OR** from your SF sign-in URL:
- If URL is `https://www.successfactors.eu/...` → API is `https://api.successfactors.eu`
- If URL is `https://www.successfactors.com/...` → API is `https://api.successfactors.com`

#### Step 3: Test Connection

**In BAS Terminal:**

```bash
# Restart server to load new credentials
npm start
```

**In Browser Console (F12):**

```javascript
// Test SuccessFactors connection
$.ajax({
    url: "/odata/v4/compensation/CompensationService/getCompensationData",
    method: "POST",
    contentType: "application/json",
    data: JSON.stringify({
        companyId: "SFHUB003674",
        userId: "YOUR_USER_ID"
    }),
    success: function(data) {
        console.log("✅ SuccessFactors Connected!");
        console.log("Data:", data);
    },
    error: function(error) {
        console.error("❌ Connection Failed:", error);
        console.error("Status:", error.status);
        console.error("Response:", error.responseJSON);
    }
});
```

---

### Option 2: OAuth 2.0 Authentication (Recommended for Production)

#### Step 1: Get OAuth Credentials from SuccessFactors

1. **Log into SuccessFactors**
2. **Go to**: Admin Center → Integration → OAuth Client Application
3. **Create New OAuth Client**:
   - Name: `BTP Compensation Extension`
   - Grant Type: `Client Credentials`
   - Scopes: `api_odata_business_data`, `api_odata_common`
4. **Save** and copy:
   - Client ID
   - Client Secret

#### Step 2: Update `default-env.json`

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
          "clientId": "YOUR_CLIENT_ID",
          "clientSecret": "YOUR_CLIENT_SECRET",
          "companyId": "SFHUB003674"
        }
      }
    ]
  }
}
```

#### Step 3: Restart and Test

```bash
npm start
```

---

### Option 3: SAP BTP Production Deployment

#### Step 1: Create User-Provided Service in BTP

**In BAS Terminal (connected to BTP):**

```bash
# Login to Cloud Foundry
cf login -a https://api.cf.us10-001.hana.ondemand.com

# Create user-provided service
cf create-user-provided-service successfactors-credentials \
  -p '{"url":"https://api.successfactors.eu","username":"YOUR_USERNAME","password":"YOUR_PASSWORD","companyId":"SFHUB003674"}'
```

**OR with OAuth:**

```bash
cf create-user-provided-service successfactors-credentials \
  -p '{"url":"https://api.successfactors.eu","clientId":"YOUR_CLIENT_ID","clientSecret":"YOUR_CLIENT_SECRET","companyId":"SFHUB003674"}'
```

#### Step 2: Update `mta.yaml`

**File**: `mta.yaml`

```yaml
modules:
  - name: compensation-service
    type: nodejs
    requires:
      - name: successfactors-credentials
    # ... rest of config

resources:
  - name: successfactors-credentials
    type: org.cloudfoundry.user-provided-service
    parameters:
      service-name: successfactors-credentials
```

#### Step 3: Deploy

```bash
mbt build
cf deploy mta_archives/*.mtar
```

---

## 🧪 Testing Without SuccessFactors (Mock Data)

**For development/testing without SF connection:**

The application already has fallback logic that returns mock data when SF API calls fail. However, you can also enable a "mock mode":

### Enable Mock Mode

**Create `default-env.json`:**

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
          "username": "MOCK",
          "password": "MOCK",
          "companyId": "SFHUB003674",
          "mockMode": true
        }
      }
    ]
  }
}
```

**The service will return mock data instead of calling SF API.**

---

## 🔧 Fix Service Path Issue First

**Before connecting to SuccessFactors, fix the service path:**

The error `'CompensationService' is not an entity set` suggests the service path is wrong.

### Check Service Path

**In BAS Terminal, after `npm start`, look for:**

```
[cds] - serving CompensationService { impl: 'srv/compensation-service.js', path: '/compensation' }
```

**This means the service is at:**
- `/compensation/CompensationService` (not `/odata/v4/compensation/...`)

### Update Frontend URLs

**If service is at `/compensation` (not `/odata/v4`), update controllers:**

**In `app/webapp/controller/CompensationWorksheet.controller.js`:**

Change:
```javascript
var sRBPUrl = "/odata/v4/compensation/CompensationService/checkUserRBP";
```

To:
```javascript
var sRBPUrl = "/compensation/CompensationService/checkUserRBP";
```

**Or test both paths:**

```javascript
// Try both paths
var paths = [
    "/compensation/CompensationService/checkUserRBP",
    "/odata/v4/compensation/CompensationService/checkUserRBP"
];

// Test which one works
```

---

## 📊 Verify Connection

### Step 1: Check Server Logs

**In BAS Terminal, after `npm start`:**

Look for:
```
[cds] - serving CompensationService { impl: 'srv/compensation-service.js', path: '/compensation' }
[cds] - server listening on { url: 'http://localhost:4004' }
```

### Step 2: Test Metadata Endpoint

**In Browser:**

```
https://port4004-workspaces-ws-gw643.us10.trial.applicationstudio.cloud.sap/compensation/CompensationService/$metadata
```

**OR:**

```
https://port4004-workspaces-ws-gw643.us10.trial.applicationstudio.cloud.sap/odata/v4/compensation/CompensationService/$metadata
```

**Should show XML metadata with all actions and entities.**

### Step 3: Test RBP Check

**In Browser Console:**

```javascript
$.ajax({
    url: "/compensation/CompensationService/checkUserRBP", // Try without /odata/v4 first
    method: "POST",
    contentType: "application/json",
    data: JSON.stringify({
        companyId: "SFHUB003674",
        userId: "YOUR_USER_ID",
        permission: "COMPENSATION_VIEW"
    }),
    success: function(result) {
        console.log("✅ RBP Check Success:", result);
    },
    error: function(error) {
        console.error("❌ RBP Check Failed:", error);
        // Try with /odata/v4 prefix
        console.log("Try with /odata/v4 prefix...");
    }
});
```

### Step 4: Test Data Retrieval

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
        console.log("✅ Data Retrieved:", data.length, "records");
        console.log("Sample:", data[0]);
    },
    error: function(error) {
        console.error("❌ Data Retrieval Failed:", error);
        if (error.status === 401) {
            console.error("Authentication failed - check credentials");
        } else if (error.status === 403) {
            console.error("Permission denied - check RBP");
        } else if (error.status === 404) {
            console.error("API endpoint not found - check SF API URL");
        }
    }
});
```

---

## 🐛 Troubleshooting

### Issue 1: "No authentication credentials provided"

**Solution**: Create `default-env.json` with SF credentials (see Step 1 above)

### Issue 2: "401 Unauthorized"

**Possible Causes:**
- Wrong username/password
- Wrong API URL
- OAuth credentials incorrect
- Token expired (for OAuth)

**Solution:**
1. Verify credentials in `default-env.json`
2. Test SF API directly with Postman/curl
3. Check SF API URL matches your instance

### Issue 3: "404 Not Found" on API endpoint

**Possible Causes:**
- Wrong SF API URL
- API endpoint doesn't exist
- Wrong API version

**Solution:**
1. Verify SF API URL
2. Check API documentation: https://api.sap.com/api/sap-sf-employeeCompensation-v1
3. Test endpoint directly: `https://api.successfactors.eu/odata/v2/Employee_Compensation`

### Issue 4: "403 Forbidden"

**Possible Causes:**
- User doesn't have RBP permissions
- API user doesn't have required roles
- Company ID mismatch

**Solution:**
1. Check RBP permissions in SuccessFactors
2. Verify API user has compensation access
3. Verify company ID is correct

### Issue 5: Service Path Not Found

**Solution**: 
1. Check server logs for actual service path
2. Update frontend URLs to match
3. Test both `/compensation` and `/odata/v4/compensation` paths

---

## 📝 Quick Checklist

- [ ] Created `default-env.json` with SF credentials
- [ ] Verified SF API URL is correct
- [ ] Tested service path (check server logs)
- [ ] Updated frontend URLs to match service path
- [ ] Restarted server (`npm start`)
- [ ] Tested metadata endpoint
- [ ] Tested RBP check
- [ ] Tested data retrieval
- [ ] Verified authentication works
- [ ] Checked server logs for errors

---

## 🎯 Next Steps After Connection

Once connected:

1. **Test GET Operations**: Retrieve compensation data
2. **Test POST Operations**: Create new records
3. **Test UPDATE Operations**: Update existing records
4. **Test RBP**: Verify permissions work
5. **Test Workflow**: Verify workflow status retrieval
6. **Test Employee Data**: Verify employee data extraction

---

## 📚 Additional Resources

- **SuccessFactors API Documentation**: https://api.sap.com/api/sap-sf-employeeCompensation-v1
- **SAP BTP Documentation**: https://help.sap.com/docs/btp
- **CAP Documentation**: https://cap.cloud.sap/docs/

---

## ✅ Summary

**To Connect SuccessFactors:**

1. ✅ Create `default-env.json` with credentials
2. ✅ Verify SF API URL
3. ✅ Fix service path (check server logs)
4. ✅ Restart server
5. ✅ Test connection
6. ✅ Verify data retrieval

**The application is ready - you just need to configure the credentials!** 🚀
