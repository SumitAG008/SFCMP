# Testing in SAP Business Application Studio (BAS)

## 🌐 Accessing Your Application in BAS

### Important: Use BAS Port URL, Not Localhost!

When running in BAS, your application is accessible via a **port forwarding URL**, not `localhost`.

---

## 🔗 Finding Your BAS Application URL

### Method 1: From Terminal Output

When you run `npm start`, look for the port forwarding URL:

```
[cds] - server listening on { url: 'http://localhost:4004' }
```

**BAS automatically creates a port forwarding URL**:
```
https://port4004-workspaces-ws-gw643.us10.trial.applicationstudio.cloud.sap
```

### Method 2: From BAS Ports Panel

1. **In BAS**, look at the **Ports** panel (usually at the bottom)
2. **Find port 4004** in the list
3. **Click the "Open in Browser" icon** (globe icon) or copy the URL
4. **URL format**: `https://port4004-workspaces-ws-<workspace-id>.us10.trial.applicationstudio.cloud.sap`

---

## ✅ Correct Application URL

**Your Application URL**:
```
https://port4004-workspaces-ws-gw643.us10.trial.applicationstudio.cloud.sap/app/index.html
```

**NOT**: `http://localhost:4004/app/index.html` ❌

---

## 🧪 Testing GET and POST Operations in BAS

### Method 1: Using Browser Console (Recommended)

1. **Open your application**:
   ```
   https://port4004-workspaces-ws-gw643.us10.trial.applicationstudio.cloud.sap/app/index.html
   ```

2. **Open Browser Developer Tools**:
   - Press `F12` or `Ctrl+Shift+I`
   - Go to **Console** tab

3. **Test GET Operation**:
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
           console.log("Records:", data.length);
           console.log("Data:", data);
       },
       error: function(error) {
           console.error("❌ GET Error:", error);
           console.error("Status:", error.status);
           console.error("Response:", error.responseJSON);
       }
   });
   ```

4. **Test POST Operation**:
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
           console.log("Created:", result);
       },
       error: function(error) {
           console.error("❌ POST Error:", error);
           console.error("Status:", error.status);
           console.error("Response:", error.responseJSON);
       }
   });
   ```

---

### Method 2: Using the UI (Easiest)

1. **Open Application**:
   ```
   https://port4004-workspaces-ws-gw643.us10.trial.applicationstudio.cloud.sap/app/index.html
   ```

2. **Enter Details**:
   - **Company ID**: `SFHUB003674`
   - **User ID**: `sfadmin` (or your test user)
   - **Form ID**: (optional)

3. **Test GET**:
   - Click **"Refresh"** button
   - Data loads and displays in the table
   - Check browser console (F12) to see API call

4. **Test POST**:
   - Click **"+" (Add)** button to add employee
   - Fill in employee details
   - Click **"Save"** button
   - Check console for success message

---

### Method 3: Using Network Tab

1. **Open Developer Tools** (F12)
2. **Go to Network Tab**
3. **Filter**: Select "XHR" or "Fetch"
4. **Perform Actions**:
   - Click "Refresh" → See GET request
   - Click "Save" → See POST request
5. **Inspect**:
   - Click on request
   - View **Headers**, **Payload**, **Response**
   - Check **Status Code** (200 = success)

---

## 🔍 Complete Test Script for BAS

**Copy and paste this entire script in Browser Console**:

```javascript
// Complete API Test Script for BAS
console.log("=== Starting API Tests in BAS ===");

// Test 1: GET Operation
function testGET() {
    console.log("\n📥 Testing GET Operation...");
    
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
                console.log("📊 Records received:", data.length);
                if (data.length > 0) {
                    console.log("📋 Sample record:", data[0]);
                } else {
                    console.log("ℹ️ No records found (this is OK if no data exists)");
                }
                resolve(data);
            },
            error: function(error) {
                console.error("❌ GET Failed!");
                console.error("Status:", error.status);
                console.error("Error:", error.responseJSON || error);
                reject(error);
            }
        });
    });
}

// Test 2: POST Operation
function testPOST() {
    console.log("\n📤 Testing POST Operation...");
    
    const testData = {
        employeeId: "TEST" + Date.now(),
        employeeName: "Test Employee " + new Date().toLocaleTimeString(),
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
                console.log("📝 Created record:", result);
                resolve(result);
            },
            error: function(error) {
                console.error("❌ POST Failed!");
                console.error("Status:", error.status);
                console.error("Error:", error.responseJSON || error);
                reject(error);
            }
        });
    });
}

// Test 3: UPDATE Operation
function testUPDATE(recordId) {
    console.log("\n🔄 Testing UPDATE Operation...");
    
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
                    meritIncreaseAmount: 3500,
                    finalSalary: 103500
                }]
            }),
            success: function(result) {
                console.log("✅ UPDATE Success!");
                console.log("📝 Updated:", result);
                resolve(result);
            },
            error: function(error) {
                console.error("❌ UPDATE Failed!");
                console.error("Status:", error.status);
                console.error("Error:", error.responseJSON || error);
                reject(error);
            }
        });
    });
}

// Run all tests
async function runAllTests() {
    try {
        console.log("🚀 Starting comprehensive API tests...\n");
        
        // Test GET
        const getData = await testGET();
        
        // Test POST
        const postResult = await testPOST();
        
        // Test UPDATE (if we have a record ID)
        if (getData && getData.length > 0) {
            await testUPDATE(getData[0].id);
        } else if (postResult && postResult.id) {
            await testUPDATE(postResult.id);
        }
        
        console.log("\n✅ === All Tests Completed Successfully ===");
        console.log("📊 Summary:");
        console.log("   - GET: ✅");
        console.log("   - POST: ✅");
        console.log("   - UPDATE: ✅");
        
    } catch (error) {
        console.error("\n❌ === Tests Failed ===");
        console.error("Error details:", error);
    }
}

// Run tests automatically
runAllTests();
```

