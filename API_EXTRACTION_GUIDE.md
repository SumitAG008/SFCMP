# How to Extract API Data and Insert into Compensation Worksheet

## Complete Guide: SuccessFactors API → Compensation Worksheet

This guide explains how data flows from SuccessFactors API to your Compensation Worksheet UI.

---

## 📊 Data Flow Overview

```
┌─────────────────────────────────────┐
│   SuccessFactors                    │
│   Employee Compensation API v1      │
│   /odata/v2/Employee_Compensation  │
└──────────────┬──────────────────────┘
               │
               │ 1. API Call (GET)
               │    OAuth/Basic Auth
               │
┌──────────────▼──────────────────────┐
│   SAP BTP Extension                 │
│   compensation-service.js            │
│                                     │
│   • Authenticates with SF           │
│   • Calls SF API                    │
│   • Transforms data format          │
│   • Returns to UI                   │
└──────────────┬──────────────────────┘
               │
               │ 2. REST API Response
               │    JSON Data
               │
┌──────────────▼──────────────────────┐
│   UI5 Frontend                      │
│   Compensation Worksheet            │
│                                     │
│   • Receives data                   │
│   • Displays in table               │
│   • User can edit                   │
│   • Saves back to SF                │
└─────────────────────────────────────┘
```

---

## 🔧 Step-by-Step: How It Works

### Step 1: User Triggers Data Load

**In the UI** (`CompensationWorksheet.controller.js`):

```javascript
onRefresh: function () {
    var oView = this.getView();
    var oModel = oView.getModel("compensation");
    var sCompanyId = oModel.getProperty("/companyId");  // e.g., "SFHUB003674"
    var sUserId = oModel.getProperty("/userId");        // e.g., "sfadmin"

    if (!sCompanyId || !sUserId) {
        MessageBox.warning("Please enter Company ID and User ID");
        return;
    }

    oView.setBusy(true);

    // Step 1a: Check RBP Permissions
    var sRBPUrl = "/compensation/CompensationService/checkUserRBP";
    $.ajax({
        url: sRBPUrl,
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify({
            companyId: sCompanyId,
            userId: sUserId,
            permission: "COMPENSATION_VIEW"
        }),
        success: function (rbpResult) {
            if (!rbpResult.hasPermission) {
                MessageBox.error("Access Denied");
                return;
            }

            // Step 1b: Get Compensation Data
            var sServiceUrl = "/compensation/CompensationService/getCompensationData";
            $.ajax({
                url: sServiceUrl,
                method: "POST",
                contentType: "application/json",
                data: JSON.stringify({
                    companyId: sCompanyId,
                    userId: sUserId
                }),
                success: function (data) {
                    // ✅ Data received from SuccessFactors!
                    oModel.setProperty("/CompensationWorksheet", data || []);
                    MessageToast.show("Data loaded successfully");
                    oView.setBusy(false);
                },
                error: function (error) {
                    MessageBox.error("Failed to load data");
                    oView.setBusy(false);
                }
            });
        }
    });
}
```

---

### Step 2: Backend Extracts Data from SuccessFactors

**In the Backend** (`srv/compensation-service.js`):

