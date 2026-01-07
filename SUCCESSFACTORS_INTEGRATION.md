# SuccessFactors → BTP Extension Integration Guide

## Architecture Overview

You're building a **Clean Core Extension** because:
- ✅ SuccessFactors doesn't have a standard way to achieve this
- ✅ No direct API exists for data flow from SuccessFactors frontend to BTP Extension
- ✅ You need custom compensation worksheet functionality

**Solution**: BTP Extension with REST/OData APIs that SuccessFactors can call

---

## Data Flow Architecture

```
┌─────────────────────────────────┐
│     SuccessFactors               │
│  Compensation Module             │
└──────────────┬──────────────────┘
               │
               │ HTTP/HTTPS API Calls
               │ GET / POST / UPDATE / UPSERT
               ▼
┌─────────────────────────────────┐
│   SAP BTP Extension             │
│   Compensation Service (CAP)     │
│                                  │
│   APIs Available:                │
│   • GET    - Retrieve data       │
│   • POST   - Create new record   │
│   • UPDATE - Modify existing     │
│   • UPSERT - Insert or Update    │
└──────────────┬──────────────────┘
               │
               │ Process & Store
               ▼
┌─────────────────────────────────┐
│   Compensation Worksheet         │
│   (UI5 Application)             │
│   - View data                   │
│   - Edit compensation           │
│   - Calculate increases         │
└─────────────────────────────────┘
```

---

## Why This Approach?

### Problem Statement
1. **No Standard API**: SuccessFactors doesn't provide direct APIs for custom compensation workflows
2. **No Frontend Extension**: Can't extend SuccessFactors UI directly
3. **Custom Requirements**: Need custom calculation logic and worksheet

### Solution: BTP Extension as Bridge
1. **BTP Extension** provides REST/OData APIs
2. **SuccessFactors** calls these APIs (via workflows, integrations, or custom code)
3. **Data flows** from SuccessFactors → BTP Extension → Compensation Worksheet
4. **Bidirectional sync** possible (BTP → SuccessFactors)

---

## API Operations Available

### 1. GET - Retrieve Compensation Data
**Purpose**: Fetch compensation data from BTP Extension

**SuccessFactors calls**:
```
POST /compensation/CompensationService/getCompensationData
```

**Use Case**: 
- SuccessFactors needs to display compensation data
- Sync data from BTP to SuccessFactors
- Retrieve compensation history

### 2. POST - Create New Record
**Purpose**: Create new compensation record in BTP Extension

**SuccessFactors calls**:
```
POST /compensation/CompensationService/postCompensationData
```

**Use Case**:
- New employee compensation setup
- Annual compensation cycle initiation
- Manual compensation entry

### 3. UPDATE - Modify Existing Record
**Purpose**: Update existing compensation data

**SuccessFactors calls**:
```
POST /compensation/CompensationService/updateCompensationData
```

**Use Case**:
- Modify proposed salary
- Update merit increase percentage
- Change compensation status
- Add comments/notes

### 4. UPSERT - Insert or Update
**Purpose**: Smart operation - updates if exists, creates if not

**SuccessFactors calls**:
```
POST /compensation/CompensationService/upsertCompensationData
```

**Use Case**:
- Idempotent operations (safe to retry)
- Bulk data sync
- Automated compensation updates
- **Best for workflows** - won't fail if record already exists

---

## How SuccessFactors Integrates

### Method 1: Integration Center (OData)

1. **Configure OData Destination**:
   - Go to SuccessFactors Integration Center
   - Create new OData destination
   - Point to: `https://your-btp-app.cfapps.us10-001.hana.ondemand.com/compensation/CompensationService/`
   - Configure authentication

2. **Use in Integration**:
   - Create integration flow
   - Use OData operations (GET, POST, PATCH)
   - Map SuccessFactors fields to BTP Extension fields

### Method 2: Workflow / Business Rules

1. **Create Workflow**:
   - Trigger: Compensation form submission
   - Action: HTTP/HTTPS call to BTP Extension API
   - Method: POST /upsertCompensationData
   - Payload: Compensation data

2. **Example Workflow**:
   ```
   When: Compensation form submitted
   Then: Call BTP Extension API
        POST /compensation/CompensationService/upsertCompensationData
        Body: { employeeId, proposedSalary, ... }
   ```

### Method 3: Custom API Integration

1. **SuccessFactors API** → **BTP Extension API**
   - Use SuccessFactors API to get compensation data
   - Transform data
   - Call BTP Extension POST/UPDATE API
   - Store in BTP Extension

2. **Scheduled Job**:
   - Run periodically (daily, weekly)
   - Fetch from SuccessFactors
   - Sync to BTP Extension

---

## Implementation Steps

