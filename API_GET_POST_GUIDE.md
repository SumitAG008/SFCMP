# API GET and POST Operations - Complete Guide

## 📋 Overview

This guide explains how to use GET and POST operations to retrieve and save compensation data in the application.

---

## 🔍 GET Operations

### 1. Get Compensation Data

**Endpoint**: `POST /compensation/CompensationService/getCompensationData`

**Purpose**: Retrieve compensation data from SuccessFactors and display in the worksheet.

**Request**:
```json
{
  "companyId": "SFHUB003674",
  "userId": "sfadmin",
  "formId": "FORM_2026_Q1"  // Optional
}
```

**Response**:
```json
[
  {
    "id": "uuid-123",
    "companyId": "SFHUB003674",
    "userId": "sfadmin",
    "employeeId": "EMP001",
    "employeeName": "John Doe",
    "jobTitle": "Software Engineer",
    "currentSalary": 100000,
    "meritIncrease": 3.0,
    "meritIncreaseAmount": 3000,
    "finalSalary": 103000,
    "currency": "USD",
    "status": "Draft"
  }
]
```

**Usage in Frontend**:
```javascript
// In CompensationWorksheet.controller.js
onRefresh: function () {
    var oView = this.getView();
    var oModel = oView.getModel("compensation");
    var sCompanyId = oModel.getProperty("/companyId");
    var sUserId = oModel.getProperty("/userId");

    oView.setBusy(true);

    $.ajax({
        url: "/compensation/CompensationService/getCompensationData",
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify({
            companyId: sCompanyId,
            userId: sUserId
        }),
        success: function (data) {
            // ✅ Data received - automatically displays in table
            oModel.setProperty("/CompensationWorksheet", data || []);
            oModel.setProperty("/totalEmployees", data.length);
            MessageToast.show("Loaded " + data.length + " employees");
            oView.setBusy(false);
        },
        error: function (error) {
            MessageBox.error("Failed to load data");
            oView.setBusy(false);
        }
    });
}
```

**Backend Flow**:
1. Checks RBP permissions
2. Calls SuccessFactors API: `GET /odata/v2/Employee_Compensation?$filter=companyId eq 'SFHUB003674' and userId eq 'sfadmin'`
3. Transforms SuccessFactors data to local format
4. Returns array of compensation records

---

### 2. Get Employee Data from SuccessFactors

**Endpoint**: `POST /compensation/CompensationService/getEmployeeDataFromSF`

**Purpose**: Extract employee information from SuccessFactors Employee Central.

**Request**:
```json
{
  "companyId": "SFHUB003674",
  "userId": "sfadmin",
  "employeeId": "EMP001"  // Optional, defaults to userId
}
```

**Response**:
```json
{
  "employeeId": "EMP001",
  "employeeName": "John Doe",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@company.com",
  "phoneNumber": "+1-555-0123",
  "jobTitle": "Software Engineer",
  "department": "IT",
  "position": "Senior Developer",
  "managerId": "MGR001",
  "startDate": "2020-01-15",
  "photo": "https://..."
}
```

**Usage**:
```javascript
onLoadEmployeeData: function () {
    $.ajax({
        url: "/compensation/CompensationService/getEmployeeDataFromSF",
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify({
            companyId: "SFHUB003674",
            userId: "sfadmin"
        }),
        success: function (data) {
            // Populate employee fields
            oModel.setProperty("/employeeId", data.employeeId);
            oModel.setProperty("/employeeName", data.employeeName);
            oModel.setProperty("/jobTitle", data.jobTitle);
            oModel.setProperty("/department", data.department);
        }
    });
}
```

---

### 3. Get Employee Data by RBP

**Endpoint**: `POST /compensation/CompensationService/getEmployeeDataByRBP`

