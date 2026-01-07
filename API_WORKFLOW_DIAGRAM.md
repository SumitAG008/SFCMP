# API Workflow - Visual Guide

## GET API - Data Flow

```
┌─────────────┐
│   User      │
│   (UI)      │
└──────┬──────┘
       │
       │ 1. User clicks "Refresh" or page loads with userId
       │
       ▼
┌─────────────────────────────────┐
│   UI Controller                 │
│   onRefresh()                   │
└──────┬──────────────────────────┘
       │
       │ 2. Calls BTP API
       │ POST /getCompensationData
       │ {
       │   "companyId": "SFHUB003674",
       │   "userId": "sfadmin"
       │ }
       │
       ▼
┌─────────────────────────────────┐
│   BTP Service                   │
│   getCompensationData()         │
└──────┬──────────────────────────┘
       │
       │ 3. Builds SuccessFactors query
       │ GET /odata/v2/Employee_Compensation
       │ ?$filter=companyId eq 'SFHUB003674' 
       │   and userId eq 'sfadmin'
       │
       ▼
┌─────────────────────────────────┐
│   SuccessFactors API             │
│   Employee Compensation API v1   │
└──────┬──────────────────────────┘
       │
       │ 4. Returns OData response
       │ {
       │   "d": {
       │     "results": [
       │       {
       │         "employeeId": "EMP001",
       │         "meritIncrease": 3.0,
       │         "finalSalary": 103000
       │       }
       │     ]
       │   }
       │ }
       │
       ▼
┌─────────────────────────────────┐
│   BTP Service                   │
│   Transforms data                │
└──────┬──────────────────────────┘
       │
       │ 5. Maps SF fields to local format
       │ [
       │   {
       │     "id": "uuid",
       │     "employeeId": "EMP001",
       │     "meritIncrease": 3.0,
       │     "finalSalary": 103000
       │   }
       │ ]
       │
       ▼
┌─────────────────────────────────┐
│   UI Controller                 │
│   Receives data                  │
└──────┬──────────────────────────┘
       │
       │ 6. Updates model
       │ oModel.setProperty("/CompensationWorksheet", data)
       │
       ▼
┌─────────────────────────────────┐
│   UI Table                      │
│   Displays data                  │
└─────────────────────────────────┘
```

## UPSERT API - Data Flow

```
┌─────────────┐
│   User      │
│   (UI)      │
└──────┬──────┘
       │
       │ 1. User edits row and clicks "Save Row"
       │
       ▼
┌─────────────────────────────────┐
│   UI Controller                 │
│   onSaveRow()                   │
└──────┬──────────────────────────┘
       │
       │ 2. Calls BTP UPSERT API
       │ POST /upsertCompensationData
       │ {
       │   "companyId": "SFHUB003674",
       │   "userId": "sfadmin",
       │   "data": {
       │     "employeeId": "EMP001",
       │     "meritIncrease": 3.5,
       │     "finalSalary": 103500
       │   }
       │ }
       │
       ▼
┌─────────────────────────────────┐
│   BTP Service                   │
│   upsertCompensationData()      │
└──────┬──────────────────────────┘
       │
       │ 3. SEARCH: Check if record exists
       │ GET /odata/v2/Employee_Compensation
       │ ?$filter=employeeId eq 'EMP001' 
       │   and companyId eq 'SFHUB003674'
       │
       ▼
┌─────────────────────────────────┐
│   SuccessFactors API             │
│   Returns search results         │
└──────┬──────────────────────────┘
       │
       │ 4. Response: { "d": { "results": [...] } }
       │
       ▼
┌─────────────────────────────────┐
│   BTP Service                   │
│   Decision Logic                 │
└──────┬──────────────────────────┘
       │
       ├─ IF results.length > 0 ────┐
       │                            │
       │                            ▼
       │              ┌─────────────────────────────┐
       │              │   UPDATE Path               │
       │              │   PATCH /Employee_Compensation('{id}')│
       │              └─────────────────────────────┘
       │
       └─ ELSE ─────────────────────┐
                                    │
                                    ▼
                    ┌─────────────────────────────┐
                    │   INSERT Path               │
                    │   POST /Employee_Compensation│
                    └─────────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│   SuccessFactors API             │
│   Updates or Creates record     │
└──────┬──────────────────────────┘
       │
       │ 5. Returns updated/created record
       │
       ▼
┌─────────────────────────────────┐
│   BTP Service                   │
│   Returns result                 │
└──────┬──────────────────────────┘
       │
       │ 6. Returns to UI
       │
       ▼
┌─────────────────────────────────┐
│   UI Controller                 │
│   Shows success message          │
└─────────────────────────────────┘
```

