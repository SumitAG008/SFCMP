# SuccessFactors Employee Compensations API Integration

## 📋 API Overview

**API Endpoint**: `GET /employeeCompensations`

**Official Documentation**: https://api.sap.com/api/sap-sf-employeeCompensation-v1/resource/Employee_Compensation

**Purpose**: Access data from standard and custom fields on the three tabs of:
- **Salary** tab
- **Bonus** tab  
- **Stock** tab

Also includes data from:
- Variable pay worksheets
- User data
- Salary-related data
- Performance rating
- Force comments

---

## 🔌 API Endpoint Details

### Base URL
```
https://{your-instance}.successfactors.eu/odata/v2/employeeCompensations
```

### GET Request

**Endpoint**: `/employeeCompensations`

**Query Parameters**:
- `$filter`: Filter by templateId, userId, companyId, employeeId
- `$select`: Select specific fields
- `$expand`: Expand related entities
- `$top`: Limit number of results
- `$skip`: Skip records
- `$orderby`: Sort results

**Example Request**:
```
GET /odata/v2/employeeCompensations?$filter=templateId eq 'COMP_2024' and companyId eq 'SFHUB003674'&$select=employeeId,employeeName,currentSalary,meritIncrease,performanceRating
```

---

## 📊 Response Structure

### Standard Fields Available

#### Salary Tab Fields:
- `employeeId` - Employee identifier
- `employeeName` - Full name
- `currentSalary` - Current base salary
- `currency` - Currency code (USD, EUR, etc.)
- `meritIncrease` - Merit increase percentage
- `meritIncreaseAmount` - Merit increase amount
- `adjustmentIncrease` - Adjustment percentage
- `adjustmentIncreaseAmount` - Adjustment amount
- `lumpSum` - Lump sum payment
- `finalSalary` - Final calculated salary
- `totalPayIncludingLumpSum` - Total pay including lump sum
- `effectiveDate` - Effective date for compensation

#### Bonus Tab Fields:
- `bonusTarget` - Target bonus amount
- `bonusActual` - Actual bonus paid
- `bonusPercentage` - Bonus as percentage of salary
- `bonusPlan` - Bonus plan name

#### Stock Tab Fields:
- `stockGrant` - Stock grant amount
- `stockVested` - Vested stock amount
- `stockPlan` - Stock plan name
- `equityValue` - Total equity value

#### Performance & Comments:
- `performanceRating` - Overall performance rating (1-5)
- `performanceRatingText` - Performance rating description
- `forceComments` - Force distribution comments
- `managerComments` - Manager comments

#### User Data:
- `userId` - User identifier
- `jobTitle` - Job title
- `department` - Department name
- `location` - Location
- `hireDate` - Hire date
- `payGrade` - Pay grade
- `salaryRangeMin` - Minimum salary range
- `salaryRangeMax` - Maximum salary range
- `compaRatio` - Compa-ratio (current salary / midpoint)
- `rangePenetration` - Range penetration percentage

#### Custom Fields:
- Any custom fields configured in SuccessFactors
- Accessible via field names like `customField1`, `customField2`, etc.

---

## 🔧 Implementation

### Backend Handler

**File**: `srv/compensation-service.js`