**Purpose**: Get list of employees accessible based on user's RBP permissions.

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
    "employeeId": "EMP001",
    "employeeName": "John Doe",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@company.com",
    "jobTitle": "Software Engineer",
    "department": "IT",
    "photo": "https://..."
  }
]
```

---

## 📤 POST Operations

### 1. POST - Create New Compensation Record

**Endpoint**: `POST /compensation/CompensationService/postCompensationData`

**Purpose**: Create a new compensation record (saves to both database and SuccessFactors).

**Request**:
```json
{
  "companyId": "SFHUB003674",
  "userId": "sfadmin",
  "data": {
    "employeeId": "EMP003",
    "employeeName": "Jane Smith",
    "currentSalary": 95000,
    "meritIncrease": 3.0,
    "meritIncreaseAmount": 2850,
    "finalSalary": 97850,
    "currency": "USD",
    "effectiveDate": "2026-01-01",
    "status": "Draft"
  }
}
```

**Response**:
```json
{
  "id": "new-uuid-here",
  "employeeId": "EMP003",
  "employeeName": "Jane Smith",
  "currentSalary": 95000,
  "meritIncrease": 3.0,
  "finalSalary": 97850,
  "status": "Draft"
}
```

**Usage**:
```javascript
onAddRow: function () {
    var oModel = this.getView().getModel("compensation");
    var oNewRecord = {
        employeeId: "",
        employeeName: "",
        currentSalary: 0,
        meritIncrease: 0,
        finalSalary: 0,
        status: "Draft"
    };
    
    $.ajax({
        url: "/compensation/CompensationService/postCompensationData",
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify({
            companyId: oModel.getProperty("/companyId"),
            userId: oModel.getProperty("/userId"),
            data: oNewRecord
        }),
        success: function (result) {
            // Add to local model
            var aData = oModel.getProperty("/CompensationWorksheet") || [];
            aData.push(result);
            oModel.setProperty("/CompensationWorksheet", aData);
            oModel.setProperty("/totalEmployees", aData.length);
            MessageToast.show("Employee added");
        }
    });
}
```

**Backend Flow**:
1. Validates data
2. Saves to local database (CAP CDS)
3. Saves to SuccessFactors MDF Object
4. Syncs to SuccessFactors Employee Compensation API
5. Logs audit trail
6. Returns created record

---

### 2. POST - Update Compensation Data

**Endpoint**: `POST /compensation/CompensationService/updateCompensationData`

**Purpose**: Update existing compensation records (saves to both database and SuccessFactors).

**Request**:
```json
{
  "companyId": "SFHUB003674",
  "userId": "sfadmin",
  "data": [
    {
      "id": "uuid-123",
      "employeeId": "EMP001",
      "meritIncrease": 3.5,
      "meritIncreaseAmount": 3500,
      "finalSalary": 103500
    },
    {
      "id": "uuid-456",
      "employeeId": "EMP002",
      "meritIncrease": 4.0,
      "finalSalary": 104000
    }
  ]
}
```

**Response**:
```json
{
  "success": true,
  "updated": 2,
  "results": [...]
}
```

**Usage**:
```javascript
onSave: function () {
    var oView = this.getView();
    var oModel = oView.getModel("compensation");
    var aData = oModel.getProperty("/CompensationWorksheet");
    
    if (!aData || aData.length === 0) {
        MessageBox.warning("No data to save");
        return;
    }
    
    oView.setBusy(true);
    
    $.ajax({
        url: "/compensation/CompensationService/updateCompensationData",
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify({
            companyId: oModel.getProperty("/companyId"),
            userId: oModel.getProperty("/userId"),
            data: aData
        }),
        success: function (result) {
            MessageToast.show("Saved " + result.updated + " records successfully");
            oView.setBusy(false);
        },
        error: function (error) {
            MessageBox.error("Failed to save: " + (error.responseJSON?.error?.message || error.statusText));
            oView.setBusy(false);
        }
    });
}
```

**Backend Flow**:
1. Validates all records
2. Updates local database
3. Updates SuccessFactors MDF Object
4. Syncs to SuccessFactors Employee Compensation API (PATCH)
5. Logs audit trail for each change
6. Returns success status

---

### 3. UPSERT - Insert or Update

**Endpoint**: `POST /compensation/CompensationService/upsertCompensationData`

**Purpose**: Smart save - creates if new, updates if exists.

**Request**:
```json
{
  "companyId": "SFHUB003674",
  "userId": "sfadmin",
  "data": {
    "employeeId": "EMP001",
    "formId": "FORM_2026_Q1",
    "meritIncrease": 3.5,
    "finalSalary": 103500
  }
}
```

**Response**:
```json
{
  "id": "uuid-123",
  "employeeId": "EMP001",
  "meritIncrease": 3.5,
  "finalSalary": 103500,
  "action": "UPDATED"  // or "CREATED"
}
```

**Usage**:
```javascript
onUpsertRow: function (oEvent) {
    var oRow = oEvent.getSource().getBindingContext("compensation").getObject();
    
    $.ajax({
        url: "/compensation/CompensationService/upsertCompensationData",
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify({
            companyId: oModel.getProperty("/companyId"),
            userId: oModel.getProperty("/userId"),
            data: oRow
        }),
        success: function (result) {
            MessageToast.show("Record " + result.action.toLowerCase());
        }
    });
}
```

---

## 🔄 Complete Data Flow

### GET Flow:
```
User clicks Refresh
    ↓
