# SAP BTP ↔ SuccessFactors Interaction Guide

## Overview

This guide explains how your SAP BTP Extension interacts with SuccessFactors, enabling bidirectional data flow for compensation management.

## Architecture

```
┌─────────────────────────────────┐
│     SuccessFactors              │
│  Employee Compensation Module   │
│                                 │
│  • Compensation Forms           │
│  • Employee Data                │
│  • Compensation Plans           │
└──────────────┬──────────────────┘
               │
               │ HTTP/HTTPS REST API
               │ OData v2 Protocol
               │
               │ GET / POST / PATCH
               │
┌──────────────▼──────────────────┐
│   SAP BTP Extension             │
│   (Your Application)            │
│                                 │
│  • Compensation Service (CAP)   │
│  • UI5 Frontend                 │
│  • REST/OData APIs              │
└──────────────┬──────────────────┘
               │
               │ Process & Store
               │
┌──────────────▼──────────────────┐
│   Compensation Worksheet        │
│   (UI5 Application)             │
│                                 │
│  • View Data                    │
│  • Edit Compensation            │
│  • Calculate Increases          │
└─────────────────────────────────┘
```

## Interaction Methods

### Method 1: SuccessFactors → BTP (Data Retrieval)

**Flow**: SuccessFactors calls BTP Extension to retrieve data

#### Step 1: SuccessFactors Triggers Request
- User action in SuccessFactors
- Workflow automation
- Scheduled job
- Integration Center

#### Step 2: BTP Extension Receives Request
```
GET /compensation/CompensationService/getCompensationData
POST /compensation/CompensationService/getCompensationData
```

#### Step 3: BTP Extension Calls SuccessFactors API
```javascript
// In your BTP service
GET /odata/v2/Employee_Compensation?$filter=companyId eq 'SFHUB003674'
```

#### Step 4: Data Flows Back
```
SuccessFactors API → BTP Extension → UI5 Worksheet
```

**Example**:
```bash
# From SuccessFactors (via Integration Center or Workflow)
curl -X POST https://your-btp-app.cfapps.us10-001.hana.ondemand.com/compensation/CompensationService/getCompensationData \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "companyId": "SFHUB003674",
    "userId": "user@example.com",
    "formId": "FORM-2024-001"
  }'
```

---

### Method 2: BTP → SuccessFactors (Data Update)

**Flow**: BTP Extension sends data to SuccessFactors

#### Step 1: User Updates Data in BTP UI
- Edit compensation in UI5 worksheet
- Change merit, adjustment, lump sum
- Click "Save"

#### Step 2: BTP Extension Processes
```javascript
// In your controller
POST /compensation/CompensationService/updateCompensationData
```

#### Step 3: BTP Extension Calls SuccessFactors API
```javascript
// In your BTP service
POST /odata/v2/Employee_Compensation
PATCH /odata/v2/Employee_Compensation('{id}')
```

#### Step 4: SuccessFactors Updates
- Data saved in SuccessFactors
- Compensation records updated
- Status synchronized

**Example**:
```bash
# From BTP Extension
curl -X POST https://api.successfactors.eu/odata/v2/Employee_Compensation \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic <credentials>" \
  -d '{
    "companyId": "SFHUB003674",
    "employeeId": "EMP001",
    "meritIncrease": 3.0,
    "meritIncreaseAmount": 3000,
    "finalSalary": 105000
  }'
```

---

### Method 3: Bidirectional Sync (Real-time)

**Flow**: Continuous synchronization between both systems

```
User Action in SuccessFactors
         │
         ▼
SuccessFactors API Updates
         │
         ▼
BTP Extension Webhook/Listener
         │
         ▼
Update BTP Database
         │
         ▼
Refresh UI5 Worksheet
```

**OR**

```
User Action in BTP UI
         │
         ▼
BTP Extension Updates
         │
         ▼
POST to SuccessFactors API
         │
         ▼
SuccessFactors Updates
         │
         ▼
Sync back to BTP (optional)
```

---

## Configuration Steps

### Step 1: Configure SuccessFactors API Access

#### A. Get SuccessFactors API Credentials

1. **In SuccessFactors**:
   - Go to Admin Center
   - Navigate to Integration → API Management
   - Create OAuth Client (or use Basic Auth)

