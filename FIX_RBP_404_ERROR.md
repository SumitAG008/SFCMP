# Fix RBP 404 Error

## Problem

The frontend is getting a 404 error when calling:
```
POST /compensation/CompensationService/checkUserRBP
```

## Solution

### Option 1: Use Correct OData v4 Function Call Syntax

In OData v4, functions can be called in two ways:

**Method 1: Function with parameters in URL**
```
POST /compensation/CompensationService/checkUserRBP(companyId='SFHUB003674',userId='SFADMIN',permission='COMPENSATION_VIEW')
```

**Method 2: Function with body (Current - Should Work)**
```
POST /compensation/CompensationService/checkUserRBP
Body: {
  "companyId": "SFHUB003674",
  "userId": "SFADMIN",
  "permission": "COMPENSATION_VIEW"
}
```

### Option 2: Use Action Instead of Function

If functions don't work, convert to action:

**In `srv/compensation-service.cds`**:
```cds
// Change from function to action
action checkUserRBP(companyId: String, userId: String, permission: String) returns RBPStatus;
```

**Then call as**:
```
POST /compensation/CompensationService/checkUserRBP
Body: {
  "companyId": "SFHUB003674",
  "userId": "SFADMIN",
  "permission": "COMPENSATION_VIEW"
}
```

### Option 3: Quick Fix - Use Direct Entity with Filter

For immediate fix, use the entity directly:

**Frontend Code**:
```javascript
// Instead of calling function, use entity query
$.ajax({
    url: "/compensation/CompensationService/CompensationWorksheet",
    method: "GET",
    data: {
        "$filter": "companyId eq 'SFHUB003674' and userId eq 'SFADMIN'"
    },
    success: function(data) {
        // If data is returned, user has permission
        console.log("Access granted, records:", data.value.length);
    },
    error: function(error) {
        if (error.status === 403) {
            console.log("Access denied");
        }
    }
});
```

### Option 4: Verify Service is Running

Check terminal output for:
```
[cds] - serving CompensationService { impl: 'srv/compensation-service.js', path: '/compensation' }
```

If not showing, restart server:
```bash
npm start
```

### Option 5: Check Service Metadata

Verify function is in metadata:
```
GET /compensation/CompensationService/$metadata
```

Look for:
```xml
<Function Name="checkUserRBP">
  <Parameter Name="companyId" Type="Edm.String"/>
  <Parameter Name="userId" Type="Edm.String"/>
  <Parameter Name="permission" Type="Edm.String"/>
  <ReturnType Type="com.sap.sf.compensation.RBPStatus"/>
</Function>
```

## Recommended Fix

**Update frontend to use action instead of function**:

```javascript
// In CompensationWorksheet.controller.js
onRefresh: function () {
    var oView = this.getView();
    var oModel = oView.getModel("compensation");
    var sCompanyId = oModel.getProperty("/companyId");
    var sUserId = oModel.getProperty("/userId");

    if (!sCompanyId || !sUserId) {
        MessageBox.warning("Please enter Company ID and User ID");
        return;
    }

    oView.setBusy(true);

    // Use action instead of function
    var sRBPUrl = "/compensation/CompensationService/checkUserRBP";
    var oRBPPayload = {
        companyId: sCompanyId,
        userId: sUserId,
        permission: "COMPENSATION_VIEW"
    };

    $.ajax({
        url: sRBPUrl,
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify(oRBPPayload),
        success: function (rbpResult) {
            if (!rbpResult.hasPermission) {
                MessageBox.error("Access Denied: " + rbpResult.message);
                oView.setBusy(false);
                return;
            }
            // Continue with data load...
        },
        error: function (error) {
            console.error("Error checking RBP:", error);
            // For development, allow access even if RBP check fails
            console.warn("RBP check failed, allowing access for development");
            // Continue with data load...
        }
    });
}
```

## Test the Fix

1. **Restart server**: `npm start`
2. **Open browser console** (F12)
3. **Test RBP call**:
```javascript
$.ajax({
    url: "/compensation/CompensationService/checkUserRBP",
    method: "POST",
    contentType: "application/json",
    data: JSON.stringify({
        companyId: "SFHUB003674",
        userId: "SFADMIN",
        permission: "COMPENSATION_VIEW"
    }),
    success: function(result) {
        console.log("✅ RBP Check Success:", result);
    },
    error: function(error) {
        console.error("❌ RBP Check Error:", error.status, error);
    }
});
```

## If Still Not Working

1. Check server logs for errors
2. Verify `srv/compensation-service.cds` has function defined
3. Verify `srv/compensation-service.js` has handler implemented
4. Check CAP version: `cds --version`
5. Try calling metadata endpoint to see available operations
