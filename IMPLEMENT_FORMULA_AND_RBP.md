# Implementation Guide: Formulas and RBP Controls

## 🎯 Quick Implementation Steps

### Step 1: Fix Save Workflow Error (Already Fixed)
✅ Removed `bindContext().execute()` - using AJAX instead

### Step 2: Add Formula Configuration

**Add to CompensationWorksheet.controller.js:**

```javascript
onConfigureFormula: function() {
    var oView = this.getView();
    var oModel = oView.getModel("compensation");
    
    // Check RBP permission
    var sUserId = oModel.getProperty("/userId");
    var sCompanyId = oModel.getProperty("/companyId");
    
    $.ajax({
        url: "/compensation/CompensationService/checkUserRBP",
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify({
            companyId: sCompanyId,
            userId: sUserId,
            permissionType: "COMPENSATION_FORMULA_CONFIG"
        }),
        success: function(oResponse) {
            if (oResponse.hasPermission) {
                // Open formula configuration dialog
                oView.byId("formulaConfigDialog").open();
            } else {
                MessageBox.warning("You don't have permission to configure formulas");
            }
        }
    });
}
```

### Step 3: Add Formula Calculation

```javascript
onCalculateFormulas: function() {
    var oModel = this.getView().getModel("compensation");
    var aWorksheet = oModel.getProperty("/CompensationWorksheet") || [];
    var oFormulaTemplate = oModel.getProperty("/formulaTemplate") || {};
    
    aWorksheet.forEach(function(oRow) {
        // Calculate totalRaise
        if (oFormulaTemplate.totalRaise) {
            oRow.totalRaise = this._evaluateFormula(
                oFormulaTemplate.totalRaise.expression,
                oRow
            );
        }
        
        // Calculate totalIncrease
        if (oFormulaTemplate.totalIncrease) {
            oRow.totalIncrease = this._evaluateFormula(
                oFormulaTemplate.totalIncrease.expression,
                oRow
            );
        }
        
        // Calculate finalSalaryRate
        if (oFormulaTemplate.finalSalaryRate) {
            oRow.finalSalaryRate = this._evaluateFormula(
                oFormulaTemplate.finalSalaryRate.expression,
                oRow
            );
        }
        
        // Calculate finalSalary
        if (oFormulaTemplate.finalSalary) {
            oRow.finalSalary = this._evaluateFormula(
                oFormulaTemplate.finalSalary.expression,
                oRow
            );
        }
    }.bind(this));
    
    oModel.setProperty("/CompensationWorksheet", aWorksheet);
    MessageToast.show("Formulas calculated");
},

_evaluateFormula: function(sExpression, oRowData) {
    try {
        // Replace variables with actual values
        var sEvaluated = sExpression
            .replace(/merit/g, oRowData.merit || 0)
            .replace(/adjustment/g, oRowData.adjustment || 0)
            .replace(/lumpSum/g, oRowData.lumpSum || 0)
            .replace(/currentSalary/g, oRowData.currentSalary || 0)
            .replace(/totalRaise/g, oRowData.totalRaise || 0)
            .replace(/totalIncrease/g, oRowData.totalIncrease || 0)
            .replace(/finalSalaryRate/g, oRowData.finalSalaryRate || 0);
        
        // Use Function constructor for safe evaluation
        return new Function('return ' + sEvaluated)();
    } catch (e) {
        console.error("Formula evaluation error:", e, sExpression);
        return 0;
    }
}
```

### Step 4: Add RBP Field Control

