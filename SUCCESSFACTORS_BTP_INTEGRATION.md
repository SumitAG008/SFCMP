# SuccessFactors ↔ SAP BTP Integration Guide

## 📋 Complete Integration Steps

This guide explains how to integrate your Compensation Worksheet application with SuccessFactors instance via SAP BTP.

---

## 🏗️ Architecture Overview

```
                    ┌─────────────────────────────────────┐
                    │   SuccessFactors Instance           │
                    │   • Employee Central                │
                    │   • Compensation Module             │
                    │   • MDF Objects                     │
                    │   • Workflow                        │
                    └──────────────┬──────────────────────┘
                                   │ OAuth 2.0 / Basic Auth
                                   │ OData v2 API
                                   │
                    ┌──────────────▼──────────────────────┐
                    │   SAP BTP                           │
                    │   • Cloud Foundry                   │
                    │   • CAP Service                     │
                    │   • UI5 Application                 │
                    │   • XSUAA Authentication            │
                    └──────────────┬──────────────────────┘
                                │
                                │ REST/OData v4
                                │ JSON Data
                                │
                    ┌──────────────▼──────────────────────┐
                    │   Compensation Worksheet App        │
                    │   • UI5 Frontend                    │
                    │   • CAP Backend                     │
                    │   • Database (HANA/SQLite)          │
                    └─────────────────────────────────────┘
```

---

## 🔧 Step 1: Configure SuccessFactors API Access

### 1.1 Get SuccessFactors API Credentials

1. **Login to SuccessFactors Admin Center**
2. **Navigate to**: Admin Center → Company Settings → API Management
3. **Create OAuth Client**:
   - Click "Create OAuth Client"
   - **Client ID**: Note this value
   - **Client Secret**: Note this value (save securely)
   - **Redirect URI**: `https://your-btp-app.cfapps.us10-001.hana.ondemand.com`
   - **Scopes**: Select required scopes:
     - `api_ec_employee_read`
     - `api_ec_compensation_read`
     - `api_ec_compensation_write`
     - `api_ec_mdf_read`
     - `api_ec_mdf_write`

### 1.2 Get SuccessFactors Instance URL

- **Data Center URL**: `https://api.successfactors.eu` (EU)
- **Alternative**: `https://api.successfactors.com` (US)
- **Company ID**: Your SuccessFactors company ID (e.g., `SFHUB003674`)

---

## 🔧 Step 2: Configure SAP BTP

### 2.1 Create Destination in BTP

1. **Login to SAP BTP Cockpit**
2. **Navigate to**: Cloud Foundry → Your Subaccount → Destinations
3. **Create New Destination**:
   - **Name**: `SuccessFactors`
   - **Type**: `HTTP`
   - **URL**: `https://api.successfactors.eu` (your SF instance URL)
   - **Authentication**: `OAuth2ClientCredentials`
   - **Client ID**: Your SuccessFactors OAuth Client ID
   - **Client Secret**: Your SuccessFactors OAuth Client Secret
   - **Token Service URL**: `https://api.successfactors.eu/oauth/token`
   - **Additional Properties**:
     - `companyId`: `SFHUB003674`
     - `userId`: `sfadmin`

### 2.2 Configure Service Binding

**File**: `mta.yaml`

```yaml
resources:
  - name: successfactors-destination
    type: org.cloudfoundry.managed-service
    parameters:
      service: destination
      service-plan: lite
      config:
        HTML5Runtime_enabled: true
        init_data:
          instance:
            destinations:
              - Name: SuccessFactors
                Type: HTTP
                URL: https://api.successfactors.eu
                Authentication: OAuth2ClientCredentials
                ClientID: YOUR_CLIENT_ID
                ClientSecret: YOUR_CLIENT_SECRET
                TokenServiceURL: https://api.successfactors.eu/oauth/token
                companyId: SFHUB003674
```

---

## 🔧 Step 3: Update Application Configuration

### 3.1 Update Environment Variables

**File**: `default-env.json` (for local development)

```json
{
  "SuccessFactors": {
    "url": "https://api.successfactors.eu",
    "clientId": "YOUR_CLIENT_ID",
    "clientSecret": "YOUR_CLIENT_SECRET",
    "companyId": "SFHUB003674",
    "username": "YOUR_USERNAME",
    "password": "YOUR_PASSWORD"
  }
}
```

### 3.2 Update Service Code

**File**: `srv/compensation-service.js`

The service already supports both OAuth and Basic Auth:

```javascript
async function getAuthHeader() {
  try {
    // Try OAuth first
    if (sfCredentials.clientId && sfCredentials.clientSecret) {
      const tokenUrl = `${sfCredentials.url}/oauth/token`;
      const params = new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: sfCredentials.clientId,
        client_secret: sfCredentials.clientSecret
      });

      const response = await axios.post(tokenUrl, params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      return `Bearer ${response.data.access_token}`;
    }
    
    // Fallback to Basic Auth
    if (sfCredentials.username && sfCredentials.password) {
      const credentials = Buffer.from(`${sfCredentials.username}:${sfCredentials.password}`).toString('base64');
      return `Basic ${credentials}`;
    }
  } catch (error) {
    console.error('Error getting authentication:', error.message);
    throw new Error('Failed to authenticate with SuccessFactors');
  }
}
```

---

## 🔧 Step 4: Deploy to SAP BTP

### 4.1 Build MTA Archive

```bash
# Install MTA Build Tool
npm install -g mbt

# Build MTA
mbt build
```

### 4.2 Deploy to Cloud Foundry

```bash
# Login to Cloud Foundry
cf login -a https://api.cf.us10-001.hana.ondemand.com

# Deploy MTA
cf deploy mta_archives/successfactors-compensation-extension_1.0.0.mtar
```

### 4.3 Get Application URL

```bash
# List applications
cf apps

# Note the URL, e.g.:
# https://compensation-app-<space>.cfapps.us10-001.hana.ondemand.com
```

---

## 🔧 Step 5: Configure SuccessFactors Tile

### 5.1 Create Integration Tile

1. **Login to SuccessFactors Admin Center**
2. **Navigate to**: Admin Center → Manage Integration Tiles
3. **Click**: Create New Tile
4. **Configure**:
   - **Title**: "Compensation Worksheet"
   - **Description**: "Manage employee compensation"
   - **URL**: `https://your-btp-app.cfapps.us10-001.hana.ondemand.com/app/index.html?companyId={companyId}&userId={userId}`
   - **Type**: "External Link" or "Embedded Content"
   - **Icon**: Choose compensation/HR icon
   - **Target**: "New Window" or "Same Window"
   - **Authentication**: 
     - **Type**: "OAuth 2.0" or "SSO"
     - **Client ID**: Your BTP XSUAA client ID
     - **Client Secret**: Your BTP XSUAA client secret

### 5.2 Add to Home Page

1. **Navigate to**: Admin Center → Manage Home Page
2. **Add Tile**: Add "Compensation Worksheet" tile
3. **Assign**: Assign to user roles/groups (HR, Managers, etc.)

---

## 🔧 Step 6: Configure CORS (for iframe embedding)

### 6.1 Update Server Configuration

**File**: `srv/server.js`

CORS is already configured:

```javascript
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*'); // Configure specific domains in production
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});
```

**For Production**: Replace `*` with specific SuccessFactors domains:
```javascript
res.setHeader('Access-Control-Allow-Origin', 'https://your-successfactors-instance.successfactors.eu');
```

---

## 🔧 Step 7: Test Integration

### 7.1 Test API Connection

**In Browser Console** (on your BTP app):
```javascript
// Test GET API
$.ajax({
    url: "/compensation/CompensationService/getCompensationData",
    method: "POST",
    contentType: "application/json",
    data: JSON.stringify({
        companyId: "SFHUB003674",
        userId: "sfadmin"
    }),
    success: function(data) {
        console.log("✅ SuccessFactors API connected!");
        console.log("Data:", data);
    },
    error: function(error) {
        console.error("❌ Connection failed:", error);
    }
});
```

### 7.2 Test from SuccessFactors

1. **Login to SuccessFactors**
2. **Click**: "Compensation Worksheet" tile
3. **Verify**: 
   - Application loads
   - Company ID and User ID are pre-filled
   - Data loads from SuccessFactors
   - Save functionality works

---

## 🔐 Security Configuration

### OAuth 2.0 Flow

```
SuccessFactors User
    ↓
Clicks Tile
    ↓
SuccessFactors redirects to BTP
    ↓
BTP XSUAA authenticates user
    ↓
BTP gets OAuth token from SuccessFactors
    ↓
BTP calls SuccessFactors API with token
    ↓
SuccessFactors returns data
    ↓
BTP displays in application
```

### XSUAA Configuration

**File**: `xs-security.json`