### Step 1: Deploy BTP Extension

```bash
# Build and deploy
mbt build
cf deploy mta_archives/successfactors-compensation-extension_1.0.0.mtar
```

### Step 2: Get API Endpoint

```bash
# Get your app URL
cf apps
# Example: https://compensation-service-<space>.cfapps.us10-001.hana.ondemand.com
```

### Step 3: Configure SuccessFactors

1. **Create OData Destination** in SuccessFactors:
   - URL: `https://your-btp-app.cfapps.us10-001.hana.ondemand.com/compensation/CompensationService/`
   - Authentication: OAuth 2.0 or Basic
   - Test connection

2. **Create Integration Flow**:
   - Source: SuccessFactors Compensation
   - Target: BTP Extension API
   - Map fields
   - Schedule or trigger

### Step 4: Test Integration

1. **Test from SuccessFactors**:
   - Submit compensation form
   - Verify data flows to BTP Extension
   - Check Compensation Worksheet UI

2. **Test from BTP Extension**:
   - Use Compensation Worksheet UI
   - Update data
   - Verify sync back to SuccessFactors (if configured)

---

## API Endpoints Summary

| Operation | Method | Endpoint | Use Case |
|-----------|--------|----------|----------|
| **GET** | POST | `/getCompensationData` | Retrieve compensation data |
| **POST** | POST | `/postCompensationData` | Create new record |
| **UPDATE** | POST | `/updateCompensationData` | Update existing record |
| **UPSERT** | POST | `/upsertCompensationData` | Insert or update (recommended) |
| **OData GET** | GET | `/CompensationWorksheet?$filter=...` | Standard OData query |
| **OData POST** | POST | `/CompensationWorksheet` | Standard OData create |
| **OData PATCH** | PATCH | `/CompensationWorksheet('id')` | Standard OData update |
| **OData DELETE** | DELETE | `/CompensationWorksheet('id')` | Standard OData delete |

---

## Best Practices

### 1. Use UPSERT for Workflows
- **Why**: Idempotent - safe to retry
- **When**: Automated workflows, scheduled jobs
- **Example**: Annual compensation cycle sync

### 2. Use POST for New Records
- **Why**: Explicit creation
- **When**: Manual entry, new employee setup
- **Example**: HR creates new compensation record

### 3. Use UPDATE for Modifications
- **Why**: Clear intent to modify
- **When**: User-initiated changes
- **Example**: Manager updates proposed salary

### 4. Error Handling
- Always handle API errors in SuccessFactors workflows
- Implement retry logic for failed calls
- Log all API interactions

### 5. Security
- Use OAuth 2.0 for authentication
- Validate all input data
- Implement rate limiting
- Use HTTPS only

---

## Example: SuccessFactors Workflow

### Scenario: Compensation Form Submission

```javascript
// SuccessFactors Workflow Action
{
  "trigger": "CompensationFormSubmitted",
  "action": "HTTP_POST",
  "url": "https://compensation-service.cfapps.us10-001.hana.ondemand.com/compensation/CompensationService/upsertCompensationData",
  "method": "POST",
  "headers": {
    "Authorization": "Bearer <token>",
    "Content-Type": "application/json"
  },
  "body": {
    "companyId": "SFHUB003674",
    "userId": "${currentUser}",
    "data": {
      "employeeId": "${form.employeeId}",
      "formId": "${form.formId}",
      "proposedSalary": "${form.proposedSalary}",
      "meritIncrease": "${form.meritIncrease}",
      "promotionIncrease": "${form.promotionIncrease}",
      "status": "${form.status}",
      "comments": "${form.comments}"
    }
  }
}
```

---

## Monitoring & Troubleshooting

### Check API Logs
```bash
# View BTP Extension logs
cf logs compensation-service --recent

# Filter for API calls
cf logs compensation-service --recent | grep "POST\|GET\|PATCH"
```

### Test APIs Directly
```bash
# Test GET
curl -X POST https://your-app.cfapps.us10-001.hana.ondemand.com/compensation/CompensationService/getCompensationData \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"companyId":"SFHUB003674","userId":"test@example.com"}'
```

### Verify Data Flow
1. Check SuccessFactors workflow execution logs
2. Check BTP Extension API logs
3. Verify data in Compensation Worksheet UI
4. Check database for stored records

---

## Summary

✅ **BTP Extension provides APIs** that SuccessFactors can call  
✅ **GET/POST/UPDATE/UPSERT** operations all supported  
✅ **Bidirectional data flow** possible  
✅ **Clean Core approach** - no modification to SuccessFactors standard  
✅ **Extensible** - can add more APIs as needed  

**Your extension is ready to receive data from SuccessFactors!** 🚀
