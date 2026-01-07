# Data Flow and API Operations - Complete Guide

## Overview

This document explains how data flows between SuccessFactors, BTP Extension, and the UI, and how GET and UPSERT APIs work.

## Complete Data Flow Architecture

```
┌─────────────────────────────────┐
│   SuccessFactors                │
│   Employee Compensation API     │
│   /odata/v2/Employee_Compensation│
└──────────────┬──────────────────┘
               │
               │ HTTP GET/POST/PATCH
               │ OData v2 Protocol
               │
┌──────────────▼──────────────────┐
│   SAP BTP Extension             │
│   Compensation Service           │
│                                 │
│   GET API:                      │
│   /getCompensationData          │
│                                 │
│   UPSERT API:                   │
│   /upsertCompensationData       │
│                                 │
│   UPDATE API:                   │
│   /updateCompensationData       │
│                                 │
│   POST API:                     │
│   /postCompensationData         │
└──────────────┬──────────────────┘
               │
               │ REST/OData v4
               │ JSON Data
               │
┌──────────────▼──────────────────┐
│   UI5 Frontend                  │
│   Compensation Worksheet        │
│                                 │
│   • Displays data               │
│   • User edits                  │
│   • Calls APIs on Save          │
└─────────────────────────────────┘
```

## API Endpoints Available

### 1. GET Compensation Data

**Endpoint**: `POST /compensation/CompensationService/getCompensationData`

**Purpose**: Fetch compensation data from SuccessFactors

**Request**:
```json
{
  "companyId": "SFHUB003674",
  "userId": "sfadmin"
}
```

**Response**:
```json
[
  {
    "id": "uuid-here",
    "companyId": "SFHUB003674",
    "userId": "sfadmin",
    "employeeId": "EMP001",
    "employeeName": "John Doe",
    "currentSalary": 100000,
    "meritIncrease": 3.0,
    "finalSalary": 103000,
    "compensationStatus": "Draft"
  }
]
```

**Flow**:
1. UI calls BTP API
2. BTP API calls SuccessFactors API
3. SuccessFactors returns data
4. BTP transforms data to local format
5. BTP returns to UI
6. UI displays in table

---

### 2. UPSERT Compensation Data

**Endpoint**: `POST /compensation/CompensationService/upsertCompensationData`

**Purpose**: Insert if new, Update if exists

**Request**:
```json
{
  "companyId": "SFHUB003674",
  "userId": "sfadmin",
  "data": {
    "employeeId": "EMP001",
    "meritIncrease": 3.5,
    "finalSalary": 103500,
    "compensationStatus": "Pending"
  }
}
```

**Response**:
```json
{
  "id": "uuid-here",
  "employeeId": "EMP001",
  "meritIncrease": 3.5,
  "finalSalary": 103500,
  "compensationStatus": "Pending"
}
```

**Flow**:
1. UI calls BTP UPSERT API
2. BTP checks if record exists (by employeeId/formId/companyId)
3. If exists: Calls SuccessFactors PATCH API
4. If not exists: Calls SuccessFactors POST API
5. SuccessFactors updates/creates record
6. BTP returns updated data
7. UI refreshes display

---

### 3. UPDATE Compensation Data

**Endpoint**: `POST /compensation/CompensationService/updateCompensationData`

**Purpose**: Update existing compensation records

**Request**:
```json
{
  "companyId": "SFHUB003674",
  "userId": "sfadmin",
  "data": [
    {
      "employeeId": "EMP001",
      "meritIncrease": 3.5,
      "finalSalary": 103500
    },
    {
      "employeeId": "EMP002",
      "meritIncrease": 4.0,
      "finalSalary": 104000
    }
  ]
}
```

**Response**: Success message

**Flow**:
1. UI calls BTP UPDATE API with array of records
2. BTP loops through records
3. For each record, calls SuccessFactors PATCH API
4. SuccessFactors updates records
5. BTP confirms success
6. UI shows success message