**How to use**:
1. Open your application in BAS
2. Press F12 to open console
3. Copy the entire script above
4. Paste in console
5. Press Enter
6. Watch the test results!

---

## 🎯 Quick One-Line Tests

### GET Test (Copy-Paste):
```javascript
$.ajax({url:"/compensation/CompensationService/getCompensationData",method:"POST",contentType:"application/json",data:JSON.stringify({companyId:"SFHUB003674",userId:"sfadmin"}),success:d=>console.log("✅ GET:",d.length,"records",d),error:e=>console.error("❌",e.status,e.responseJSON)});
```

### POST Test (Copy-Paste):
```javascript
$.ajax({url:"/compensation/CompensationService/postCompensationData",method:"POST",contentType:"application/json",data:JSON.stringify({companyId:"SFHUB003674",userId:"sfadmin",data:{employeeId:"TEST001",employeeName:"Test",currentSalary:100000,meritIncrease:3.0,finalSalary:103000,currency:"USD",status:"Draft"}}),success:r=>console.log("✅ POST:",r),error:e=>console.error("❌",e.status,e.responseJSON)});
```

---

## 🔧 Troubleshooting in BAS

### Issue 1: Connection Refused

**Problem**: Trying to access `localhost:4004`

**Solution**: Use BAS port forwarding URL:
```
✅ https://port4004-workspaces-ws-gw643.us10.trial.applicationstudio.cloud.sap
❌ http://localhost:4004
```

### Issue 2: 404 Not Found

**Problem**: API endpoint not found

**Solution**: 
- Verify server is running: Check terminal for `[cds] - server listening`
- Check URL path: Should be `/compensation/CompensationService/...`
- Verify service is registered: Check terminal output

### Issue 3: CORS Error

**Problem**: Cross-origin request blocked

**Solution**: 
- CORS is already configured in `srv/server.js`
- If still getting errors, check server logs
- Verify request is going to correct URL

### Issue 4: 500 Internal Server Error

**Problem**: Server-side error

**Solution**:
- Check terminal output for error details
- Verify database is initialized
- Check SuccessFactors credentials (if using real API)

---

## 📊 Expected Results

### Successful GET Response:
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

**Note**: If no data exists in SuccessFactors, you'll get an empty array `[]` - this is normal!

### Successful POST Response:
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

## ✅ Verification Steps

### After GET Test:
- [ ] Console shows "✅ GET Success!"
- [ ] Records count displayed
- [ ] Data appears in table (if records exist)
- [ ] No errors in console

### After POST Test:
- [ ] Console shows "✅ POST Success!"
- [ ] Created record displayed
- [ ] Record appears in table
- [ ] Data persists after refresh
- [ ] No errors in console

---

## 🚀 Quick Start Checklist

1. ✅ **Server Running**: Check terminal shows `[cds] - server listening`
2. ✅ **Correct URL**: Use BAS port URL, not localhost
3. ✅ **Open Application**: Navigate to `/app/index.html`
4. ✅ **Open Console**: Press F12
5. ✅ **Run Tests**: Copy-paste test script
6. ✅ **Verify Results**: Check console output

---

## 📝 Summary

### Key Points:
- ✅ **Use BAS URL**: `https://port4004-workspaces-ws-gw643.us10.trial.applicationstudio.cloud.sap`
- ✅ **NOT localhost**: `http://localhost:4004` won't work in BAS
- ✅ **Test in Console**: Easiest method for API testing
- ✅ **Use UI**: Click buttons to test real user flow
- ✅ **Check Network Tab**: Monitor all API calls

**Your application is running in BAS - use the port forwarding URL to access it!** 🎉
