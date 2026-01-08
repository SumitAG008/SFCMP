# Step-by-Step SuccessFactors Integration Guide

## 📋 Overview

This guide walks you through connecting your SAP BTP CAP application to SuccessFactors, step by step.

**Prerequisites:**
- ✅ SAP BTP account (BAS access)
- ✅ SuccessFactors instance access
- ✅ SuccessFactors API credentials

---

## 🎯 Step 1: Get SuccessFactors API Credentials

### 1.1 Log into SuccessFactors

1. Open your SuccessFactors instance
2. Log in with admin credentials

### 1.2 Find Your API URL

**From your SF sign-in URL:**
- If URL contains `successfactors.eu` → API: `https://api.successfactors.eu`
- If URL contains `successfactors.com` → API: `https://api.successfactors.com`

**OR check in SuccessFactors:**
1. Go to **Admin Center**
2. Navigate to **Integration** → **API**
3. Note the **OData API URL**

### 1.3 Get API Credentials

**Option A: Basic Authentication (Username/Password)**

1. You need:
   - **Username**: Your SF username
   - **Password**: Your SF password
   - **Company ID**: Found in URL or Admin Center (e.g., `SFHUB003674`)

**Option B: OAuth 2.0 (Recommended for Production)**

1. Go to **Admin Center** → **Integration** → **OAuth Client Application**
2. Click **Create New OAuth Client**
3. Fill in:
   - **Name**: `BTP Compensation Extension`
   - **Grant Type**: `Client Credentials`
   - **Scopes**: `api_odata_business_data`, `api_odata_common`
4. Click **Save**
5. Copy:
   - **Client ID**
   - **Client Secret** (save immediately, can't view again!)

---

## 🔧 Step 2: Configure Credentials in BAS

### 2.1 Open Terminal in BAS

**Method 1: Keyboard Shortcut**
- Press `Ctrl + ~` (Windows/Linux) or `Cmd + ~` (Mac)

**Method 2: Menu**
- Click **Terminal** → **New Terminal**

### 2.2 Navigate to Project

```bash
# Check current directory
pwd

# Should show: /home/user/projects/SFCMP
# If not, navigate:
cd /home/user/projects/SFCMP
```

### 2.3 Create Credentials File

**Create `default-env.json` in project root:**

```bash
# In BAS Terminal
touch default-env.json
```

**OR create via BAS File Explorer:**
1. Right-click project root folder
2. Select **New File**
3. Name: `default-env.json`

### 2.4 Add Credentials to File

**Open `default-env.json` and add:**

**For Basic Auth:**
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

**For OAuth 2.0:**
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

**Replace:**
- `YOUR_SF_USERNAME` → Your SuccessFactors username
- `YOUR_SF_PASSWORD` → Your SuccessFactors password
- `YOUR_CLIENT_ID` → OAuth Client ID (if using OAuth)
- `YOUR_CLIENT_SECRET` → OAuth Client Secret (if using OAuth)
- `https://api.successfactors.eu` → Your SF API URL
- `SFHUB003674` → Your Company ID

### 2.5 Verify File is Ignored by Git

**Check `.gitignore` contains:**
```
default-env.json
```

**This prevents committing credentials to Git!**

---

## 🚀 Step 3: Restart Development Server

### 3.1 Stop Current Server

**In BAS Terminal:**
- Press `Ctrl + C` to stop `npm start`

### 3.2 Start Server Again

```bash
npm start
```

### 3.3 Verify Server Started

**Look for in terminal:**
```
[cds] - serving CompensationService { impl: 'srv/compensation-service.js', path: '/compensation' }
[cds] - server listening on { url: 'http://localhost:4004' }
```

**If you see errors about credentials:**
- Check `default-env.json` syntax (valid JSON)
- Verify credentials are correct
- Check file is in project root

---

## 🧪 Step 4: Test Connection

### 4.1 Test in Browser Console

**Open your app in browser, then press F12 → Console tab**

**Test 1: Check Service Metadata**
```javascript
$.ajax({
    url: "/compensation/CompensationService/$metadata",
    method: "GET",
    success: function(data) {
        console.log("✅ Service is accessible!");
        console.log("Metadata:", data);
    },
    error: function(error) {
        console.error("❌ Service not found. Status:", error.status);
    }
});
```

**Test 2: Test RBP Check (with mock data)**
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
        if (error.status === 401) {
            console.error("Authentication failed - check credentials");
        } else if (error.status === 404) {
            console.error("Service path wrong - check server logs");
        }
    }
});
```

**Test 3: Test Data Retrieval**
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
        console.log("✅ Data Retrieved!");
        console.log("Records:", data.length);
        console.log("Sample:", data[0]);
    },
    error: function(error) {
        console.error("❌ Data Retrieval Failed:", error);
        console.error("Status:", error.status);
        console.error("Response:", error.responseJSON);
    }
});
```