```javascript
// GET Compensation Data from SuccessFactors Employee Compensation API v1
this.on('getCompensationData', async (req) => {
    const { companyId, userId, formId } = req.data;
    
    try {
        // 2a. Check RBP permissions first
        const rbpCheck = await rbpService.checkUserRBP(userId, companyId, 'COMPENSATION_VIEW');
        if (!rbpCheck.hasPermission) {
            req.error(403, `User ${userId} does not have permission`);
            return;
        }
        
        // 2b. Build SuccessFactors API endpoint
        let endpoint = `/odata/v2/Employee_Compensation`;
        
        // Build filter query
        const filters = [];
        if (companyId) filters.push(`companyId eq '${companyId}'`);
        if (userId) filters.push(`userId eq '${userId}'`);
        if (formId) filters.push(`formId eq '${formId}'`);
        
        if (filters.length > 0) {
            endpoint += `?$filter=${filters.join(' and ')}`;
        }
        
        // Example endpoint:
        // /odata/v2/Employee_Compensation?$filter=companyId eq 'SFHUB003674' and userId eq 'sfadmin'
        
        // 2c. Call SuccessFactors API
        const sfData = await callSFAPI(endpoint);
        
        // 2d. Transform SuccessFactors data to our format
        const compensationData = sfData.d?.results?.map(item => ({
            id: item.id || cds.utils.uuid(),
            companyId: item.companyId || companyId,
            userId: item.userId || userId,
            formId: item.formId || formId,
            employeeId: item.employeeId || item.empId,
            employeeName: item.employeeName || item.empName || `${item.firstName || ''} ${item.lastName || ''}`.trim(),
            position: item.jobTitle || item.position,
            department: item.department || item.departmentName,
            currentSalary: item.currentSalary || item.baseSalary || item.salary,
            proposedSalary: item.proposedSalary || item.newSalary,
            meritIncrease: item.meritIncrease || item.meritPercent || item.meritIncreasePercent,
            meritIncreaseAmount: item.meritIncreaseAmount || item.meritDollar,
            promotionIncrease: item.promotionIncrease || item.promotionPercent || 0,
            promotionIncreaseAmount: item.promotionIncreaseAmount || item.promotionDollar || 0,
            adjustmentIncrease: item.adjustmentIncrease || item.adjustmentPercent || 0,
            adjustmentIncreaseAmount: item.adjustmentIncreaseAmount || item.adjustmentDollar || 0,
            lumpSum: item.lumpSum || item.lumpSumAmount || 0,
            totalIncrease: item.totalIncrease || item.totalIncreasePercent,
            totalIncreaseAmount: item.totalIncreaseAmount || item.totalRaise,
            newSalary: item.newSalary || item.finalSalary || item.proposedSalary,
            finalSalaryRate: item.finalSalaryRate || item.newSalaryRate,
            totalPay: item.totalPay || item.totalPayIncludingLumpSum,
            currency: item.currency || item.currencyCode || 'USD',
            effectiveDate: item.effectiveDate || item.effectiveDate,
            status: item.status || item.compensationStatus || 'Draft',
            comments: item.comments || item.notes,
            performanceRating: item.performanceRating || item.overallPerformanceRating,
            payGrade: item.payGrade,
            salaryRangeMin: item.salaryRangeMin,
            salaryRangeMax: item.salaryRangeMax,
            compaRatio: item.compaRatio,
            rangePenetration: item.rangePenetration,
            lastModified: item.lastModified || item.lastModifiedDate || new Date().toISOString(),
            lastModifiedBy: item.lastModifiedBy || userId
        })) || [];
        
        // 2e. Return transformed data to UI
        return compensationData;
    } catch (error) {
        req.error(500, `Failed to fetch compensation data: ${error.message}`);
    }
});
```

---

### Step 3: API Authentication

**How Authentication Works** (`srv/compensation-service.js`):

```javascript
// Helper function to get authentication header
async function getAuthHeader() {
    try {
        // Try OAuth first if client credentials are available
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
        
        throw new Error('No authentication credentials provided');
    } catch (error) {
        console.error('Error getting authentication:', error.message);
        throw new Error('Failed to authenticate with SuccessFactors');
    }
}

// Helper function to make SuccessFactors API calls
async function callSFAPI(endpoint, method = 'GET', data = null) {
    try {
        const authHeader = await getAuthHeader();
        const url = `${sfCredentials.url}${endpoint}`;
        
        const config = {
            method: method,
            url: url,
            headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        };
        
        if (data) {
            config.data = data;
        }
        
        const response = await axios(config);
        return response.data;
    } catch (error) {
        console.error('Error calling SuccessFactors API:', error.message);
        throw error;
    }
}
```

---

## 📝 Complete Example: Extract and Display Data

