# How to Test GET and POST Operations

## 📋 Complete Testing Guide

This guide provides step-by-step instructions for testing GET and POST operations in your Compensation Worksheet application.

---

## 🚀 Quick Start: Test in Browser

### Method 1: Using Browser Console (Easiest)

1. **Start your application**:
   ```bash
   npm start
   ```

2. **Open application in browser**:
   ```
   http://localhost:4004/app/index.html
   ```

3. **Open Browser Developer Tools**:
   - Press `F12` or `Ctrl+Shift+I` (Windows)
   - Go to **Console** tab

4. **Test GET Operation**:
   ```javascript
   // Test GET - Get Compensation Data
   $.ajax({
       url: "/compensation/CompensationService/getCompensationData",
       method: "POST",
       contentType: "application/json",
       data: JSON.stringify({
           companyId: "SFHUB003674",
           userId: "sfadmin"
       }),
       success: function(data) {
           console.log("✅ GET Success!");
           console.log("Data:", data);
           console.log("Number of records:", data.length);
       },
       error: function(error) {
           console.error("❌ GET Error:", error);
       }
   });
   ```

5. **Test POST Operation**:
   ```javascript
   // Test POST - Create New Record
   $.ajax({
       url: "/compensation/CompensationService/postCompensationData",
       method: "POST",
       contentType: "application/json",
       data: JSON.stringify({
           companyId: "SFHUB003674",
           userId: "sfadmin",
           data: {
               employeeId: "TEST001",
               employeeName: "Test Employee",
               currentSalary: 100000,
               meritIncrease: 3.0,
               meritIncreaseAmount: 3000,
               finalSalary: 103000,
               currency: "USD",
               status: "Draft"
           }
       }),
       success: function(result) {
           console.log("✅ POST Success!");
           console.log("Created record:", result);
       },
       error: function(error) {
           console.error("❌ POST Error:", error);
       }
   });
   ```

---

## 🧪 Method 2: Using Postman

### Setup Postman

1. **Download Postman**: https://www.postman.com/downloads/

2. **Create New Collection**: "Compensation API Tests"

### Test GET Operation

**Request Configuration**:
- **Method**: `POST`
- **URL**: `http://localhost:4004/compensation/CompensationService/getCompensationData`
- **Headers**:
  ```
  Content-Type: application/json
  ```
- **Body** (raw JSON):
  ```json
  {
    "companyId": "SFHUB003674",
    "userId": "sfadmin"
  }
  ```

**Expected Response**:
```json
[
  {
    "id": "uuid-here",
    "companyId": "SFHUB003674",
    "userId": "sfadmin",
    "employeeId": "EMP001",
    "employeeName": "John Doe",
    "currentSalary": 100000,
    "finalSalary": 103000
  }
]
```

### Test POST Operation

**Request Configuration**:
- **Method**: `POST`
- **URL**: `http://localhost:4004/compensation/CompensationService/postCompensationData`
- **Headers**:
  ```
  Content-Type: application/json
  ```
- **Body** (raw JSON):
  ```json
  {
    "companyId": "SFHUB003674",
    "userId": "sfadmin",
    "data": {
      "employeeId": "TEST001",
      "employeeName": "Test Employee",
      "currentSalary": 100000,
      "meritIncrease": 3.0,
      "meritIncreaseAmount": 3000,
      "finalSalary": 103000,
      "currency": "USD",
      "status": "Draft"
    }
  }
  ```

**Expected Response**:
```json
{
  "id": "new-uuid-here",
  "employeeId": "TEST001",
  "employeeName": "Test Employee",
  "currentSalary": 100000,
  "finalSalary": 103000,
  "status": "Draft"
}
```

---

## 🖥️ Method 3: Using cURL (Command Line)

### Test GET Operation

**Windows PowerShell**:
```powershell
$body = @{
    companyId = "SFHUB003674"
    userId = "sfadmin"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:4004/compensation/CompensationService/getCompensationData" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body
```

**Linux/Mac/Git Bash**:
```bash
curl -X POST \
  http://localhost:4004/compensation/CompensationService/getCompensationData \
  -H "Content-Type: application/json" \
  -d '{
    "companyId": "SFHUB003674",
    "userId": "sfadmin"
  }'
```

### Test POST Operation

**Windows PowerShell**:
```powershell
$body = @{
    companyId = "SFHUB003674"
    userId = "sfadmin"
    data = @{
        employeeId = "TEST001"
        employeeName = "Test Employee"
        currentSalary = 100000
        meritIncrease = 3.0
        finalSalary = 103000
        currency = "USD"
        status = "Draft"
    }
} | ConvertTo-Json -Depth 10

Invoke-RestMethod -Uri "http://localhost:4004/compensation/CompensationService/postCompensationData" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body
```