## UPDATE API - Data Flow (Multiple Records)

```
┌─────────────┐
│   User      │
│   (UI)      │
└──────┬──────┘
       │
       │ 1. User edits multiple rows, clicks "Save"
       │
       ▼
┌─────────────────────────────────┐
│   UI Controller                 │
│   onSave()                      │
└──────┬──────────────────────────┘
       │
       │ 2. Calls BTP UPDATE API
       │ POST /updateCompensationData
       │ {
       │   "companyId": "SFHUB003674",
       │   "userId": "sfadmin",
       │   "data": [
       │     { "employeeId": "EMP001", "meritIncrease": 3.5 },
       │     { "employeeId": "EMP002", "meritIncrease": 4.0 }
       │   ]
       │ }
       │
       ▼
┌─────────────────────────────────┐
│   BTP Service                   │
│   updateCompensationData()      │
└──────┬──────────────────────────┘
       │
       │ 3. Loop through each record
       │
       ├─ Record 1 ────────────────┐
       │                           │
       │ 4. Check if exists        │
       │ GET /Employee_Compensation?$filter=...
       │                           │
       │ 5a. IF EXISTS:            │
       │ PATCH /Employee_Compensation('{id}')│
       │                           │
       │ 5b. IF NOT EXISTS:        │
       │ POST /Employee_Compensation│
       │                           │
       ├─ Record 2 ────────────────┤
       │ (Same process)            │
       │                           │
       └─ Record N ────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│   SuccessFactors API             │
│   All records updated            │
└──────┬──────────────────────────┘
       │
       │ 6. Returns success
       │
       ▼
┌─────────────────────────────────┐
│   UI Controller                 │
│   Shows "All records saved"      │
└─────────────────────────────────┘
```

## Data Consumption - Step by Step

### Step 1: Page Load with URL Parameters

**URL**: 
```
https://your-btp-app.cfapps.us10-001.hana.ondemand.com/app/index.html?companyId=SFHUB003674&userId=sfadmin
```

**What Happens**:
1. UI loads
2. Controller reads URL parameters
3. Sets model properties:
   - `companyId = "SFHUB003674"`
   - `userId = "sfadmin"`
4. Auto-triggers `onRefresh()` after 1 second

---

### Step 2: GET API Call (Auto-Load)

**Controller Code**:
```javascript
onRefresh: function () {
    // Get values from model
    var sCompanyId = oModel.getProperty("/companyId"); // "SFHUB003674"
    var sUserId = oModel.getProperty("/userId");        // "sfadmin"
    
    // Call BTP API
    $.ajax({
        url: "/compensation/CompensationService/getCompensationData",
        method: "POST",
        data: JSON.stringify({
            companyId: sCompanyId,
            userId: sUserId
        })
    });
}
```

**Backend Code**:
```javascript
this.on('getCompensationData', async (req) => {
    const { companyId, userId } = req.data;
    
    // Build SuccessFactors query
    const endpoint = `/odata/v2/Employee_Compensation?$filter=companyId eq '${companyId}' and userId eq '${userId}'`;
    
    // Call SuccessFactors
    const sfData = await callSFAPI(endpoint, 'GET');
    
    // Transform data
    const compensationData = sfData.d.results.map(item => ({
        employeeId: item.employeeId,
        meritIncrease: item.meritIncrease,
        finalSalary: item.finalSalary
        // ... more fields
    }));
    
    return compensationData;
});
```

**Result**: Data appears in UI table

---

### Step 3: User Edits Data

**What Happens**:
- User changes merit % from 3.0 to 3.5
- `onCalculateTotal()` function runs automatically
- Calculations update:
  - `totalIncrease = merit + adjustment`
  - `finalSalary = currentSalary * (1 + totalIncrease/100)`
- Data stored in local model (JSONModel)
- **No API call yet** - just local changes

---

### Step 4: User Clicks Save