2. **Credentials Needed**:
   ```
   API URL: https://api.successfactors.eu (or your data center)
   Username: your_username
   Password: your_password
   Company ID: SFHUB003674
   ```

#### B. Configure in BTP

**Option 1: Environment Variables**
```bash
# In BAS terminal or BTP environment
export SF_URL=https://api.successfactors.eu
export SF_USERNAME=your_username
export SF_PASSWORD=your_password
export SF_COMPANY_ID=SFHUB003674
```

**Option 2: User-Provided Service (Cloud Foundry)**
```bash
cf create-user-provided-service successfactors-credentials \
  -p '{
    "url": "https://api.successfactors.eu",
    "username": "your_username",
    "password": "your_password",
    "companyId": "SFHUB003674"
  }'
```

---

### Step 2: Configure BTP Extension APIs

#### A. Deploy Your BTP Extension

```bash
# Build MTA
mbt build

# Deploy to BTP
cf deploy mta_archives/successfactors-compensation-extension_1.0.0.mtar
```

#### B. Get Your BTP API Endpoint

```bash
# After deployment
cf apps
# Note your app URL, e.g.:
# https://compensation-service-<space>.cfapps.us10-001.hana.ondemand.com
```

---

### Step 3: Configure SuccessFactors to Call BTP

#### A. Integration Center (OData)

1. **In SuccessFactors**:
   - Go to Admin Center → Integration Center
   - Create new OData Integration
   - Destination URL: `https://your-btp-app.cfapps.us10-001.hana.ondemand.com/compensation/CompensationService/`
   - Authentication: OAuth 2.0 or Basic
   - Test connection

2. **Create Integration Flow**:
   - Source: SuccessFactors Compensation
   - Target: BTP Extension API
   - Map fields
   - Schedule or trigger

#### B. Workflow / Business Rules

1. **Create Workflow**:
   - Trigger: Compensation form submission
   - Action: HTTP/HTTPS call
   - URL: `https://your-btp-app.cfapps.us10-001.hana.ondemand.com/compensation/CompensationService/postCompensationData`
   - Method: POST
   - Body: Compensation data JSON

2. **Example Workflow Action**:
   ```javascript
   {
     "action": "HTTP_POST",
     "url": "https://your-btp-app.cfapps.us10-001.hana.ondemand.com/compensation/CompensationService/postCompensationData",
     "headers": {
       "Authorization": "Bearer <token>",
       "Content-Type": "application/json"
     },
     "body": {
       "companyId": "${form.companyId}",
       "userId": "${currentUser}",
       "data": {
         "employeeId": "${form.employeeId}",
         "meritIncrease": "${form.meritIncrease}",
         "finalSalary": "${form.finalSalary}"
       }
     }
   }
   ```

---

## API Interaction Examples

### Example 1: GET Compensation Data

**From SuccessFactors to BTP**:
```bash
# SuccessFactors calls BTP
POST https://your-btp-app.cfapps.us10-001.hana.ondemand.com/compensation/CompensationService/getCompensationData
{
  "companyId": "SFHUB003674",
  "userId": "user@example.com",
  "formId": "FORM-2024-001"
}
```

**BTP Extension then calls SuccessFactors**:
```bash
# BTP calls SuccessFactors
GET https://api.successfactors.eu/odata/v2/Employee_Compensation?$filter=companyId eq 'SFHUB003674' and userId eq 'user@example.com'
```

**Response flows back**:
```
SuccessFactors → BTP Extension → UI5 Worksheet
```

---

### Example 2: POST Compensation Data

**From BTP UI to SuccessFactors**:
```bash
# User clicks Save in BTP UI
POST https://your-btp-app.cfapps.us10-001.hana.ondemand.com/compensation/CompensationService/postCompensationData
{
  "companyId": "SFHUB003674",
  "userId": "user@example.com",
  "data": {
    "employeeId": "EMP001",
    "meritIncrease": 3.0,
    "meritIncreaseAmount": 3000,
    "finalSalary": 105000
  }
}
```

**BTP Extension then calls SuccessFactors**:
```bash
# BTP calls SuccessFactors
POST https://api.successfactors.eu/odata/v2/Employee_Compensation
{
  "companyId": "SFHUB003674",
  "employeeId": "EMP001",
  "meritIncrease": 3.0,
  "meritIncreaseAmount": 3000,
  "finalSalary": 105000
}
```