```javascript
onCheckFieldEditPermission: function(sFieldName, sEmployeeId) {
    var oModel = this.getView().getModel("compensation");
    var sUserId = oModel.getProperty("/userId");
    var sCompanyId = oModel.getProperty("/companyId");
    
    return new Promise(function(resolve, reject) {
        $.ajax({
            url: "/compensation/CompensationService/checkUserRBP",
            method: "POST",
            contentType: "application/json",
            data: JSON.stringify({
                companyId: sCompanyId,
                userId: sUserId,
                permissionType: "COMPENSATION_EDIT_" + sFieldName.toUpperCase(),
                employeeId: sEmployeeId
            }),
            success: function(oResponse) {
                resolve(oResponse.hasPermission);
            },
            error: function() {
                resolve(false);
            }
        });
    });
},

onInitFieldPermissions: function() {
    var oModel = this.getView().getModel("compensation");
    var aWorksheet = oModel.getProperty("/CompensationWorksheet") || [];
    var sUserId = oModel.getProperty("/userId");
    
    // Check permissions for each field
    var aPromises = [];
    
    aPromises.push(this.onCheckFieldEditPermission("MERIT", null));
    aPromises.push(this.onCheckFieldEditPermission("ADJUSTMENT", null));
    aPromises.push(this.onCheckFieldEditPermission("LUMP_SUM", null));
    aPromises.push(this.onCheckFieldEditPermission("FORMULA_CONFIG", null));
    
    Promise.all(aPromises).then(function(aResults) {
        oModel.setProperty("/canEditMerit", aResults[0]);
        oModel.setProperty("/canEditAdjustment", aResults[1]);
        oModel.setProperty("/canEditLumpSum", aResults[2]);
        oModel.setProperty("/canConfigureFormula", aResults[3]);
        
        // Update worksheet rows
        aWorksheet.forEach(function(oRow) {
            oRow.canEditMerit = aResults[0];
            oRow.canEditAdjustment = aResults[1];
            oRow.canEditLumpSum = aResults[2];
        });
        
        oModel.setProperty("/CompensationWorksheet", aWorksheet);
    }.bind(this));
}
```

### Step 5: Update View with RBP Controls

**In CompensationWorksheet.view.xml:**

```xml
<!-- Add Formula Config Button (Header) -->
<Button 
    text="Configure Formula" 
    icon="sap-icon://formula"
    press="onConfigureFormula"
    visible="{compensation>/canConfigureFormula}"
    type="Transparent"/>

<!-- Make fields editable based on RBP -->
<Input 
    value="{compensation>merit}" 
    editable="{compensation>canEditMerit}"
    liveChange="onMeritChange"
    tooltip="Merit increase (RBP controlled)"/>

<Input 
    value="{compensation>adjustment}" 
    editable="{compensation>canEditAdjustment}"
    liveChange="onAdjustmentChange"/>

<Input 
    value="{compensation>lumpSum}" 
    editable="{compensation>canEditLumpSum}"
    liveChange="onLumpSumChange"/>

<!-- Calculated fields (read-only, formula-driven) -->
<Text 
    text="{compensation>totalRaise}"
    tooltip="Calculated: {compensation>/formulaTemplate/totalRaise/expression}"/>

<Text 
    text="{compensation>totalIncrease}"
    tooltip="Calculated: {compensation>/formulaTemplate/totalIncrease/expression}"/>

<Text 
    text="{compensation>finalSalaryRate}"
    tooltip="Calculated: {compensation>/formulaTemplate/finalSalaryRate/expression}"/>

<Text 
    text="{compensation>finalSalary}"
    tooltip="Calculated: {compensation>/formulaTemplate/finalSalary/expression}"/>
```

---

## 📋 Complete Implementation Checklist

- [ ] Fix save workflow error (bindContext issue)
- [ ] Add formula configuration dialog
- [ ] Add formula calculation logic
- [ ] Add RBP permission checks
- [ ] Update view with RBP-controlled fields
- [ ] Add formula template save to HANA
- [ ] Add formula template load from HANA
- [ ] Add SuccessFactors data load
- [ ] Add HANA database save
- [ ] Add SuccessFactors sync after approval

---

## 🚀 Next Steps

1. **Pull latest changes:**
   ```bash
   git pull origin main
   ```

2. **Implement formula configuration UI**

3. **Add RBP permission checks**

4. **Test with different user roles**

**See `COMPENSATION_DATA_PERSISTENCE_STRATEGY.md` for complete architecture!**