**Linux/Mac/Git Bash**:
```bash
curl -X POST \
  http://localhost:4004/compensation/CompensationService/postCompensationData \
  -H "Content-Type: application/json" \
  -d '{
    "companyId": "SFHUB003674",
    "userId": "sfadmin",
    "data": {
      "employeeId": "TEST001",
      "employeeName": "Test Employee",
      "currentSalary": 100000,
      "meritIncrease": 3.0,
      "finalSalary": 103000,
      "currency": "USD",
      "status": "Draft"
    }
  }'
```

---

## 🎯 Method 4: Using the UI (Recommended)

### Test GET Operation

1. **Open Application**:
   ```
   http://localhost:4004/app/index.html
   ```

2. **Enter Details**:
   - **Company ID**: `SFHUB003674`
   - **User ID**: `sfadmin`
   - **Form ID**: (optional)

3. **Click "Refresh" Button**:
   - This triggers the GET operation
   - Data loads and displays in the table
   - You should see employees in the scrollable table

4. **Verify**:
   - Check browser console (F12) for API calls
   - Verify data appears in the table
   - Scroll down to see all employees

### Test POST Operation

1. **Add New Employee**:
   - Click the **"+" (Add)** button in the table toolbar
   - Fill in employee details:
     - Employee ID: `TEST001`
     - Employee Name: `Test Employee`
     - Current Salary: `100000`
     - Merit Increase: `3.0`
     - Final Salary: `103000`
     - Status: `Draft`

2. **Click "Save" Button**:
   - This triggers the POST/UPDATE operation
   - Data is saved to database and SuccessFactors

3. **Verify**:
   - Check browser console for success message
   - Verify data persists after refresh
   - Check database for saved record

---

## 📝 Complete Test Script

### JavaScript Test Script (Save as `test-api.js`)

```javascript
// Test API Operations Script
// Run in browser console after opening the application

console.log("=== Starting API Tests ===");

// Test 1: GET Operation
function testGET() {
    console.log("\n1. Testing GET Operation...");
    
    return new Promise((resolve, reject) => {
        $.ajax({
            url: "/compensation/CompensationService/getCompensationData",
            method: "POST",
            contentType: "application/json",
            data: JSON.stringify({
                companyId: "SFHUB003674",
                userId: "sfadmin"
            }),
            success: function(data) {
                console.log("✅ GET Success!");
                console.log("Records received:", data.length);
                console.log("Sample data:", data[0]);
                resolve(data);
            },
            error: function(error) {
                console.error("❌ GET Failed:", error);
                reject(error);
            }
        });
    });
}

// Test 2: POST Operation
function testPOST() {
    console.log("\n2. Testing POST Operation...");
    
    const testData = {
        employeeId: "TEST" + Date.now(),
        employeeName: "Test Employee " + Date.now(),
        currentSalary: 100000,
        meritIncrease: 3.0,
        meritIncreaseAmount: 3000,
        finalSalary: 103000,
        currency: "USD",
        status: "Draft"
    };
    
    return new Promise((resolve, reject) => {
        $.ajax({
            url: "/compensation/CompensationService/postCompensationData",
            method: "POST",
            contentType: "application/json",
            data: JSON.stringify({
                companyId: "SFHUB003674",
                userId: "sfadmin",
                data: testData
            }),
            success: function(result) {
                console.log("✅ POST Success!");
                console.log("Created record:", result);
                resolve(result);
            },
            error: function(error) {
                console.error("❌ POST Failed:", error);
                reject(error);
            }
        });
    });
}

// Test 3: UPDATE Operation
function testUPDATE(recordId) {
    console.log("\n3. Testing UPDATE Operation...");
    
    return new Promise((resolve, reject) => {
        $.ajax({
            url: "/compensation/CompensationService/updateCompensationData",
            method: "POST",
            contentType: "application/json",
            data: JSON.stringify({
                companyId: "SFHUB003674",
                userId: "sfadmin",
                data: [{
                    id: recordId,
                    employeeId: "TEST001",
                    meritIncrease: 3.5,
                    finalSalary: 103500
                }]
            }),
            success: function(result) {
                console.log("✅ UPDATE Success!");
                console.log("Updated:", result);
                resolve(result);
            },
            error: function(error) {
                console.error("❌ UPDATE Failed:", error);
                reject(error);
            }
        });
    });
}

// Run all tests
async function runAllTests() {
    try {
        // Test GET
        const getData = await testGET();
        
        // Test POST
        const postResult = await testPOST();
        
        // Test UPDATE (if we have a record ID)
        if (getData && getData.length > 0) {
            await testUPDATE(getData[0].id);
        }
        
        console.log("\n=== All Tests Completed ===");
    } catch (error) {
        console.error("\n=== Tests Failed ===", error);
    }
}

// Run tests
runAllTests();
```