Frontend calls GET API
    ↓
Backend checks RBP permissions
    ↓
Backend calls SuccessFactors API
    ↓
SuccessFactors returns data
    ↓
Backend transforms data
    ↓
Backend returns to Frontend
    ↓
Frontend displays in table (scrollable)
```

### POST Flow:
```
User edits data in table
    ↓
User clicks Save
    ↓
Frontend calls POST API
    ↓
Backend validates data
    ↓
Backend saves to Database
    ↓
Backend saves to SuccessFactors MDF Object
    ↓
Backend syncs to SuccessFactors API
    ↓
Backend logs audit trail
    ↓
Backend returns success
    ↓
Frontend shows success message
```

---

## 📊 Table Scrolling

The compensation table is now fully scrollable:

- **Visible Rows**: 20 rows at a time
- **Total Height**: 600px (adjustable)
- **Scroll**: Vertical and horizontal scrolling enabled
- **Fixed Columns**: First column (Employee) is fixed for easy reference
- **Fixed Header**: Table header stays visible while scrolling

**CSS Configuration**:
```css
#compensation---CompensationWorksheet--compensationTable {
    height: 600px !important;
    max-height: 800px !important;
}

.sapUiTableCtrl {
    overflow-y: auto !important;
    overflow-x: auto !important;
}
```

**To see all employees**:
1. Scroll down in the table to see more rows
2. Use mouse wheel or scrollbar
3. Table automatically loads more data as you scroll (if pagination is enabled)

---

## 🧪 Testing APIs

### Test GET API (using cURL):
```bash
curl -X POST \
  https://your-btp-app.cfapps.us10-001.hana.ondemand.com/compensation/CompensationService/getCompensationData \
  -H "Content-Type: application/json" \
  -d '{
    "companyId": "SFHUB003674",
    "userId": "sfadmin"
  }'
```

### Test POST API (using cURL):
```bash
curl -X POST \
  https://your-btp-app.cfapps.us10-001.hana.ondemand.com/compensation/CompensationService/postCompensationData \
  -H "Content-Type: application/json" \
  -d '{
    "companyId": "SFHUB003674",
    "userId": "sfadmin",
    "data": {
      "employeeId": "EMP001",
      "currentSalary": 100000,
      "meritIncrease": 3.0,
      "finalSalary": 103000
    }
  }'
```

### Test in Browser Console:
```javascript
// GET
$.ajax({
    url: "/compensation/CompensationService/getCompensationData",
    method: "POST",
    contentType: "application/json",
    data: JSON.stringify({
        companyId: "SFHUB003674",
        userId: "sfadmin"
    }),
    success: function(data) {
        console.log("Data:", data);
    }
});

// POST
$.ajax({
    url: "/compensation/CompensationService/postCompensationData",
    method: "POST",
    contentType: "application/json",
    data: JSON.stringify({
        companyId: "SFHUB003674",
        userId: "sfadmin",
        data: {
            employeeId: "EMP001",
            currentSalary: 100000
        }
    }),
    success: function(result) {
        console.log("Created:", result);
    }
});
```

---

## 📝 Summary

### GET Operations:
- ✅ `getCompensationData` - Get all compensation records
- ✅ `getEmployeeDataFromSF` - Extract employee data from SuccessFactors
- ✅ `getEmployeeDataByRBP` - Get employees based on RBP permissions

### POST Operations:
- ✅ `postCompensationData` - Create new record
- ✅ `updateCompensationData` - Update existing records
- ✅ `upsertCompensationData` - Smart insert/update

### Data Storage:
- ✅ **Local Database** (CAP CDS) - Primary storage
- ✅ **SuccessFactors MDF Object** - Custom object storage
- ✅ **SuccessFactors API** - Employee Compensation API sync
- ✅ **Audit Trail** - All changes logged for compliance

### Table Features:
- ✅ Scrollable table (20 visible rows, scroll for more)
- ✅ Fixed first column (Employee)
- ✅ Fixed header row
- ✅ Horizontal and vertical scrolling
- ✅ Responsive design

**All APIs are ready to use!** 🚀