### Example 1: Manual API Call (Using cURL or Postman)

**Request:**
```bash
POST https://your-btp-app.cfapps.us10-001.hana.ondemand.com/compensation/CompensationService/getCompensationData
Content-Type: application/json

{
  "companyId": "SFHUB003674",
  "userId": "sfadmin"
}
```

**Response:**
```json
[
  {
    "id": "uuid-123",
    "companyId": "SFHUB003674",
    "userId": "sfadmin",
    "employeeId": "EMP001",
    "employeeName": "John Doe",
    "position": "Software Engineer",
    "department": "IT",
    "currentSalary": 100000,
    "proposedSalary": 103000,
    "meritIncrease": 3.0,
    "meritIncreaseAmount": 3000,
    "finalSalary": 103000,
    "currency": "USD",
    "effectiveDate": "2026-01-01",
    "status": "Draft"
  },
  {
    "id": "uuid-456",
    "companyId": "SFHUB003674",
    "userId": "sfadmin",
    "employeeId": "EMP002",
    "employeeName": "Jane Smith",
    "position": "Product Manager",
    "department": "Product",
    "currentSalary": 120000,
    "proposedSalary": 124800,
    "meritIncrease": 4.0,
    "meritIncreaseAmount": 4800,
    "finalSalary": 124800,
    "currency": "USD",
    "effectiveDate": "2026-01-01",
    "status": "Draft"
  }
]
```

---

### Example 2: Auto-Load on Page Open

**In Controller** (`CompensationWorksheet.controller.js`):

```javascript
onInit: function () {
    var oView = this.getView();
    var oModel = oView.getModel("compensation");

    // Read URL parameters
    var oUriParams = new URLSearchParams(window.location.search);
    var sCompanyId = oUriParams.get("companyId") || "SFHUB003674";
    var sUserId = oUriParams.get("userId") || "";

    // Set model values
    oModel.setProperty("/companyId", sCompanyId);
    if (sUserId) {
        oModel.setProperty("/userId", sUserId);
    }

    // Auto-load data if userId provided from URL
    if (sUserId) {
        setTimeout(function() {
            console.log("Auto-loading data for user:", sUserId);
            this.onRefresh(); // ✅ This triggers API extraction
        }.bind(this), 1000);
    }
}
```

**URL Example:**
```
https://your-btp-app.cfapps.us10-001.hana.ondemand.com/app/index.html?companyId=SFHUB003674&userId=sfadmin
```

---

### Example 3: Extract Data for Specific Form

**Request:**
```javascript
$.ajax({
    url: "/compensation/CompensationService/getCompensationData",
    method: "POST",
    contentType: "application/json",
    data: JSON.stringify({
        companyId: "SFHUB003674",
        userId: "sfadmin",
        formId: "FORM_2026_Q1"  // ✅ Filter by specific form
    }),
    success: function (data) {
        console.log("Compensation data for form:", data);
        oModel.setProperty("/CompensationWorksheet", data);
    }
});
```

**Backend builds filter:**
```
/odata/v2/Employee_Compensation?$filter=companyId eq 'SFHUB003674' and userId eq 'sfadmin' and formId eq 'FORM_2026_Q1'
```

---

## 🔄 Data Transformation: SuccessFactors → Worksheet

### SuccessFactors API Response Format

```json
{
  "d": {
    "results": [
      {
        "__metadata": {
          "uri": "Employee_Compensation('123')",
          "type": "SFOData.Employee_Compensation"
        },
        "userId": "sfadmin",
        "companyId": "SFHUB003674",
        "employeeId": "EMP001",
        "empName": "John Doe",
        "baseSalary": 100000,
        "meritPercent": 3.0,
        "meritDollar": 3000,
        "finalSalary": 103000,
        "currencyCode": "USD",
        "effectiveDate": "2026-01-01",
        "compensationStatus": "Draft"
      }
    ]
  }
}
```