**How to use**:
1. Copy the script above
2. Open browser console (F12)
3. Paste and press Enter
4. Watch the test results

---

## 🔍 Method 5: Using Network Tab

### Monitor API Calls

1. **Open Browser Developer Tools** (F12)
2. **Go to Network Tab**
3. **Filter**: Select "XHR" or "Fetch"
4. **Perform Actions**:
   - Click "Refresh" button → See GET request
   - Click "Save" button → See POST/UPDATE request
5. **Inspect Requests**:
   - Click on any request
   - View **Headers**, **Payload**, **Response**
   - Check status code (200 = success)

**Example Network Request**:
```
Request URL: http://localhost:4004/compensation/CompensationService/getCompensationData
Request Method: POST
Status Code: 200 OK

Request Headers:
  Content-Type: application/json

Request Payload:
  {
    "companyId": "SFHUB003674",
    "userId": "sfadmin"
  }

Response:
  [
    {
      "id": "uuid-123",
      "employeeId": "EMP001",
      ...
    }
  ]
```

---

## ✅ Verification Checklist

### GET Operation Verification:

- [ ] API call returns status 200
- [ ] Response contains array of compensation records
- [ ] Data displays in the table
- [ ] Table is scrollable (can see all employees)
- [ ] No console errors
- [ ] RBP permissions checked (if applicable)

### POST Operation Verification:

- [ ] API call returns status 200
- [ ] Response contains created/updated record
- [ ] Data persists after page refresh
- [ ] Record appears in database
- [ ] Audit log entry created
- [ ] SuccessFactors MDF object updated (if configured)
- [ ] No console errors

---

## 🐛 Troubleshooting

### Issue 1: GET Returns Empty Array

**Possible Causes**:
- No data in SuccessFactors
- Wrong companyId or userId
- RBP permissions not granted

**Solution**:
```javascript
// Check RBP first
$.ajax({
    url: "/compensation/CompensationService/checkUserRBP",
    method: "POST",
    contentType: "application/json",
    data: JSON.stringify({
        companyId: "SFHUB003674",
        userId: "sfadmin",
        permission: "COMPENSATION_VIEW"
    }),
    success: function(rbp) {
        console.log("RBP Status:", rbp);
    }
});
```

### Issue 2: POST Returns 500 Error

**Possible Causes**:
- Missing required fields
- Invalid data format
- Database connection issue

**Solution**:
- Check browser console for error details
- Verify all required fields are provided
- Check server logs for detailed error

### Issue 3: CORS Error

**Solution**:
- Verify CORS is configured in `srv/server.js`
- Check if request is from allowed origin
- For local testing, CORS should allow `*`

---

## 📊 Expected Results

### Successful GET Response:
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "companyId": "SFHUB003674",
    "userId": "sfadmin",
    "employeeId": "EMP001",
    "employeeName": "John Doe",
    "currentSalary": 100000,
    "meritIncrease": 3.0,
    "finalSalary": 103000,
    "currency": "USD",
    "status": "Draft"
  }
]
```

### Successful POST Response:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "companyId": "SFHUB003674",
  "userId": "sfadmin",
  "employeeId": "TEST001",
  "employeeName": "Test Employee",
  "currentSalary": 100000,
  "meritIncrease": 3.0,
  "finalSalary": 103000,
  "status": "Draft",
  "lastModified": "2026-01-08T10:30:00.000Z"
}
```

---

## 🎯 Quick Test Commands

### One-Line GET Test (Browser Console):
```javascript
$.ajax({url:"/compensation/CompensationService/getCompensationData",method:"POST",contentType:"application/json",data:JSON.stringify({companyId:"SFHUB003674",userId:"sfadmin"}),success:d=>console.log("✅",d),error:e=>console.error("❌",e)});
```

### One-Line POST Test (Browser Console):
```javascript
$.ajax({url:"/compensation/CompensationService/postCompensationData",method:"POST",contentType:"application/json",data:JSON.stringify({companyId:"SFHUB003674",userId:"sfadmin",data:{employeeId:"TEST001",employeeName:"Test",currentSalary:100000,finalSalary:103000,status:"Draft"}}),success:r=>console.log("✅",r),error:e=>console.error("❌",e)});
```

---

## 📚 Summary

### Testing Methods:
1. ✅ **Browser Console** - Quick and easy
2. ✅ **Postman** - Professional API testing
3. ✅ **cURL** - Command line testing
4. ✅ **UI** - Real user experience
5. ✅ **Network Tab** - Monitor all requests

### Test Operations:
- ✅ **GET** - Retrieve compensation data
- ✅ **POST** - Create new records
- ✅ **UPDATE** - Update existing records
- ✅ **UPSERT** - Smart insert/update

**All methods are ready to use! Choose the one that works best for you.** 🚀
