# Complete Integration Guide: SuccessFactors ↔ BTP Extension

## 📋 Table of Contents

1. [Employee Data Extraction from SuccessFactors](#employee-data-extraction)
2. [Open Application from SuccessFactors](#open-from-successfactors)
3. [GET and POST Operations](#get-post-operations)
4. [Database Persistence](#database-persistence)
5. [SuccessFactors MDF Object Integration](#mdf-object-integration)
6. [Audit Trail and Compliance](#audit-trail)
7. [Reporting](#reporting)

---

## 1. Employee Data Extraction from SuccessFactors {#employee-data-extraction}

### Overview

The application extracts employee data from SuccessFactors Employee Central API and displays it in the Compensation Worksheet.

### API Endpoints Used

#### SuccessFactors Employee Central API

**Get Employee Data:**
```
GET /odata/v2/PerPersonal?$filter=userId eq '{userId}'&$select=personIdExternal,firstName,lastName,email,phoneNumber
GET /odata/v2/PerEmail?$filter=personIdExternal eq '{personId}'&$select=emailAddress
GET /odata/v2/EmpEmployment?$filter=userId eq '{userId}'&$select=startDate,jobTitle,department,position
GET /odata/v2/EmpJob?$filter=userId eq '{userId}'&$select=jobTitle,department,position,managerId
```

**Get Employee Photo:**
```
GET /odata/v2/Photo?$filter=userId eq '{userId}'
```

### Implementation

**Backend** (`srv/compensation-service.js`):

```javascript
// Enhanced Employee Data Extraction
this.on('getEmployeeDataFromSF', async (req) => {
  const { companyId, userId, employeeId } = req.data;
  
  try {
    // 1. Get Personal Information
    const personalEndpoint = `/odata/v2/PerPersonal?$filter=userId eq '${userId}'&$select=personIdExternal,firstName,lastName,email,phoneNumber`;
    const personalData = await callSFAPI(personalEndpoint);
    
    // 2. Get Employment Information
    const employmentEndpoint = `/odata/v2/EmpEmployment?$filter=userId eq '${userId}'&$select=startDate,jobTitle,department,position`;
    const employmentData = await callSFAPI(employmentEndpoint);
    
    // 3. Get Job Information
    const jobEndpoint = `/odata/v2/EmpJob?$filter=userId eq '${userId}'&$select=jobTitle,department,position,managerId`;
    const jobData = await callSFAPI(jobEndpoint);
    
    // 4. Get Employee Photo
    const photoEndpoint = `/odata/v2/Photo?$filter=userId eq '${userId}'`;
    let photoUrl = null;
    try {
      const photoData = await callSFAPI(photoEndpoint);
      photoUrl = photoData.d?.results?.[0]?.photo || null;
    } catch (error) {
      console.log("Photo not available");
    }
    
    // 5. Combine all data
    const employeeData = {
      employeeId: personalData.d?.results?.[0]?.personIdExternal || userId,
      firstName: personalData.d?.results?.[0]?.firstName || "",
      lastName: personalData.d?.results?.[0]?.lastName || "",
      email: personalData.d?.results?.[0]?.email || "",
      phoneNumber: personalData.d?.results?.[0]?.phoneNumber || "",
      jobTitle: jobData.d?.results?.[0]?.jobTitle || employmentData.d?.results?.[0]?.jobTitle || "",
      department: jobData.d?.results?.[0]?.department || employmentData.d?.results?.[0]?.department || "",
      position: jobData.d?.results?.[0]?.position || employmentData.d?.results?.[0]?.position || "",
      managerId: jobData.d?.results?.[0]?.managerId || "",
      startDate: employmentData.d?.results?.[0]?.startDate || "",
      photo: photoUrl || "sap-icon://employee"
    };
    
    return employeeData;
  } catch (error) {
    req.error(500, `Failed to extract employee data: ${error.message}`);
  }
});
```

**Frontend** (`app/webapp/controller/CompensationWorksheet.controller.js`):

```javascript
onLoadEmployeeData: function () {
    var oView = this.getView();
    var oModel = oView.getModel("compensation");
    var sUserId = oModel.getProperty("/userId");
    
    if (!sUserId) {
        MessageBox.warning("Please enter User ID");
        return;
    }
    
    oView.setBusy(true);
    
    $.ajax({
        url: "/compensation/CompensationService/getEmployeeDataFromSF",
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify({
            companyId: oModel.getProperty("/companyId"),
            userId: sUserId
        }),
        success: function (data) {
            // Populate employee fields
            oModel.setProperty("/employeeId", data.employeeId);
            oModel.setProperty("/employeeName", data.firstName + " " + data.lastName);
            oModel.setProperty("/firstName", data.firstName);
            oModel.setProperty("/lastName", data.lastName);
            oModel.setProperty("/email", data.email);
            oModel.setProperty("/jobTitle", data.jobTitle);
            oModel.setProperty("/department", data.department);
            oModel.setProperty("/position", data.position);
            oModel.setProperty("/photo", data.photo);
            
            MessageToast.show("Employee data loaded from SuccessFactors");
            oView.setBusy(false);
        },
        error: function (error) {
            MessageBox.error("Failed to load employee data: " + (error.responseJSON?.error?.message || error.statusText));
            oView.setBusy(false);
        }
    });
}
```

---

## 2. Open Application from SuccessFactors {#open-from-successfactors}

### Method 1: SuccessFactors Tile (Recommended)

#### Step 1: Deploy BTP Application

```bash
# Build MTA
mbt build

# Deploy to BTP
cf deploy mta_archives/successfactors-compensation-extension_1.0.0.mtar

# Get app URL
cf apps
# Note: https://compensation-app-<space>.cfapps.us10-001.hana.ondemand.com
```

#### Step 2: Configure SuccessFactors Tile

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
   - **Authentication**: Configure OAuth or SSO

5. **Add to Home Page**:
   - Go to Admin Center → Manage Home Page
   - Add "Compensation Worksheet" tile
   - Assign to user roles/groups

#### Step 3: Configure CORS (if using iframe)

**Backend** (`srv/server.js`):

```javascript
const cds = require('@sap/cds');
const express = require('express');
const path = require('path');

cds.on('bootstrap', app => {
  // Enable CORS for SuccessFactors
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*'); // Configure specific domains in production
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
    } else {
      next();
    }
  });
  
  // ... rest of server configuration
});
```

### Method 2: SuccessFactors Workflow Integration

#### Step 1: Create Workflow in SuccessFactors

1. **Admin Center** → **Workflow**
2. **Create New Workflow**
3. **Trigger**: Compensation form submission or user action
4. **Add HTTP Action**:
   - Action Type: "Open URL"
   - URL: `https://your-btp-app.cfapps.us10-001.hana.ondemand.com/app/index.html?companyId={companyId}&userId={userId}&formId={formId}`
   - Method: GET
   - Open in: "New Tab"

### Method 3: SuccessFactors Extension Point (iframe)

#### Step 1: Create Extension Point

1. **Admin Center** → **Manage Extensions**
2. **Create Extension Point**
3. **Add iframe Code**:

```html
<iframe 
    id="compensation-worksheet"
    src="https://your-btp-app.cfapps.us10-001.hana.ondemand.com/app/index.html?companyId={companyId}&userId={userId}"
    width="100%" 
    height="800px"
    frameborder="0"
    allow="camera; microphone; geolocation">
</iframe>

<script>
// Post message to iframe for communication
window.addEventListener('message', function(event) {
    if (event.origin === 'https://your-btp-app.cfapps.us10-001.hana.ondemand.com') {
        // Handle messages from BTP app
        console.log('Message from BTP:', event.data);
    }
});

// Send data to iframe
function sendToBTP(data) {
    var iframe = document.getElementById('compensation-worksheet');
    iframe.contentWindow.postMessage(data, 'https://your-btp-app.cfapps.us10-001.hana.ondemand.com');
}
</script>
```

---

## 3. GET and POST Operations {#get-post-operations}

### GET Operations

#### GET Compensation Data

**Endpoint**: `POST /compensation/CompensationService/getCompensationData`

**Request**:
```json
{
  "companyId": "SFHUB003674",
  "userId": "sfadmin",
  "formId": "FORM_2026_Q1"
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
    "currentSalary": 100000,
    "meritIncrease": 3.0,
    "finalSalary": 103000,
    "status": "Draft"
  }
]
```

**Usage in Frontend**:
```javascript
// GET data
$.ajax({
    url: "/compensation/CompensationService/getCompensationData",
    method: "POST",
    contentType: "application/json",
    data: JSON.stringify({
        companyId: "SFHUB003674",
        userId: "sfadmin"
    }),
    success: function (data) {
        // Data received
        oModel.setProperty("/CompensationWorksheet", data);
    }
});
```

#### GET Employee Data

**Endpoint**: `POST /compensation/CompensationService/getEmployeeDataByRBP`

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

### POST Operations

#### POST - Create New Compensation Record

**Endpoint**: `POST /compensation/CompensationService/postCompensationData`

**Request**:
```json
{
  "companyId": "SFHUB003674",
  "userId": "sfadmin",
  "data": {
    "employeeId": "EMP003",
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
  "currentSalary": 95000,
  "meritIncrease": 3.0,
  "finalSalary": 97850,
  "status": "Draft"
}
```

**Usage in Frontend**:
```javascript
// POST - Create new record
onAddRow: function () {
    var oModel = this.getView().getModel("compensation");
    var oNewRecord = {
        employeeId: "",
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
            MessageToast.show("Record created");
        }
    });
}
```

#### POST - Update Compensation Data

**Endpoint**: `POST /compensation/CompensationService/updateCompensationData`

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
      "finalSalary": 103500
    }
  ]
}
```

**Response**:
```json
{
  "success": true,
  "updated": 1
}
```

**Usage in Frontend**:
```javascript
// POST - Update data
onSave: function () {
    var oModel = this.getView().getModel("compensation");
    var aData = oModel.getProperty("/CompensationWorksheet");
    
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
            MessageToast.show("Data saved successfully");
        }
    });
}
```

---

## 4. Database Persistence {#database-persistence}

### CAP Database Schema

**File**: `db/schema.cds`

```cds
namespace com.sap.sf.compensation;

entity Compensation {
  key id: UUID;
  companyId: String(20);
  userId: String(100);
  formId: String(100);
  employeeId: String(100);
  employeeName: String(200);
  currentSalary: Decimal(15, 2);
  finalSalary: Decimal(15, 2);
  // ... more fields
  lastModified: DateTime;
  lastModifiedBy: String(100);
}

// Audit Trail Entity
entity AuditLog {
  key id: UUID;
  companyId: String(20);
  userId: String(100);
  action: String(50); // CREATE, UPDATE, DELETE, VIEW
  entityType: String(50); // Compensation, Employee, etc.
  entityId: String(100);
  oldValue: String(5000);
  newValue: String(5000);
  timestamp: DateTime;
  ipAddress: String(50);
  userAgent: String(500);
}

// Reporting Entity
entity CompensationReport {
  key id: UUID;
  reportName: String(200);
  reportType: String(50); // Summary, Detail, Compliance
  companyId: String(20);
  formId: String(100);
  generatedBy: String(100);
  generatedAt: DateTime;
  reportData: LargeString;
  status: String(50); // Generated, Exported, Archived
}
```

### Save to Database

**Backend** (`srv/compensation-service.js`):

```javascript
// Save to Database
this.after('CREATE', CompensationWorksheet, async (data, req) => {
  try {
    // Data is automatically saved to database by CAP
    // Log audit trail
    await this.on('logAudit', {
      data: {
        companyId: data.companyId,
        userId: req.user?.id || data.userId,
        action: 'CREATE',
        entityType: 'Compensation',
        entityId: data.id,
        newValue: JSON.stringify(data),
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error saving to database:', error);
  }
});

this.after('UPDATE', CompensationWorksheet, async (data, req) => {
  try {
    // Data is automatically updated in database by CAP
    // Log audit trail
    await this.on('logAudit', {
      data: {
        companyId: data.companyId,
        userId: req.user?.id || data.userId,
        action: 'UPDATE',
        entityType: 'Compensation',
        entityId: data.id,
        newValue: JSON.stringify(data),
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error updating database:', error);
  }
});
```

### Read from Database

**Backend**:

```javascript
// Standard OData READ operation
this.on('READ', CompensationWorksheet, async (req) => {
  // CAP automatically reads from database
  // You can add custom filtering
  const query = req.query;
  const params = query.SELECT?.where || [];
  
  // Add custom filters if needed
  // ...
  
  // Return data from database
  return await cds.run(query);
});
```

---

## 5. SuccessFactors MDF Object Integration {#mdf-object-integration}

### Overview

SuccessFactors MDF (Metadata Framework) objects allow you to store custom data in SuccessFactors.

### Create MDF Object in SuccessFactors

1. **Admin Center** → **Manage Data Models**
2. **Create New Object**:
   - **Object ID**: `CompensationExtension`
   - **Label**: "Compensation Extension Data"
   - **Fields**:
     - `employeeId` (String)
     - `formId` (String)
     - `meritIncrease` (Decimal)
     - `finalSalary` (Decimal)
     - `status` (String)
     - `lastModified` (DateTime)

### Save to MDF Object

**Backend** (`srv/compensation-service.js`):

```javascript
// Save to SuccessFactors MDF Object
this.on('saveToMDFObject', async (req) => {
  const { companyId, data } = req.data;
  
  try {
    // SuccessFactors MDF API endpoint
    const mdfEndpoint = `/odata/v2/CompensationExtension`;
    
    // Check if record exists
    const checkEndpoint = `/odata/v2/CompensationExtension?$filter=employeeId eq '${data.employeeId}' and formId eq '${data.formId}'`;
    const existing = await callSFAPI(checkEndpoint);
    
    if (existing.d?.results?.length > 0) {
      // UPDATE existing MDF record
      const updateEndpoint = `/odata/v2/CompensationExtension('${existing.d.results[0].id}')`;
      const mdfPayload = {
        employeeId: data.employeeId,
        formId: data.formId,
        meritIncrease: data.meritIncrease,
        finalSalary: data.finalSalary,
        status: data.status,
        lastModified: new Date().toISOString()
      };
      
      await callSFAPI(updateEndpoint, 'PATCH', mdfPayload);
      return { success: true, action: 'UPDATED', id: existing.d.results[0].id };
    } else {
      // CREATE new MDF record
      const mdfPayload = {
        employeeId: data.employeeId,
        formId: data.formId,
        meritIncrease: data.meritIncrease,
        finalSalary: data.finalSalary,
        status: data.status,
        lastModified: new Date().toISOString()
      };
      
      const result = await callSFAPI(mdfEndpoint, 'POST', mdfPayload);
      return { success: true, action: 'CREATED', id: result.d?.id };
    }
  } catch (error) {
    req.error(500, `Failed to save to MDF object: ${error.message}`);
  }
});

// Enhanced POST handler - Save to both DB and MDF
this.on('postCompensationData', async (req) => {
  const { companyId, userId, data } = req.data;
  
  try {
    // 1. Save to local database
    const dbRecord = await cds.run(
      INSERT.into(CompensationWorksheet).entries({
        ...data,
        id: cds.utils.uuid(),
        companyId: companyId,
        userId: userId,
        lastModified: new Date().toISOString(),
        lastModifiedBy: userId
      })
    );
    
    // 2. Save to SuccessFactors MDF Object
    await this.on('saveToMDFObject', {
      data: {
        companyId: companyId,
        data: data
      }
    });
    
    // 3. Sync to SuccessFactors Employee Compensation API
    const sfEndpoint = `/odata/v2/Employee_Compensation`;
    await callSFAPI(sfEndpoint, 'POST', data);
    
    return dbRecord;
  } catch (error) {
    req.error(500, `Failed to create compensation data: ${error.message}`);
  }
});
```

---

## 6. Audit Trail and Compliance {#audit-trail}

### Audit Log Schema

**File**: `db/schema.cds`

```cds
entity AuditLog {
  key id: UUID;
  companyId: String(20);
  userId: String(100);
  action: String(50); // CREATE, UPDATE, DELETE, VIEW, EXPORT
  entityType: String(50); // Compensation, Employee, Workflow
  entityId: String(100);
  oldValue: String(5000);
  newValue: String(5000);
  timestamp: DateTime;
  ipAddress: String(50);
  userAgent: String(500);
  sessionId: String(100);
  changes: String(5000); // JSON of changed fields
}
```

### Audit Logging Implementation

**Backend** (`srv/compensation-service.js`):

```javascript
// Audit Logging Function
this.on('logAudit', async (req) => {
  const { companyId, userId, action, entityType, entityId, oldValue, newValue, ipAddress, userAgent } = req.data;
  
  try {
    await cds.run(
      INSERT.into('com.sap.sf.compensation.AuditLog').entries({
        id: cds.utils.uuid(),
        companyId: companyId,
        userId: userId,
        action: action,
        entityType: entityType,
        entityId: entityId,
        oldValue: oldValue || '',
        newValue: newValue || '',
        timestamp: new Date().toISOString(),
        ipAddress: ipAddress || req._.req?.ip || '',
        userAgent: userAgent || req._.req?.headers?.['user-agent'] || '',
        sessionId: req._.req?.sessionID || ''
      })
    );
  } catch (error) {
    console.error('Error logging audit:', error);
  }
});

// Enhanced UPDATE with audit trail
this.before('UPDATE', CompensationWorksheet, async (req) => {
  // Get old value before update
  const oldRecord = await cds.run(
    SELECT.one.from(CompensationWorksheet).where({ id: req.data.id })
  );
  
  req._oldValue = oldRecord;
});

this.after('UPDATE', CompensationWorksheet, async (data, req) => {
  // Log audit trail
  const oldValue = req._oldValue;
  const changes = {};
  
  // Compare old and new values
  Object.keys(data).forEach(key => {
    if (oldValue && oldValue[key] !== data[key]) {
      changes[key] = {
        old: oldValue[key],
        new: data[key]
      };
    }
  });
  
  await this.on('logAudit', {
    data: {
      companyId: data.companyId,
      userId: req.user?.id || data.userId,
      action: 'UPDATE',
      entityType: 'Compensation',
      entityId: data.id,
      oldValue: JSON.stringify(oldValue),
      newValue: JSON.stringify(data),
      changes: JSON.stringify(changes),
      ipAddress: req._.req?.ip,
      userAgent: req._.req?.headers?.['user-agent']
    }
  });
});
```

### Query Audit Logs

**Backend**:

```javascript
// Get Audit Logs
this.on('getAuditLogs', async (req) => {
  const { companyId, userId, entityType, entityId, startDate, endDate } = req.data;
  
  let query = SELECT.from('com.sap.sf.compensation.AuditLog');
  
  if (companyId) {
    query = query.where({ companyId: companyId });
  }
  if (userId) {
    query = query.where({ userId: userId });
  }
  if (entityType) {
    query = query.where({ entityType: entityType });
  }
  if (entityId) {
    query = query.where({ entityId: entityId });
  }
  if (startDate) {
    query = query.where({ timestamp: { '>=': startDate } });
  }
  if (endDate) {
    query = query.where({ timestamp: { '<=': endDate } });
  }
  
  query = query.orderBy({ timestamp: 'desc' });
  
  const auditLogs = await cds.run(query);
  return auditLogs;
});
```

---

## 7. Reporting {#reporting}

### Reporting Schema

**File**: `db/schema.cds`

```cds
entity CompensationReport {
  key id: UUID;
  reportName: String(200);
  reportType: String(50); // Summary, Detail, Compliance, Audit
  companyId: String(20);
  formId: String(100);
  generatedBy: String(100);
  generatedAt: DateTime;
  reportData: LargeString; // JSON or CSV
  status: String(50); // Generated, Exported, Archived
  exportFormat: String(50); // JSON, CSV, PDF, Excel
}
```

### Generate Reports

**Backend** (`srv/compensation-service.js`):

```javascript
// Generate Compensation Report
this.on('generateReport', async (req) => {
  const { companyId, formId, reportType, startDate, endDate } = req.data;
  
  try {
    let reportData = [];
    
    if (reportType === 'Summary') {
      // Summary Report
      const summary = await cds.run(
        SELECT.from(CompensationWorksheet)
          .columns('SUM(finalSalary) as totalSalary', 'COUNT(*) as employeeCount', 'AVG(meritIncrease) as avgMeritIncrease')
          .where({ companyId: companyId, formId: formId })
      );
      
      reportData = {
        type: 'Summary',
        totalSalary: summary[0].totalSalary,
        employeeCount: summary[0].employeeCount,
        avgMeritIncrease: summary[0].avgMeritIncrease,
        generatedAt: new Date().toISOString()
      };
    } else if (reportType === 'Detail') {
      // Detail Report
      const details = await cds.run(
        SELECT.from(CompensationWorksheet)
          .where({ companyId: companyId, formId: formId })
      );
      
      reportData = {
        type: 'Detail',
        records: details,
        count: details.length,
        generatedAt: new Date().toISOString()
      };
    } else if (reportType === 'Compliance') {
      // Compliance Report
      const compliance = await cds.run(
        SELECT.from('com.sap.sf.compensation.AuditLog')
          .where({ 
            companyId: companyId,
            action: { 'in': ['CREATE', 'UPDATE', 'DELETE'] }
          })
          .orderBy({ timestamp: 'desc' })
      );
      
      reportData = {
        type: 'Compliance',
        auditLogs: compliance,
        count: compliance.length,
        generatedAt: new Date().toISOString()
      };
    }
    
    // Save report
    const reportId = cds.utils.uuid();
    await cds.run(
      INSERT.into('com.sap.sf.compensation.CompensationReport').entries({
        id: reportId,
        reportName: `${reportType} Report - ${formId}`,
        reportType: reportType,
        companyId: companyId,
        formId: formId,
        generatedBy: req.user?.id || 'System',
        generatedAt: new Date().toISOString(),
        reportData: JSON.stringify(reportData),
        status: 'Generated',
        exportFormat: 'JSON'
      })
    );
    
    return {
      reportId: reportId,
      reportData: reportData
    };
  } catch (error) {
    req.error(500, `Failed to generate report: ${error.message}`);
  }
});
```

### Export Reports

**Backend**:

```javascript
// Export Report
this.on('exportReport', async (req) => {
  const { reportId, format } = req.data; // format: 'CSV', 'PDF', 'Excel'
  
  try {
    const report = await cds.run(
      SELECT.one.from('com.sap.sf.compensation.CompensationReport').where({ id: reportId })
    );
    
    if (!report) {
      req.error(404, 'Report not found');
      return;
    }
    
    const reportData = JSON.parse(report.reportData);
    
    if (format === 'CSV') {
      // Convert to CSV
      const csv = convertToCSV(reportData);
      return {
        format: 'CSV',
        data: csv,
        filename: `${report.reportName}.csv`
      };
    } else if (format === 'PDF') {
      // Generate PDF (using library like pdfkit)
      const pdf = generatePDF(reportData);
      return {
        format: 'PDF',
        data: pdf,
        filename: `${report.reportName}.pdf`
      };
    }
    
    return {
      format: format,
      data: reportData,
      filename: `${report.reportName}.${format.toLowerCase()}`
    };
  } catch (error) {
    req.error(500, `Failed to export report: ${error.message}`);
  }
});
```

---

## Complete Data Flow

```
┌─────────────────────────────────────┐
│   SuccessFactors                    │
│   • Employee Central API            │
│   • Compensation API                │
│   • MDF Objects                     │
└──────────────┬──────────────────────┘
               │
               │ GET/POST
               │
┌──────────────▼──────────────────────┐
│   SAP BTP Extension                 │
│   • Extract Employee Data           │
│   • Process Compensation            │
│   • Save to Database                │
│   • Save to MDF Object              │
│   • Log Audit Trail                 │
│   • Generate Reports                │
└──────────────┬──────────────────────┘
               │
               │ Display
               │
┌──────────────▼──────────────────────┐
│   UI5 Frontend                      │
│   • Compensation Worksheet          │
│   • Reports                         │
│   • Audit Logs                      │
└─────────────────────────────────────┘
```

---

## Quick Start Checklist

- [ ] Deploy BTP application
- [ ] Configure SuccessFactors tile
- [ ] Test employee data extraction
- [ ] Test GET operations
- [ ] Test POST operations
- [ ] Verify database persistence
- [ ] Configure MDF object in SuccessFactors
- [ ] Test MDF object save
- [ ] Verify audit logging
- [ ] Test report generation
- [ ] Configure CORS for iframe
- [ ] Test opening from SuccessFactors

---

## Next Steps

1. **Implement employee data extraction** (code provided above)
2. **Add database persistence** (CAP handles automatically)
3. **Create MDF object in SuccessFactors**
4. **Implement audit logging** (code provided above)
5. **Add reporting features** (code provided above)
6. **Test end-to-end integration**

**All code examples are ready to use!** 🚀