### 4.2 Test in Application UI

1. **Open Compensation Worksheet**
2. **Enter:**
   - Company ID: `SFHUB003674`
   - User ID: Your SuccessFactors user ID
3. **Click "Refresh"**
4. **Should see:**
   - ✅ Data loaded (if connection works)
   - ✅ Or error message (if credentials wrong)

---

## 🔍 Step 5: Troubleshoot Connection Issues

### Issue 1: "No authentication credentials provided"

**Solution:**
- Verify `default-env.json` exists in project root
- Check JSON syntax is valid
- Restart server after creating file

### Issue 2: "401 Unauthorized"

**Possible Causes:**
- Wrong username/password
- Wrong API URL
- OAuth credentials incorrect

**Solution:**
1. Double-check credentials in `default-env.json`
2. Test SF API directly with Postman/curl
3. Verify API URL matches your instance

### Issue 3: "404 Not Found" on API endpoint

**Possible Causes:**
- Wrong SF API URL
- API endpoint doesn't exist
- Wrong API version

**Solution:**
1. Verify SF API URL
2. Check API documentation: https://api.sap.com/api/sap-sf-employeeCompensation-v1
3. Test endpoint: `https://api.successfactors.eu/odata/v2/Employee_Compensation`

### Issue 4: "403 Forbidden"

**Possible Causes:**
- User doesn't have RBP permissions
- API user doesn't have required roles
- Company ID mismatch

**Solution:**
1. Check RBP permissions in SuccessFactors
2. Verify API user has compensation access
3. Verify company ID is correct

---

## 📊 Step 6: Verify Data Flow

### 6.1 Test GET Operations

**In Application:**
1. Click "Refresh" button
2. Should see employee compensation data
3. Check browser console for API calls

### 6.2 Test POST Operations

**In Application:**
1. Click "Add Employee"
2. Fill in compensation data
3. Click "Save"
4. Should see success message

### 6.3 Test RBP Permissions

**In Application:**
1. Enter different User IDs
2. Click "Refresh"
3. Should see different data based on permissions

---

## 🎯 Step 7: Deploy to BTP (Production)

### 7.1 Create User-Provided Service

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

### 7.2 Update mta.yaml

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

### 7.3 Build and Deploy

```bash
# Build
mbt build

# Deploy
cf deploy mta_archives/*.mtar
```

---

## ✅ Step 8: Integration Checklist

- [ ] SuccessFactors API credentials obtained
- [ ] `default-env.json` created with credentials
- [ ] Server restarted and loading credentials
- [ ] Service metadata accessible
- [ ] RBP check working
- [ ] Data retrieval working
- [ ] GET operations tested
- [ ] POST operations tested
- [ ] Error handling verified
- [ ] Production deployment configured (if needed)

---

## 📚 Additional Resources

- **SuccessFactors API Documentation**: https://api.sap.com/api/sap-sf-employeeCompensation-v1
- **SAP BTP Documentation**: https://help.sap.com/docs/btp
- **CAP Documentation**: https://cap.cloud.sap/docs/
- **Connection Guide**: See `CONNECT_SUCCESSFACTORS.md`
- **Quick Setup**: See `QUICK_CONNECTION_SETUP.md`

---

## 🎉 Success!

Once all steps are complete:
- ✅ Application connected to SuccessFactors
- ✅ Data flowing from SF to BTP
- ✅ RBP permissions working
- ✅ Ready for production use!

**Next Steps:**
- Test all features
- Configure workflows
- Set up audit logging
- Enable reporting