### Transformed to Worksheet Format

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
    "meritIncreaseAmount": 3000,
    "finalSalary": 103000,
    "currency": "USD",
    "effectiveDate": "2026-01-01",
    "status": "Draft"
  }
]
```

**Key Transformations:**
- `empName` → `employeeName`
- `baseSalary` → `currentSalary`
- `meritPercent` → `meritIncrease`
- `meritDollar` → `meritIncreaseAmount`
- `currencyCode` → `currency`
- `compensationStatus` → `status`

---

## 🎯 How to Test API Extraction

### Test 1: Using Browser Console

1. Open your Compensation Worksheet page
2. Open Browser Developer Tools (F12)
3. Go to Console tab
4. Run:

```javascript
// Test API extraction
$.ajax({
    url: "/compensation/CompensationService/getCompensationData",
    method: "POST",
    contentType: "application/json",
    data: JSON.stringify({
        companyId: "SFHUB003674",
        userId: "sfadmin"
    }),
    success: function (data) {
        console.log("✅ Data extracted successfully:", data);
        console.log("Number of records:", data.length);
    },
    error: function (error) {
        console.error("❌ Error:", error);
    }
});
```

### Test 2: Using Postman

**Request:**
```
POST https://your-btp-app.cfapps.us10-001.hana.ondemand.com/compensation/CompensationService/getCompensationData
Headers:
  Content-Type: application/json
Body:
{
  "companyId": "SFHUB003674",
  "userId": "sfadmin"
}
```

### Test 3: Direct SuccessFactors API Call

**To verify SuccessFactors API directly:**

```bash
curl -X GET \
  "https://api.successfactors.eu/odata/v2/Employee_Compensation?$filter=companyId eq 'SFHUB003674' and userId eq 'sfadmin'" \
  -H "Authorization: Basic <base64-encoded-credentials>" \
  -H "Content-Type: application/json"
```

---

## 🔐 Configuration: SuccessFactors Credentials

### Option 1: Environment Variables

Create `.env` file or set environment variables:

```bash
SF_URL=https://api.successfactors.eu
SF_USERNAME=your-username
SF_PASSWORD=your-password
SF_COMPANY_ID=SFHUB003674
```

### Option 2: OAuth Credentials

```bash
SF_URL=https://api.successfactors.eu
SF_CLIENT_ID=your-client-id
SF_CLIENT_SECRET=your-client-secret
```

### Option 3: BTP Service Binding

In `default-env.json`:

```json
{
  "SuccessFactors": {
    "url": "https://api.successfactors.eu",
    "username": "your-username",
    "password": "your-password",
    "companyId": "SFHUB003674"
  }
}
```

---

## 📊 Field Mapping Reference

| SuccessFactors Field | Worksheet Field | Notes |
|---------------------|----------------|-------|
| `empId` / `employeeId` | `employeeId` | Employee identifier |
| `empName` / `employeeName` | `employeeName` | Full name |
| `baseSalary` / `salary` | `currentSalary` | Current base salary |
| `meritPercent` / `meritIncreasePercent` | `meritIncrease` | Merit increase % |
| `meritDollar` | `meritIncreaseAmount` | Merit increase amount |
| `promotionPercent` | `promotionIncrease` | Promotion increase % |
| `promotionDollar` | `promotionIncreaseAmount` | Promotion increase amount |
| `adjustmentPercent` | `adjustmentIncrease` | Adjustment increase % |
| `adjustmentDollar` | `adjustmentIncreaseAmount` | Adjustment increase amount |
| `lumpSumAmount` | `lumpSum` | Lump sum payment |
| `totalIncreasePercent` | `totalIncrease` | Total increase % |
| `totalRaise` | `totalIncreaseAmount` | Total increase amount |
| `finalSalary` / `newSalary` | `finalSalary` | Final salary |
| `currencyCode` | `currency` | Currency code (USD, EUR, etc.) |
| `effectiveDate` | `effectiveDate` | Effective date |
| `compensationStatus` | `status` | Status (Draft, Pending, Approved) |

---

## 🚀 Quick Start: Extract Data Now

### Method 1: Use the UI

1. Open Compensation Worksheet
2. Enter **Company ID**: `SFHUB003674`
3. Enter **User ID**: `sfadmin`
4. Click **Refresh** button
5. ✅ Data will be extracted and displayed!

### Method 2: Use URL Parameters

Navigate to:
```
https://your-btp-app.cfapps.us10-001.hana.ondemand.com/app/index.html?companyId=SFHUB003674&userId=sfadmin
```

Data will auto-load!

### Method 3: Programmatic Call

```javascript
// In your controller or custom function
onExtractData: function() {
    var oModel = this.getView().getModel("compensation");
    
    $.ajax({
        url: "/compensation/CompensationService/getCompensationData",
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify({
            companyId: oModel.getProperty("/companyId"),
            userId: oModel.getProperty("/userId")
        }),
        success: function (data) {
            // Insert data into worksheet
            oModel.setProperty("/CompensationWorksheet", data);
            oModel.setProperty("/totalEmployees", data.length);
            MessageToast.show("Extracted " + data.length + " records");
        }
    });
}
```

---

## 🐛 Troubleshooting

### Issue 1: No Data Returned

**Check:**
- SuccessFactors credentials are correct
- User has RBP permissions
- Company ID and User ID are correct
- SuccessFactors API endpoint is accessible

**Debug:**
```javascript
// Check backend logs
console.log("SF API Response:", sfData);