---

### 4. POST Compensation Data

**Endpoint**: `POST /compensation/CompensationService/postCompensationData`

**Purpose**: Create new compensation record

**Request**:
```json
{
  "companyId": "SFHUB003674",
  "userId": "sfadmin",
  "data": {
    "employeeId": "EMP003",
    "currentSalary": 95000,
    "meritIncrease": 3.0,
    "finalSalary": 97850
  }
}
```

**Response**:
```json
{
  "id": "new-uuid-here",
  "employeeId": "EMP003",
  "currentSalary": 95000,
  "meritIncrease": 3.0,
  "finalSalary": 97850
}
```

**Flow**:
1. UI calls BTP POST API
2. BTP calls SuccessFactors POST API
3. SuccessFactors creates new record
4. SuccessFactors returns created record
5. BTP returns to UI
6. UI adds to table

---

## How Data Consumption Works

### Step 1: User Opens UI

**Scenario**: User clicks "Compensation Worksheet" tile in SuccessFactors

**URL**: 
```
https://your-btp-app.cfapps.us10-001.hana.ondemand.com/app/index.html?companyId=SFHUB003674&userId=sfadmin
```

**What Happens**:
1. BTP UI loads
2. Controller reads URL parameters
3. If `userId` exists, automatically calls GET API
4. Data loads and displays in table

---

### Step 2: GET API Call (Auto-Load)

**In Controller** (`CompensationWorksheet.controller.js`):

```javascript
onInit: function () {
    // Get userId from URL
    var sUserId = oUriParams.get('userId');
    
    // If userId provided, auto-load data
    if (sUserId) {
        setTimeout(function() {
            this.onRefresh(); // Calls GET API
        }.bind(this), 1000);
    }
}

onRefresh: function () {
    // Get companyId and userId
    var sCompanyId = oModel.getProperty("/companyId");
    var sUserId = oModel.getProperty("/userId");
    
    // Call BTP GET API
    $.ajax({
        url: "/compensation/CompensationService/getCompensationData",
        method: "POST",
        data: JSON.stringify({
            companyId: sCompanyId,
            userId: sUserId
        }),
        success: function (data) {
            // Data received from SuccessFactors
            oModel.setProperty("/CompensationWorksheet", data);
        }
    });
}
```

**Backend** (`compensation-service.js`):

```javascript
this.on('getCompensationData', async (req) => {
    const { companyId, userId } = req.data;
    
    // Call SuccessFactors API
    const endpoint = `/odata/v2/Employee_Compensation?$filter=companyId eq '${companyId}' and userId eq '${userId}'`;
    const response = await callSFAPI(endpoint, 'GET');
    
    // Transform SuccessFactors data to local format
    const transformedData = response.data.d.results.map(item => ({
        id: item.id || cds.utils.uuid(),
        companyId: item.companyId,
        userId: item.userId,
        employeeId: item.employeeId,
        employeeName: item.employeeName,
        currentSalary: item.currentSalary,
        meritIncrease: item.meritIncrease,
        finalSalary: item.finalSalary,
        // ... more fields
    }));
    
    return transformedData;
});
```

---

### Step 3: User Edits Data

**What Happens**:
1. User edits values in table (merit %, adjustment %, etc.)
2. Calculations happen automatically (onCalculateTotal)
3. Data is stored in local model (JSONModel)
4. No API call yet - just local changes

---

### Step 4: User Clicks Save

**In Controller**:

```javascript
onSave: function () {
    // Get all edited data
    var aData = oModel.getProperty("/CompensationWorksheet");
    var sCompanyId = oModel.getProperty("/companyId");
    var sUserId = oModel.getProperty("/userId");
    
    // Call BTP UPDATE API
    $.ajax({
        url: "/compensation/CompensationService/updateCompensationData",
        method: "POST",
        data: JSON.stringify({
            companyId: sCompanyId,
            userId: sUserId,
            data: aData
        }),
        success: function () {
            MessageToast.show("Data saved successfully");
        }
    });
}
```