```javascript
// GET Compensation Data from SuccessFactors Employee Compensations API
this.on('getCompensationData', async (req) => {
  const { companyId, userId, formId, templateId } = req.data;
  
  try {
    // 1. Check RBP permissions
    const rbpCheck = await rbpService.checkUserRBP(userId, companyId, 'COMPENSATION_VIEW');
    if (!rbpCheck.hasPermission) {
      req.error(403, `User ${userId} does not have permission to view compensation data`);
      return;
    }
    
    // 2. Build API endpoint with filters
    let endpoint = `/odata/v2/employeeCompensations`;
    
    const filters = [];
    if (companyId) filters.push(`companyId eq '${companyId}'`);
    if (templateId || formId) {
      filters.push(`templateId eq '${templateId || formId}'`);
    }
    
    // Add $select to get all relevant fields
    const selectFields = [
      'employeeId',
      'employeeName',
      'currentSalary',
      'currency',
      'meritIncrease',
      'meritIncreaseAmount',
      'adjustmentIncrease',
      'adjustmentIncreaseAmount',
      'lumpSum',
      'finalSalary',
      'totalPayIncludingLumpSum',
      'effectiveDate',
      'performanceRating',
      'performanceRatingText',
      'forceComments',
      'managerComments',
      'jobTitle',
      'department',
      'location',
      'hireDate',
      'payGrade',
      'salaryRangeMin',
      'salaryRangeMax',
      'compaRatio',
      'rangePenetration',
      'bonusTarget',
      'bonusActual',
      'stockGrant',
      'stockVested',
      'equityValue'
    ];
    
    endpoint += `?$filter=${filters.join(' and ')}`;
    endpoint += `&$select=${selectFields.join(',')}`;
    
    // 3. Call SuccessFactors API
    const sfData = await callSFAPI(endpoint);
    
    // 4. Transform to worksheet format
    const compensationData = sfData.d?.results?.map(item => ({
      // Employee Info
      employeeId: item.employeeId,
      employeeName: item.employeeName,
      jobTitle: item.jobTitle || '',
      overallPerformance: item.performanceRating || 0,
      overallPerformanceText: item.performanceRatingText || '',
      
      // Current Pay (Red highlighted - Read-only from SF)
      currentSalary: item.currentSalary || 0,
      currency: item.currency || 'USD',
      payGrade: item.payGrade || '',
      salaryRangeMin: item.salaryRangeMin || 0,
      salaryRangeMax: item.salaryRangeMax || 0,
      compaRatio: item.compaRatio || 0,
      rangePenetration: item.rangePenetration || 0,
      
      // Editable Fields (Green highlighted - User can edit)
      merit: item.meritIncrease || 0,
      meritAmount: item.meritIncreaseAmount || 0,
      adjustment: item.adjustmentIncrease || 0,
      adjustmentAmount: item.adjustmentIncreaseAmount || 0,
      lumpSum: item.lumpSum || 0,
      
      // Calculated Fields (Formula-driven)
      totalRaise: (item.meritIncreaseAmount || 0) + (item.adjustmentIncreaseAmount || 0),
      totalIncrease: (item.meritIncreaseAmount || 0) + (item.adjustmentIncreaseAmount || 0) + (item.lumpSum || 0),
      finalSalaryRate: item.finalSalary || item.currentSalary || 0,
      finalSalary: item.totalPayIncludingLumpSum || item.finalSalary || 0,
      
      // Performance & Comments
      performanceRating: item.performanceRating,
      performanceRatingText: item.performanceRatingText,
      forceComments: item.forceComments || '',
      managerComments: item.managerComments || '',
      
      // Additional Info
      department: item.department || '',
      location: item.location || '',
      hireDate: item.hireDate || '',
      effectiveDate: item.effectiveDate || new Date().toISOString().split('T')[0],
      
      // Bonus & Stock
      bonusTarget: item.bonusTarget || 0,
      bonusActual: item.bonusActual || 0,
      stockGrant: item.stockGrant || 0,
      stockVested: item.stockVested || 0,
      equityValue: item.equityValue || 0,
      
      // Status
      status: item.status || 'DRAFT',
      lastModifiedBy: item.lastModifiedBy || userId,
      lastModifiedAt: item.lastModifiedAt || new Date().toISOString()
    })) || [];
    
    return {
      data: compensationData,
      total: compensationData.length,
      companyId: companyId,
      templateId: templateId || formId
    };
    
  } catch (error) {
    console.error('Error fetching compensation data:', error);
    req.error(500, `Failed to fetch compensation data: ${error.message}`);
  }
});
```

---

## 🎨 Frontend Integration

### Load Compensation Data

**File**: `app/webapp/controller/CompensationWorksheet.controller.js`