// Check if data exists
if (!sfData.d?.results || sfData.d.results.length === 0) {
    console.log("No data found in SuccessFactors");
}
```

### Issue 2: Authentication Error

**Check:**
- Credentials are set correctly
- OAuth token is valid (if using OAuth)
- Basic Auth credentials are correct

**Fix:**
```javascript
// Verify credentials
console.log("SF URL:", sfCredentials.url);
console.log("Has username:", !!sfCredentials.username);
console.log("Has password:", !!sfCredentials.password);
```

### Issue 3: Data Not Displaying in UI

**Check:**
- Model binding is correct: `{compensation>/CompensationWorksheet}`
- Data format matches expected structure
- Table rows binding: `rows="{compensation>/CompensationWorksheet}"`

**Fix:**
```javascript
// Verify data in model
var oModel = this.getView().getModel("compensation");
var aData = oModel.getProperty("/CompensationWorksheet");
console.log("Data in model:", aData);
```

---

## 📚 Summary

### How Data Extraction Works:

1. **User Action**: Click Refresh or page loads with URL params
2. **UI Call**: Frontend calls `/getCompensationData` API
3. **RBP Check**: Backend verifies user permissions
4. **SF API Call**: Backend calls SuccessFactors API
5. **Data Transform**: Backend transforms SF format to worksheet format
6. **UI Display**: Frontend receives data and displays in table

### Key Files:

- **Frontend**: `app/webapp/controller/CompensationWorksheet.controller.js`
- **Backend**: `srv/compensation-service.js`
- **API Definition**: `srv/compensation-service.cds`

### API Endpoint:

```
POST /compensation/CompensationService/getCompensationData
```

**Request:**
```json
{
  "companyId": "SFHUB003674",
  "userId": "sfadmin",
  "formId": "optional"
}
```

**Response:**
```json
[
  {
    "employeeId": "EMP001",
    "employeeName": "John Doe",
    "currentSalary": 100000,
    "meritIncrease": 3.0,
    "finalSalary": 103000
  }
]
```

---

## ✅ Next Steps

1. **Test API Extraction**: Use the UI or Postman to test
2. **Verify Data**: Check that data appears in the worksheet
3. **Customize Mapping**: Adjust field mappings in `compensation-service.js` if needed
4. **Add Filters**: Add more filter options (date range, department, etc.)
5. **Error Handling**: Add better error messages for users

**You're all set! The API extraction is already implemented and ready to use!** 🎉