**Backend**:

```javascript
this.on('updateCompensationData', async (req) => {
    const { companyId, userId, data } = req.data;
    
    // Loop through each record
    for (const item of data) {
        // Check if record exists in SuccessFactors
        const checkEndpoint = `/odata/v2/Employee_Compensation?$filter=employeeId eq '${item.employeeId}' and companyId eq '${companyId}'`;
        const existing = await callSFAPI(checkEndpoint, 'GET');
        
        if (existing.data.d.results.length > 0) {
            // UPDATE - Record exists
            const updateEndpoint = `/odata/v2/Employee_Compensation('${existing.data.d.results[0].id}')`;
            await callSFAPI(updateEndpoint, 'PATCH', item);
        } else {
            // INSERT - New record
            const createEndpoint = `/odata/v2/Employee_Compensation`;
            await callSFAPI(createEndpoint, 'POST', item);
        }
    }
    
    return { success: true };
});
```

---

## UPSERT API - How It Works

### What is UPSERT?

**UPSERT** = **UP**date + in**SERT**
- If record exists → UPDATE it
- If record doesn't exist → INSERT it

### UPSERT Flow

**Step 1: UI Calls UPSERT**

```javascript
onUpsert: function () {
    var oRow = oModel.getProperty("/selectedRow");
    
    $.ajax({
        url: "/compensation/CompensationService/upsertCompensationData",
        method: "POST",
        data: JSON.stringify({
            companyId: "SFHUB003674",
            userId: "sfadmin",
            data: oRow
        }),
        success: function (result) {
            // Result contains updated/created record
            MessageToast.show("Record saved");
        }
    });
}
```

**Step 2: Backend Checks if Exists**

```javascript
this.on('upsertCompensationData', async (req) => {
    const { companyId, userId, data } = req.data;
    
    // Search for existing record
    const searchEndpoint = `/odata/v2/Employee_Compensation?$filter=employeeId eq '${data.employeeId}' and companyId eq '${companyId}' and userId eq '${userId}'`;
    const searchResult = await callSFAPI(searchEndpoint, 'GET');
    
    if (searchResult.data.d.results.length > 0) {
        // RECORD EXISTS - UPDATE
        const existingId = searchResult.data.d.results[0].id;
        const updateEndpoint = `/odata/v2/Employee_Compensation('${existingId}')`;
        const response = await callSFAPI(updateEndpoint, 'PATCH', data);
        return response.data.d;
    } else {
        // RECORD DOESN'T EXIST - INSERT
        const createEndpoint = `/odata/v2/Employee_Compensation`;
        const response = await callSFAPI(createEndpoint, 'POST', data);
        return response.data.d;
    }
});
```

**Step 3: SuccessFactors Updates/Creates**

- If UPDATE: SuccessFactors modifies existing record
- If INSERT: SuccessFactors creates new record

**Step 4: Return Result**

- BTP returns updated/created record
- UI updates display

---

## Complete Example Flow

### Scenario: User Edits and Saves Compensation

```
1. User opens UI
   ↓
2. URL has userId → Auto-loads data
   ↓
3. GET API called:
   POST /getCompensationData
   {
     "companyId": "SFHUB003674",
     "userId": "sfadmin"
   }
   ↓
4. BTP calls SuccessFactors:
   GET /odata/v2/Employee_Compensation?$filter=companyId eq 'SFHUB003674' and userId eq 'sfadmin'
   ↓
5. SuccessFactors returns data
   ↓
6. BTP transforms and returns to UI
   ↓
7. UI displays data in table
   ↓
8. User edits merit % from 3.0 to 3.5
   ↓
9. Calculations update automatically
   ↓
10. User clicks Save
    ↓
11. UPDATE API called:
    POST /updateCompensationData
    {
      "companyId": "SFHUB003674",
      "userId": "sfadmin",
      "data": [
        {
          "employeeId": "EMP001",
          "meritIncrease": 3.5,
          "finalSalary": 103500
        }
      ]
    }
    ↓
12. BTP calls SuccessFactors:
    PATCH /odata/v2/Employee_Compensation('{id}')
    {
      "meritIncrease": 3.5,
      "finalSalary": 103500
    }
    ↓
13. SuccessFactors updates record
    ↓
14. BTP confirms success
    ↓
15. UI shows "Data saved successfully"
```

