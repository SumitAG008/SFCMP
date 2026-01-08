# Compensation Data Persistence Strategy

## 🎯 Overview

This document explains how compensation data should be saved, where it's stored, and how it integrates with SuccessFactors and HANA database.

---

## 📊 Data Flow Architecture

```
┌─────────────────┐
│ SuccessFactors  │ ← Source of Truth (Employee Data, Base Salary)
│   (Read-Only)   │
└────────┬────────┘
         │ GET (Extract)
         ▼
┌─────────────────┐
│  BTP CAP App    │ ← Processing Layer (Formulas, Calculations)
│   (HANA DB)     │
└────────┬────────┘
         │ POST/PATCH (Save)
         ▼
┌─────────────────┐
│ SuccessFactors  │ ← Final Destination (Updated Compensation)
│  MDF Objects    │
└─────────────────┘
```

---

## 💾 Where to Save Data

### Strategy: **Hybrid Approach**

#### 1. **HANA Database (BTP)** - Staging & Processing
**Purpose:**
- ✅ Temporary storage during compensation cycle
- ✅ Formula calculations and validations
- ✅ Audit trail and change history
- ✅ Workflow state management
- ✅ Draft data before final approval

**What Gets Saved:**
- Compensation worksheet data (draft)
- Formula configurations
- Calculation results
- Workflow status
- User edits (merit, adjustments, lump sum)
- Audit logs

**When:**
- User clicks "Save" → Saves to HANA
- Real-time as user edits → Auto-save to HANA
- Before workflow approval → Stored in HANA

---

#### 2. **SuccessFactors MDF Objects** - Final Storage
**Purpose:**
- ✅ Master data storage (source of truth)
- ✅ Final approved compensation data
- ✅ Integration with SF payroll
- ✅ Reporting and analytics

**What Gets Saved:**
- Final approved compensation
- Employee salary updates
- Compensation history
- Performance ratings

**When:**
- After workflow approval → Sync to SuccessFactors
- After final approval → POST to SF MDF
- Periodic sync → Batch updates

---

## 🔄 Complete Data Flow

### Step 1: Load Data from SuccessFactors (Red Highlighted Area)

**Source:** SuccessFactors Employee Compensation API

```javascript
// In CompensationWorksheet.controller.js
onLoadFromSF: function() {
    var oModel = this.getView().getModel("compensation");
    var sCompanyId = oModel.getProperty("/companyId");
    var sUserId = oModel.getProperty("/userId");
    
    // Call backend to fetch from SuccessFactors
    $.ajax({
        url: "/compensation/CompensationService/getCompensationData",
        method: "GET",
        data: {
            companyId: sCompanyId,
            userId: sUserId,
            formId: oModel.getProperty("/formId")
        },
        success: function(oResponse) {
            // Populate red highlighted fields (read-only from SF)
            var aEmployees = oResponse.data || [];
            oModel.setProperty("/CompensationWorksheet", aEmployees);
            MessageToast.show("Data loaded from SuccessFactors");
        }
    });
}
```

**Backend Implementation:**

```javascript
// In srv/compensation-service.js
this.on('getCompensationData', async (req) => {
    const { companyId, userId, formId } = req.data;
    
    // Call SuccessFactors API
    const sfData = await callSFAPI(
        `/odata/v2/Employee_Compensation?$filter=companyId eq '${companyId}'`,
        'GET'
    );
    
    // Transform SF data to worksheet format
    const aWorksheet = sfData.d.results.map(emp => ({
        employeeId: emp.employeeId,
        employeeName: emp.fullName,
        jobTitle: emp.jobTitle,
        overallPerformance: emp.performanceRating,
        currentSalary: emp.baseSalary,
        currency: emp.currency,
        // Red fields (from SF - read-only)
        merit: 0, // Will be calculated/edited
        adjustment: 0,
        lumpSum: 0,
        // Calculated fields
        totalRaise: 0,
        totalIncrease: 0,
        finalSalaryRate: 0,
        finalSalary: 0
    }));
    
    return { data: aWorksheet };
});
```

---

### Step 2: User Edits (Green Highlighted Area)

**Fields Users Can Edit:**
- ✅ Merit (percentage or amount)
- ✅ Adjustment (amount)
- ✅ Lump Sum (amount)
- ✅ Overall Performance (if user has permission)

**RBP-Based Field Control:**

```javascript
// Check if user can edit specific field
onCheckFieldEditPermission: function(sFieldName, sEmployeeId) {
    var oModel = this.getView().getModel("compensation");
    var sUserId = oModel.getProperty("/userId");
    var sCompanyId = oModel.getProperty("/companyId");
    
    // Check RBP permission
    $.ajax({
        url: "/compensation/CompensationService/checkUserRBP",
        method: "POST",
        data: JSON.stringify({
            companyId: sCompanyId,
            userId: sUserId,
            permissionType: "COMPENSATION_EDIT",
            fieldName: sFieldName,
            employeeId: sEmployeeId
        }),
        success: function(oResponse) {
            return oResponse.hasPermission;
        }
    });
}
```

**Make Fields Editable Based on RBP:**