```json
{
  "xsappname": "compensation-extension",
  "tenant-mode": "dedicated",
  "scopes": [
    {
      "name": "$XSAPPNAME.view",
      "description": "View compensation data"
    },
    {
      "name": "$XSAPPNAME.edit",
      "description": "Edit compensation data"
    }
  ],
  "role-templates": [
    {
      "name": "CompensationViewer",
      "description": "View compensation data",
      "scope-references": ["$XSAPPNAME.view"]
    },
    {
      "name": "CompensationEditor",
      "description": "Edit compensation data",
      "scope-references": ["$XSAPPNAME.view", "$XSAPPNAME.edit"]
    }
  ]
}
```

---

## 📊 Data Flow Diagram

```
┌─────────────────────────────────────┐
│   SuccessFactors                    │
│   • Employee Central API            │
│   • Compensation API                │
│   • MDF Objects                     │
└──────────────┬──────────────────────┘
               │
               │ 1. User clicks tile
               │ 2. OAuth authentication
               │ 3. API calls
               │
┌──────────────▼──────────────────────┐
│   SAP BTP                            │
│   • XSUAA (Authentication)           │
│   • Destination Service              │
│   • CAP Service                      │
│   • UI5 Application                  │
└──────────────┬──────────────────────┘
               │
               │ 4. Process data
               │ 5. Save to database
               │ 6. Sync to MDF
               │ 7. Log audit trail
               │
┌──────────────▼──────────────────────┐
│   Application                        │
│   • Display data                    │
│   • User edits                      │
│   • Save changes                    │
└─────────────────────────────────────┘
```

---

## 🔄 Complete Integration Checklist

- [ ] **SuccessFactors Configuration**:
  - [ ] Create OAuth client in SuccessFactors
  - [ ] Note Client ID and Secret
  - [ ] Get instance URL and Company ID

- [ ] **SAP BTP Configuration**:
  - [ ] Create destination in BTP Cockpit
  - [ ] Configure OAuth credentials
  - [ ] Update `mta.yaml` with service binding
  - [ ] Update `xs-security.json` for XSUAA

- [ ] **Application Configuration**:
  - [ ] Update `default-env.json` with credentials
  - [ ] Verify CORS configuration
  - [ ] Test API connections

- [ ] **Deployment**:
  - [ ] Build MTA archive
  - [ ] Deploy to Cloud Foundry
  - [ ] Get application URL
  - [ ] Verify deployment

- [ ] **SuccessFactors Integration**:
  - [ ] Create integration tile
  - [ ] Configure tile URL
  - [ ] Add to home page
  - [ ] Assign to user roles

- [ ] **Testing**:
  - [ ] Test API connection
  - [ ] Test from SuccessFactors tile
  - [ ] Test GET operations
  - [ ] Test POST operations
  - [ ] Verify data sync

---

## 🚀 Quick Start Commands

```bash
# 1. Build MTA
mbt build

# 2. Login to CF
cf login -a https://api.cf.us10-001.hana.ondemand.com

# 3. Deploy
cf deploy mta_archives/successfactors-compensation-extension_1.0.0.mtar

# 4. Get app URL
cf apps

# 5. Test API
curl -X POST https://your-app.cfapps.us10-001.hana.ondemand.com/compensation/CompensationService/getCompensationData \
  -H "Content-Type: application/json" \
  -d '{"companyId":"SFHUB003674","userId":"sfadmin"}'
```

---

## 📝 Configuration Files Summary

### Files to Update:

1. **`mta.yaml`** - Service bindings and destinations
2. **`xs-security.json`** - XSUAA security configuration
3. **`default-env.json`** - Local development credentials
4. **`srv/server.js`** - CORS configuration (already done)
5. **`srv/compensation-service.js`** - API integration (already done)

### SuccessFactors Configuration:

1. **OAuth Client** - Admin Center → API Management
2. **Integration Tile** - Admin Center → Manage Integration Tiles
3. **Home Page** - Admin Center → Manage Home Page

---

## ✅ Integration Complete!

Once configured, users can:

1. ✅ **Access from SuccessFactors**: Click tile to open application
2. ✅ **Auto-load data**: Company ID and User ID pre-filled from URL
3. ✅ **View employees**: Data extracted from SuccessFactors
4. ✅ **Edit compensation**: Make changes in the worksheet
5. ✅ **Save changes**: Data saved to both database and SuccessFactors
6. ✅ **Audit trail**: All changes logged for compliance
7. ✅ **Scroll through employees**: Table scrolls to show all employees

**Your application is now fully integrated with SuccessFactors via SAP BTP!** 🎉