---

## API Usage Examples

### Example 1: Get All Compensation for User

```javascript
// In UI Controller
onRefresh: function () {
    $.ajax({
        url: "/compensation/CompensationService/getCompensationData",
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify({
            companyId: "SFHUB003674",
            userId: "sfadmin"
        }),
        success: function (data) {
            // data is array of compensation records
            oModel.setProperty("/CompensationWorksheet", data);
        }
    });
}
```

### Example 2: UPSERT Single Record

```javascript
// In UI Controller
onSaveRow: function (oEvent) {
    var oRow = oEvent.getSource().getBindingContext("compensation").getObject();
    
    $.ajax({
        url: "/compensation/CompensationService/upsertCompensationData",
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify({
            companyId: "SFHUB003674",
            userId: "sfadmin",
            data: oRow
        }),
        success: function (result) {
            // result is the saved record (updated or created)
            MessageToast.show("Record saved");
        }
    });
}
```

### Example 3: Update Multiple Records

```javascript
// In UI Controller
onSave: function () {
    var aData = oModel.getProperty("/CompensationWorksheet");
    
    $.ajax({
        url: "/compensation/CompensationService/updateCompensationData",
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify({
            companyId: "SFHUB003674",
            userId: "sfadmin",
            data: aData
        }),
        success: function () {
            MessageToast.show("All records saved");
        }
    });
}
```

---

## Data Transformation

### SuccessFactors → BTP Format

**SuccessFactors API Response**:
```json
{
  "d": {
    "results": [
      {
        "__metadata": {...},
        "userId": "sfadmin",
        "companyId": "SFHUB003674",
        "employeeId": "EMP001",
        "meritIncrease": 3.0,
        "meritIncreaseAmount": 3000,
        "finalSalary": 103000
      }
    ]
  }
}
```

**BTP Transforms To**:
```json
[
  {
    "id": "uuid-here",
    "companyId": "SFHUB003674",
    "userId": "sfadmin",
    "employeeId": "EMP001",
    "meritIncrease": 3.0,
    "meritIncreaseAmount": 3000,
    "finalSalary": 103000,
    "compensationStatus": "Draft"
  }
]
```

### BTP → SuccessFactors Format

**BTP Sends**:
```json
{
  "employeeId": "EMP001",
  "meritIncrease": 3.5,
  "finalSalary": 103500
}
```

**SuccessFactors Receives** (via PATCH):
```json
{
  "meritIncrease": 3.5,
  "finalSalary": 103500
}
```

---

## Summary

### GET API
- **Purpose**: Fetch data from SuccessFactors
- **When**: On page load, on Refresh button
- **Flow**: UI → BTP → SuccessFactors → BTP → UI

### UPSERT API
- **Purpose**: Insert or Update (smart save)
- **When**: Save single record
- **Flow**: UI → BTP → Check if exists → UPDATE or INSERT → SuccessFactors → BTP → UI

### UPDATE API
- **Purpose**: Update existing records
- **When**: Save all records
- **Flow**: UI → BTP → Loop records → PATCH each → SuccessFactors → BTP → UI

### POST API
- **Purpose**: Create new record
- **When**: Add new employee
- **Flow**: UI → BTP → POST → SuccessFactors → BTP → UI

**All APIs work bidirectionally - data flows from SuccessFactors to BTP and back!** 🔄