```xml
<!-- In CompensationWorksheet.view.xml -->
<Input 
    value="{compensation>merit}" 
    editable="{= ${compensation>canEditMerit} === true}"
    liveChange="onMeritChange"
    tooltip="Merit increase (RBP controlled)"/>
```

---

### Step 3: Formula Configuration (Header)

**Formula Template Configuration:**

```javascript
// Formula configuration in header
onConfigureFormula: function() {
    var oModel = this.getView().getModel("compensation");
    var oFormulaConfig = {
        templateId: oModel.getProperty("/formId"),
        formulas: {
            totalRaise: "merit + adjustment",
            totalIncrease: "(currentSalary * (merit / 100)) + adjustment + lumpSum",
            finalSalaryRate: "currentSalary + totalIncrease",
            finalSalary: "finalSalaryRate * 12" // Annual
        },
        configuredBy: oModel.getProperty("/userId"),
        configuredAt: new Date().toISOString()
    };
    
    // Save formula to HANA
    $.ajax({
        url: "/compensation/CompensationService/saveFormulaTemplate",
        method: "POST",
        data: JSON.stringify({
            companyId: oModel.getProperty("/companyId"),
            templateId: oModel.getProperty("/formId"),
            formula: oFormulaConfig
        }),
        success: function() {
            MessageToast.show("Formula template saved");
        }
    });
}
```

**Apply Formula to Cells:**

```javascript
// Calculate using formula
onCalculateCell: function(sFieldName, oRowData) {
    var oModel = this.getView().getModel("compensation");
    var oFormula = oModel.getProperty("/formulaTemplate/" + sFieldName);
    
    if (!oFormula) {
        return 0; // No formula defined
    }
    
    // Evaluate formula
    var sFormula = oFormula.expression;
    var sEvaluated = sFormula
        .replace(/merit/g, oRowData.merit || 0)
        .replace(/adjustment/g, oRowData.adjustment || 0)
        .replace(/lumpSum/g, oRowData.lumpSum || 0)
        .replace(/currentSalary/g, oRowData.currentSalary || 0);
    
    try {
        // Safe evaluation (use math.js or similar)
        return eval(sEvaluated);
    } catch (e) {
        console.error("Formula evaluation error:", e);
        return 0;
    }
}
```

---

### Step 4: Save to HANA Database

**Save Draft Data:**

```javascript
onSave: function() {
    var oView = this.getView();
    var oModel = oView.getModel("compensation");
    var aWorksheet = oModel.getProperty("/CompensationWorksheet") || [];
    var sCompanyId = oModel.getProperty("/companyId");
    var sUserId = oModel.getProperty("/userId");
    var sFormId = oModel.getProperty("/formId");
    
    // Calculate all formulas before saving
    aWorksheet.forEach(function(oRow) {
        oRow.totalRaise = this.onCalculateCell("totalRaise", oRow);
        oRow.totalIncrease = this.onCalculateCell("totalIncrease", oRow);
        oRow.finalSalaryRate = this.onCalculateCell("finalSalaryRate", oRow);
        oRow.finalSalary = this.onCalculateCell("finalSalary", oRow);
    }.bind(this));
    
    // Save to HANA
    $.ajax({
        url: "/compensation/CompensationService/saveCompensationData",
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify({
            companyId: sCompanyId,
            userId: sUserId,
            formId: sFormId,
            data: aWorksheet,
            status: "DRAFT"
        }),
        success: function() {
            MessageToast.show("Data saved to database");
        }
    });
}
```

**Backend - Save to HANA:**

```javascript
// In srv/compensation-service.js
this.on('saveCompensationData', async (req) => {
    const { companyId, userId, formId, data, status } = req.data;
    
    // Save to HANA database
    const db = cds.db;
    
    for (const row of data) {
        await db.run(
            INSERT.into('CompensationWorksheet').entries({
                companyId: companyId,
                userId: userId,
                formId: formId,
                employeeId: row.employeeId,
                employeeName: row.employeeName,
                jobTitle: row.jobTitle,
                currentSalary: row.currentSalary,
                currency: row.currency,
                merit: row.merit,
                adjustment: row.adjustment,
                lumpSum: row.lumpSum,
                totalRaise: row.totalRaise,
                totalIncrease: row.totalIncrease,
                finalSalaryRate: row.finalSalaryRate,
                finalSalary: row.finalSalary,
                status: status,
                lastModifiedBy: userId,
                lastModifiedAt: new Date()
            })
        );
    }
    
    return { success: true, saved: data.length };
});
```

---

### Step 5: Sync to SuccessFactors (After Approval)

**After Workflow Approval:**

```javascript
onSyncToSuccessFactors: function() {
    var oModel = this.getView().getModel("compensation");
    var aWorksheet = oModel.getProperty("/CompensationWorksheet") || [];
    var sCompanyId = oModel.getProperty("/companyId");
    var sFormId = oModel.getProperty("/formId");
    
    // Sync approved data to SuccessFactors
    $.ajax({
        url: "/compensation/CompensationService/saveToMDFObject",
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify({
            companyId: sCompanyId,
            data: aWorksheet.filter(row => row.status === "APPROVED")
        }),
        success: function() {
            MessageToast.show("Data synced to SuccessFactors");
        }
    });
}
```