**SuccessFactors updates and confirms**:
```
BTP Extension → SuccessFactors API → SuccessFactors Database
```

---

## Authentication

### BTP to SuccessFactors

**Option 1: Basic Authentication**
```javascript
// In your BTP service
const credentials = Buffer.from(`${username}:${password}`).toString('base64');
headers: {
  'Authorization': `Basic ${credentials}`
}
```

**Option 2: OAuth 2.0**
```javascript
// Get token first
POST https://api.successfactors.eu/oauth/token
{
  "grant_type": "client_credentials",
  "client_id": "your_client_id",
  "client_secret": "your_client_secret"
}

// Use token
headers: {
  'Authorization': `Bearer ${access_token}`
}
```

### SuccessFactors to BTP

**Option 1: XSUAA Token**
- BTP automatically handles XSUAA authentication
- SuccessFactors needs to authenticate with BTP

**Option 2: API Key**
- Create API key in BTP
- SuccessFactors uses API key in header

---

## Testing the Interaction

### Test 1: From BTP UI

1. **Open BTP Application**:
   ```
   http://localhost:4004/app/index.html
   ```

2. **Enter Credentials**:
   - Company ID: `SFHUB003674`
   - User ID: `your_user_id`
   - Form ID: `your_form_id`

3. **Click Refresh**:
   - BTP calls SuccessFactors API
   - Data loads in worksheet

4. **Edit Data**:
   - Change merit, adjustment, lump sum
   - Calculations update automatically

5. **Click Save**:
   - BTP calls SuccessFactors POST API
   - Data saved in SuccessFactors

### Test 2: From SuccessFactors

1. **Create Workflow**:
   - Trigger: Compensation form submission
   - Action: HTTP POST to BTP Extension

2. **Test Workflow**:
   - Submit compensation form in SuccessFactors
   - Workflow calls BTP Extension
   - BTP processes and responds

### Test 3: Direct API Calls

**Test GET**:
```bash
curl -X POST https://your-btp-app.cfapps.us10-001.hana.ondemand.com/compensation/CompensationService/getCompensationData \
  -H "Content-Type: application/json" \
  -d '{
    "companyId": "SFHUB003674",
    "userId": "user@example.com"
  }'
```

**Test POST**:
```bash
curl -X POST https://your-btp-app.cfapps.us10-001.hana.ondemand.com/compensation/CompensationService/postCompensationData \
  -H "Content-Type: application/json" \
  -d '{
    "companyId": "SFHUB003674",
    "userId": "user@example.com",
    "data": {
      "employeeId": "EMP001",
      "meritIncrease": 3.0,
      "finalSalary": 105000
    }
  }'
```

---

## Common Interaction Patterns

### Pattern 1: Read-Only Display
```
SuccessFactors → BTP Extension → UI5 Worksheet
(Display only, no updates)
```

### Pattern 2: Edit and Sync
```
SuccessFactors → BTP Extension → UI5 Worksheet
User edits → BTP Extension → SuccessFactors
```

### Pattern 3: Real-time Sync
```
SuccessFactors ←→ BTP Extension ←→ UI5 Worksheet
(Continuous bidirectional sync)
```

### Pattern 4: Batch Processing
```
SuccessFactors → BTP Extension (Batch)
Process multiple records
BTP Extension → SuccessFactors (Batch)
```

---

## Troubleshooting

### Issue: Authentication Failed

**Solution**:
- Check SuccessFactors credentials
- Verify OAuth token is valid
- Check API URL is correct

### Issue: Data Not Syncing

**Solution**:
- Check API endpoints are correct
- Verify field mappings
- Check logs: `cf logs compensation-service --recent`

### Issue: CORS Errors

**Solution**:
- Configure CORS in BTP Extension
- Add SuccessFactors domain to allowed origins

---

## Summary

**BTP ↔ SuccessFactors Interaction**:
1. ✅ **BTP Extension** provides REST/OData APIs
2. ✅ **SuccessFactors** calls BTP APIs (via workflows/integrations)
3. ✅ **BTP Extension** calls SuccessFactors APIs (Employee Compensation API v1)
4. ✅ **Bidirectional sync** enabled
5. ✅ **Real-time updates** possible

**Your setup is ready for interaction!** 🚀