```javascript
onLoadCompensationData: function() {
    var oView = this.getView();
    var oModel = oView.getModel("compensation");
    var sCompanyId = oModel.getProperty("/companyId");
    var sUserId = oModel.getProperty("/userId");
    var sFormId = oModel.getProperty("/formId");
    
    oView.setBusy(true);
    
    $.ajax({
        url: "/compensation/CompensationService/getCompensationData",
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify({
            companyId: sCompanyId,
            userId: sUserId,
            formId: sFormId,
            templateId: sFormId // Use formId as templateId
        }),
        success: function(oResponse) {
            var aData = oResponse.data || [];
            
            // Populate worksheet
            oModel.setProperty("/CompensationWorksheet", aData);
            oModel.setProperty("/totalEmployees", aData.length);
            
            // Set effective date from first record
            if (aData.length > 0 && aData[0].effectiveDate) {
                oModel.setProperty("/effectiveDate", aData[0].effectiveDate);
            }
            
            MessageToast.show("Loaded " + aData.length + " employees from SuccessFactors");
            oView.setBusy(false);
        },
        error: function(oError) {
            console.error("Error loading compensation data:", oError);
            MessageBox.error("Failed to load compensation data from SuccessFactors");
            oView.setBusy(false);
        }
    });
}
```

---

## 🔐 RBP Control

### Field-Level Permissions

The API respects RBP permissions configured in SuccessFactors:

- **COMPENSATION_VIEW** - Can view compensation data
- **COMPENSATION_EDIT** - Can edit compensation fields
- **COMPENSATION_APPROVE** - Can approve compensation
- **COMPENSATION_FORMULA_CONFIG** - Can configure formulas

**Implementation**:
```javascript
// Check permission before loading
const rbpCheck = await rbpService.checkUserRBP(userId, companyId, 'COMPENSATION_VIEW');
if (!rbpCheck.hasPermission) {
    req.error(403, 'Access denied');
    return;
}
```

---

## 📝 Field Mapping

### Red Highlighted Fields (Read-only from SF)
- Employee Name
- Job Title
- Current Salary
- Currency
- Pay Grade
- Salary Range
- Compa-Ratio
- Range Penetration
- Performance Rating
- Hire Date

### Green Highlighted Fields (Editable)
- Merit (percentage or amount)
- Adjustment (percentage or amount)
- Lump Sum
- Manager Comments

### Calculated Fields (Formula-driven)
- Total Raise
- Total Increase
- Final Salary Rate
- Final Salary

---

## 🧪 Testing

### Test API Call

**In Browser Console (F12)**:
```javascript
$.ajax({
    url: "/compensation/CompensationService/getCompensationData",
    method: "POST",
    contentType: "application/json",
    data: JSON.stringify({
        companyId: "SFHUB003674",
        userId: "sfadmin",
        formId: "COMP_2024",
        templateId: "COMP_2024"
    }),
    success: function(response) {
        console.log("✅ Success:", response);
        console.log("Employees loaded:", response.data.length);
    },
    error: function(error) {
        console.error("❌ Error:", error);
    }
});
```

### Expected Response
```json
{
  "data": [
    {
      "employeeId": "EMP001",
      "employeeName": "John Doe",
      "jobTitle": "Software Engineer",
      "currentSalary": 100000,
      "currency": "USD",
      "merit": 3.0,
      "adjustment": 2.0,
      "lumpSum": 500,
      "totalRaise": 5000,
      "totalIncrease": 5500,
      "finalSalaryRate": 105500,
      "finalSalary": 105500,
      "performanceRating": 4,
      "performanceRatingText": "Outstanding"
    }
  ],
  "total": 1,
  "companyId": "SFHUB003674",
  "templateId": "COMP_2024"
}
```

---

## ✅ Summary

1. **API Endpoint**: `/employeeCompensations` (OData v2)
2. **Data Source**: SuccessFactors Compensation Worksheets
3. **Fields Available**: Salary, Bonus, Stock, Performance, Comments
4. **RBP Controlled**: All data access respects SuccessFactors RBP
5. **Read-only Fields**: Employee info, current salary, performance (from SF)
6. **Editable Fields**: Merit, Adjustment, Lump Sum (user can edit)
7. **Calculated Fields**: Total Raise, Total Increase, Final Salary (formula-driven)

**All data is properly extracted from SuccessFactors and ready for editing!** 🎉