**Backend - Save to SF MDF:**

```javascript
// In srv/compensation-service.js
this.on('saveToMDFObject', async (req) => {
    const { companyId, data } = req.data;
    
    // Save to SuccessFactors MDF Object
    for (const row of data) {
        const mdfPayload = {
            externalCode: row.employeeId + "_" + new Date().getFullYear(),
            employeeId: row.employeeId,
            baseSalary: row.finalSalaryRate,
            currency: row.currency,
            effectiveDate: row.effectiveDate,
            meritIncrease: row.merit,
            adjustment: row.adjustment,
            lumpSum: row.lumpSum,
            totalIncrease: row.totalIncrease
        };
        
        await callSFAPI(
            `/odata/v2/CompensationData`,
            'POST',
            mdfPayload
        );
    }
    
    return { success: true, synced: data.length };
});
```

---

## 🔐 RBP-Based Field Control

### Field-Level Permissions

**Permission Types:**
- `COMPENSATION_VIEW` - Can view compensation data
- `COMPENSATION_EDIT_MERIT` - Can edit merit field
- `COMPENSATION_EDIT_ADJUSTMENT` - Can edit adjustment field
- `COMPENSATION_EDIT_LUMP_SUM` - Can edit lump sum field
- `COMPENSATION_FORMULA_CONFIG` - Can configure formulas
- `COMPENSATION_APPROVE` - Can approve compensation

**Implementation:**

```javascript
// Check field edit permission
onCheckFieldPermission: function(sFieldName) {
    var oModel = this.getView().getModel("compensation");
    var sUserId = oModel.getProperty("/userId");
    var sCompanyId = oModel.getProperty("/companyId");
    
    return new Promise(function(resolve) {
        $.ajax({
            url: "/compensation/CompensationService/checkUserRBP",
            method: "POST",
            data: JSON.stringify({
                companyId: sCompanyId,
                userId: sUserId,
                permissionType: "COMPENSATION_EDIT_" + sFieldName.toUpperCase()
            }),
            success: function(oResponse) {
                resolve(oResponse.hasPermission);
            }
        });
    });
}
```

**Apply to UI:**

```xml
<Input 
    value="{compensation>merit}" 
    editable="{compensation>canEditMerit}"
    visible="{compensation>canViewMerit}"/>
```

---

## 📐 Formula Management

### Formula Template Structure

```json
{
  "templateId": "COMP_2024",
  "companyId": "SFHUB003674",
  "formulas": {
    "totalRaise": {
      "expression": "merit + adjustment",
      "description": "Total raise amount",
      "configuredBy": "user123",
      "configuredAt": "2024-01-08T10:00:00Z"
    },
    "totalIncrease": {
      "expression": "(currentSalary * (merit / 100)) + adjustment + lumpSum",
      "description": "Total increase in currency",
      "configuredBy": "user123"
    },
    "finalSalaryRate": {
      "expression": "currentSalary + totalIncrease",
      "description": "Final monthly salary"
    },
    "finalSalary": {
      "expression": "finalSalaryRate * 12",
      "description": "Annual salary"
    }
  },
  "rbpControl": {
    "canViewFormula": ["COMPENSATION_VIEW"],
    "canEditFormula": ["COMPENSATION_FORMULA_CONFIG"],
    "canUseFormula": ["COMPENSATION_EDIT_MERIT"]
  }
}
```

### Formula Configuration UI

**In Header (Process Owner Only):**

```xml
<Button 
    text="Configure Formula" 
    icon="sap-icon://formula"
    press="onConfigureFormula"
    visible="{compensation>/canConfigureFormula}"/>
```

**Formula Dialog:**

```javascript
onConfigureFormula: function() {
    // Open formula configuration dialog
    // Only visible to users with COMPENSATION_FORMULA_CONFIG permission
    if (!this.onCheckFieldPermission("FORMULA_CONFIG")) {
        MessageBox.warning("You don't have permission to configure formulas");
        return;
    }
    
    // Open dialog with formula editor
    this._openFormulaConfigDialog();
}
```

---

## ✅ Summary

### Data Storage Strategy:

1. **HANA Database:**
   - ✅ Draft compensation data
   - ✅ Formula configurations
   - ✅ Workflow state
   - ✅ Audit trail
   - ✅ User edits

2. **SuccessFactors:**
   - ✅ Source data (read-only)
   - ✅ Final approved compensation
   - ✅ MDF objects for payroll

### Data Flow:

1. **Load:** SuccessFactors → BTP (Red fields)
2. **Edit:** User edits (Green fields) → HANA
3. **Calculate:** Formulas applied → HANA
4. **Save:** Draft saved → HANA
5. **Approve:** Workflow approval → HANA
6. **Sync:** Approved data → SuccessFactors MDF

### RBP Control:

- ✅ Field-level permissions
- ✅ Formula configuration permissions
- ✅ View/edit restrictions
- ✅ Role-based field visibility

**All data is properly controlled and synced!** 🎉