**Controller Code**:
```javascript
onSave: function () {
    // Get all edited data
    var aData = oModel.getProperty("/CompensationWorksheet");
    
    // Call BTP UPDATE API
    $.ajax({
        url: "/compensation/CompensationService/updateCompensationData",
        method: "POST",
        data: JSON.stringify({
            companyId: "SFHUB003674",
            userId: "sfadmin",
            data: aData  // Array of all records
        })
    });
}
```

**Backend Code**:
```javascript
this.on('updateCompensationData', async (req) => {
    const { companyId, userId, data } = req.data;
    
    // Loop through each record
    for (const item of data) {
        if (item.id && item.id !== 'new') {
            // UPDATE existing
            await callSFAPI(`/odata/v2/Employee_Compensation('${item.id}')`, 'PATCH', item);
        } else {
            // CREATE new
            await callSFAPI(`/odata/v2/Employee_Compensation`, 'POST', item);
        }
    }
    
    return { success: true };
});
```

**Result**: SuccessFactors updated, UI shows success message

---

## UPSERT - How It Works

### What is UPSERT?

**UPSERT = UPDATE + INSERT**

- **If record exists** → UPDATE it
- **If record doesn't exist** → INSERT it

### UPSERT Logic

```javascript
this.on('upsertCompensationData', async (req) => {
    const { companyId, userId, data } = req.data;
    
    // STEP 1: Search for existing record
    const searchEndpoint = `/odata/v2/Employee_Compensation?$filter=employeeId eq '${data.employeeId}' and companyId eq '${companyId}' and userId eq '${userId}'`;
    const searchResult = await callSFAPI(searchEndpoint, 'GET');
    
    // STEP 2: Check if found
    if (searchResult.d.results.length > 0) {
        // RECORD EXISTS - UPDATE
        const existingId = searchResult.d.results[0].id;
        const updateEndpoint = `/odata/v2/Employee_Compensation('${existingId}')`;
        const response = await callSFAPI(updateEndpoint, 'PATCH', data);
        return response.d; // Return updated record
    } else {
        // RECORD DOESN'T EXIST - INSERT
        const createEndpoint = `/odata/v2/Employee_Compensation`;
        const response = await callSFAPI(createEndpoint, 'POST', data);
        return response.d; // Return created record
    }
});
```

### When to Use UPSERT

- **Single record save** - Use UPSERT
- **Bulk save** - Use UPDATE (handles multiple records)
- **New record** - Use POST
- **Existing record** - Use UPDATE or UPSERT

---

## Complete Example

### Scenario: User Edits and Saves

```
1. User opens: 
   ?companyId=SFHUB003674&userId=sfadmin
   
2. Auto-load triggers GET API:
   POST /getCompensationData
   → BTP calls SuccessFactors
   → SuccessFactors returns 3 employees
   → UI displays 3 rows
   
3. User edits Employee 1:
   - Merit %: 3.0 → 3.5
   - Final Salary: 103000 → 103500 (auto-calculated)
   
4. User clicks "Save":
   POST /updateCompensationData
   {
     "data": [
       { "employeeId": "EMP001", "meritIncrease": 3.5, "finalSalary": 103500 },
       { "employeeId": "EMP002", "meritIncrease": 4.0, "finalSalary": 104000 },
       { "employeeId": "EMP003", "meritIncrease": 2.5, "finalSalary": 102500 }
     ]
   }
   
5. BTP processes:
   - For each record, calls SuccessFactors PATCH
   - SuccessFactors updates all 3 records
   
6. UI shows: "Data saved successfully"
```

---

## API Endpoints Summary

| API | Method | Purpose | When to Use |
|-----|--------|---------|-------------|
| **GET** | POST | Fetch data | Page load, Refresh button |
| **UPDATE** | POST | Update multiple | Save all records |
| **UPSERT** | POST | Insert or Update | Save single record |
| **POST** | POST | Create new | Add new employee |

---

## Key Points

✅ **GET API**: Fetches data from SuccessFactors → BTP → UI
✅ **UPDATE API**: Updates multiple records in SuccessFactors
✅ **UPSERT API**: Smart save - updates if exists, inserts if new
✅ **POST API**: Creates new records in SuccessFactors
✅ **Auto-Load**: If userId in URL, data loads automatically
✅ **Bidirectional**: Data flows both ways (SF ↔ BTP ↔ UI)

**All APIs work together to provide seamless data synchronization!** 🔄
