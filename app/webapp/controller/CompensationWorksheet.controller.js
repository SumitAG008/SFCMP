sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/m/MessageToast"
], function (Controller, JSONModel, MessageBox, MessageToast) {
    "use strict";

    return Controller.extend("com.sap.sf.compensation.controller.CompensationWorksheet", {
        onInit: function () {
            // Get URL parameters (for SuccessFactors integration)
            var oUriParams = new URLSearchParams(window.location.search);
            var sCompanyId = oUriParams.get('companyId') || oUriParams.get('bplte_company') || "SFHUB003674";
            var sUserId = oUriParams.get('userId') || oUriParams.get('user') || "";
            var sFormId = oUriParams.get('formId') || oUriParams.get('form') || "";
            var sEffectiveDate = oUriParams.get('effectiveDate') || "";
            
            // Get or initialize compensation model
            var oView = this.getView();
            var oModel = oView.getModel("compensation");
            
            if (!oModel) {
                oModel = new JSONModel({
                    companyId: sCompanyId,
                    userId: sUserId,
                    formId: sFormId,
                    effectiveDate: sEffectiveDate,
                    totalEmployees: 0,
                    CompensationWorksheet: []
                });
                oView.setModel(oModel, "compensation");
            } else {
                // Update with URL parameters
                oModel.setProperty("/companyId", sCompanyId);
                if (sUserId) oModel.setProperty("/userId", sUserId);
                if (sFormId) oModel.setProperty("/formId", sFormId);
                if (sEffectiveDate) oModel.setProperty("/effectiveDate", sEffectiveDate);
            }
            
            // Ensure default values are set
            if (!oModel.getProperty("/companyId")) {
                oModel.setProperty("/companyId", "SFHUB003674");
            }
            
            // Auto-load data if userId provided from URL
            if (sUserId) {
                setTimeout(function() {
                    console.log("Auto-loading data for user:", sUserId);
                    this.onRefresh();
                }.bind(this), 1000);
            } else {
                // Focus on User ID field if empty
                setTimeout(function() {
                    var oUserIdInput = oView.byId("userId");
                    if (oUserIdInput && !oModel.getProperty("/userId")) {
                        oUserIdInput.focus();
                    }
                }, 500);
            }
        },

        onRefresh: function () {
            var oView = this.getView();
            var oModel = oView.getModel("compensation");
            var sCompanyId = oModel.getProperty("/companyId");
            var sUserId = oModel.getProperty("/userId");

            if (!sCompanyId || !sUserId) {
                MessageBox.warning("Please enter Company ID and User ID");
                return;
            }

            // Show busy indicator
            oView.setBusy(true);

            // First check RBP permissions
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
                        MessageBox.error("Access Denied: " + rbpResult.message + "\n\nRequired Role: " + rbpResult.role);
                        oView.setBusy(false);
                        return;
                    }

                    // RBP check passed, now get employee data
                    var sEmployeeUrl = "/compensation/CompensationService/getEmployeeDataByRBP";
                    var oEmployeePayload = {
                        companyId: sCompanyId,
                        userId: sUserId
                    };

                    $.ajax({
                        url: sEmployeeUrl,
                        method: "POST",
                        contentType: "application/json",
                        data: JSON.stringify(oEmployeePayload),
                        success: function (employeeData) {
                            console.log("Employee data from SuccessFactors:", employeeData);
                            // Store employee data for reference
                            oModel.setProperty("/availableEmployees", employeeData);
                        },
                        error: function (error) {
                            console.warn("Could not load employee data:", error);
                        }
                    });

                    // Now get compensation data
                    var sServiceUrl = "/compensation/CompensationService/getCompensationData";
                    var oPayload = {
                        companyId: sCompanyId,
                        userId: sUserId
                    };

                    $.ajax({
                        url: sServiceUrl,
                        method: "POST",
                        contentType: "application/json",
                        data: JSON.stringify(oPayload),
                        success: function (data) {
                            oModel.setProperty("/CompensationWorksheet", data || []);
                            MessageToast.show("Data loaded successfully (RBP: " + rbpResult.permissionType + ")");
                            oView.setBusy(false);
                        },
                        error: function (error) {
                            console.error("Error loading data:", error);
                            var sErrorMsg = error.responseJSON?.error?.message || error.statusText;
                            if (error.status === 403) {
                                MessageBox.error("Access Denied: " + sErrorMsg);
                            } else {
                                MessageBox.error("Failed to load compensation data: " + sErrorMsg);
                            }
                            oView.setBusy(false);
                        }
                    });
                },
                error: function (error) {
                    console.error("Error checking RBP:", error);
                    MessageBox.error("Failed to verify permissions: " + (error.responseJSON?.error?.message || error.statusText));
                    oView.setBusy(false);
                }
            });
        },

        onSave: function () {
            var oView = this.getView();
            var oModel = oView.getModel("compensation");
            var aData = oModel.getProperty("/CompensationWorksheet");
            var sCompanyId = oModel.getProperty("/companyId");
            var sUserId = oModel.getProperty("/userId");

            if (!sCompanyId || !sUserId) {
                MessageBox.warning("Please enter Company ID and User ID");
                return;
            }

            // Check RBP edit permission before saving
            var sRBPUrl = "/compensation/CompensationService/checkUserRBP";
            var oRBPPayload = {
                companyId: sCompanyId,
                userId: sUserId,
                permission: "COMPENSATION_EDIT"
            };

            oView.setBusy(true);

            $.ajax({
                url: sRBPUrl,
                method: "POST",
                contentType: "application/json",
                data: JSON.stringify(oRBPPayload),
                success: function (rbpResult) {
                    if (!rbpResult.hasPermission) {
                        MessageBox.error("Access Denied: " + rbpResult.message + "\n\nRequired Role: " + rbpResult.role);
                        oView.setBusy(false);
                        return;
                    }

                    // RBP check passed, proceed with save
                    if (!aData || aData.length === 0) {
                        MessageBox.warning("No data to save");
                        oView.setBusy(false);
                        return;
                    }

                    // Call UPDATE API
                    var sServiceUrl = "/compensation/CompensationService/updateCompensationData";
                    var oPayload = {
                        companyId: sCompanyId,
                        userId: sUserId,
                        data: aData
                    };

                    $.ajax({
                        url: sServiceUrl,
                        method: "POST",
                        contentType: "application/json",
                        data: JSON.stringify(oPayload),
                        success: function (response) {
                            MessageToast.show("Data saved successfully (RBP: " + rbpResult.permissionType + ")");
                            oView.setBusy(false);
                        },
                        error: function (error) {
                            console.error("Error saving data:", error);
                            var sErrorMsg = error.responseJSON?.error?.message || error.statusText;
                            if (error.status === 403) {
                                MessageBox.error("Access Denied: " + sErrorMsg);
                            } else {
                                MessageBox.error("Failed to save compensation data: " + sErrorMsg);
                            }
                            oView.setBusy(false);
                        }
                    });
                },
                error: function (error) {
                    console.error("Error checking RBP:", error);
                    MessageBox.error("Failed to verify permissions: " + (error.responseJSON?.error?.message || error.statusText));
                    oView.setBusy(false);
                }
            });
        },

        onAddRow: function () {
            var oModel = this.getView().getModel("compensation");
            var aData = oModel.getProperty("/CompensationWorksheet") || [];
            
            var oNewRow = {
                id: this._generateUUID(),
                companyId: oModel.getProperty("/companyId"),
                userId: oModel.getProperty("/userId"),
                formId: oModel.getProperty("/formId"),
                employeeId: "",
                employeeName: "",
                position: "",
                department: "",
                currentSalary: 0,
                proposedSalary: 0,
                meritIncrease: 0,
                promotionIncrease: 0,
                adjustmentIncrease: 0,
                totalIncrease: 0,
                newSalary: 0,
                currency: "USD",
                effectiveDate: new Date().toISOString().split('T')[0],
                status: "Draft",
                comments: "",
                lastModified: new Date().toISOString(),
                lastModifiedBy: oModel.getProperty("/userId")
            };

            aData.push(oNewRow);
            oModel.setProperty("/CompensationWorksheet", aData);
        },

        onDeleteRow: function () {
            var oTable = this.byId("compensationTable");
            var aSelectedIndices = oTable.getSelectedIndices();
            
            if (aSelectedIndices.length === 0) {
                MessageBox.warning("Please select rows to delete");
                return;
            }

            MessageBox.confirm("Are you sure you want to delete the selected rows?", {
                actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                onClose: function (sAction) {
                    if (sAction === MessageBox.Action.YES) {
                        var oModel = this.getView().getModel("compensation");
                        var aData = oModel.getProperty("/CompensationWorksheet") || [];
                        
                        // Sort indices in descending order to avoid index shifting issues
                        aSelectedIndices.sort(function(a, b) { return b - a; });
                        
                        aSelectedIndices.forEach(function(iIndex) {
                            aData.splice(iIndex, 1);
                        });
                        
                        oModel.setProperty("/CompensationWorksheet", aData);
                        MessageToast.show("Rows deleted successfully");
                    }
                }.bind(this)
            });
        },

        onCalculateTotal: function (oEvent) {
            var oModel = this.getView().getModel("compensation");
            var sPath = oEvent.getSource().getBindingContext("compensation").getPath();
            var oRow = oModel.getProperty(sPath);
            
            var fCurrentSalary = parseFloat(oRow.currentSalary) || 0;
            var fMeritPercent = parseFloat(oRow.meritIncrease) || 0;
            var fMeritAmount = parseFloat(oRow.meritIncreaseAmount) || 0;
            var fAdjustmentPercent = parseFloat(oRow.adjustmentIncrease) || 0;
            var fAdjustmentAmount = parseFloat(oRow.adjustmentIncreaseAmount) || 0;
            var fLumpSum = parseFloat(oRow.lumpSumAmount) || 0;
            
            // Calculate merit amount from percent if amount is not set
            if (fMeritPercent > 0 && fMeritAmount === 0 && fCurrentSalary > 0) {
                fMeritAmount = fCurrentSalary * (fMeritPercent / 100);
                oModel.setProperty(sPath + "/meritIncreaseAmount", fMeritAmount.toFixed(2));
            }
            
            // Calculate merit percent from amount if percent is not set
            if (fMeritAmount > 0 && fMeritPercent === 0 && fCurrentSalary > 0) {
                fMeritPercent = (fMeritAmount / fCurrentSalary) * 100;
                oModel.setProperty(sPath + "/meritIncrease", fMeritPercent.toFixed(2));
            }
            
            // Calculate adjustment amount from percent if amount is not set
            if (fAdjustmentPercent > 0 && fAdjustmentAmount === 0 && fCurrentSalary > 0) {
                fAdjustmentAmount = fCurrentSalary * (fAdjustmentPercent / 100);
                oModel.setProperty(sPath + "/adjustmentIncreaseAmount", fAdjustmentAmount.toFixed(2));
            }
            
            // Calculate adjustment percent from amount if percent is not set
            if (fAdjustmentAmount > 0 && fAdjustmentPercent === 0 && fCurrentSalary > 0) {
                fAdjustmentPercent = (fAdjustmentAmount / fCurrentSalary) * 100;
                oModel.setProperty(sPath + "/adjustmentIncrease", fAdjustmentPercent.toFixed(2));
            }
            
            // Calculate total raise (merit + adjustment)
            var fTotalRaise = fMeritAmount + fAdjustmentAmount;
            var fTotalIncreaseAmount = fTotalRaise + fLumpSum;
            var fTotalIncreasePercent = fMeritPercent + fAdjustmentPercent;
            
            // Calculate final salary
            var fFinalSalary = fCurrentSalary + fTotalRaise;
            var fFinalSalaryRate = fFinalSalary / 12; // Monthly rate
            var fTotalPayIncludingLumpSum = fFinalSalary + fLumpSum;
            
            // Update all calculated fields
            oModel.setProperty(sPath + "/totalRaise", fTotalRaise.toFixed(2));
            oModel.setProperty(sPath + "/totalIncreaseAmount", fTotalIncreaseAmount.toFixed(2));
            oModel.setProperty(sPath + "/totalIncrease", fTotalIncreasePercent.toFixed(2));
            oModel.setProperty(sPath + "/finalSalary", fFinalSalary.toFixed(2));
            oModel.setProperty(sPath + "/newSalary", fFinalSalary.toFixed(2));
            oModel.setProperty(sPath + "/proposedSalary", fFinalSalary.toFixed(2));
            oModel.setProperty(sPath + "/finalSalaryRate", fFinalSalaryRate.toFixed(2));
            oModel.setProperty(sPath + "/totalPayIncludingLumpSum", fTotalPayIncludingLumpSum.toFixed(2));
            oModel.setProperty(sPath + "/totalPay", fTotalPayIncludingLumpSum.toFixed(2));
        },

        onCalculateFromFinal: function (oEvent) {
            var oModel = this.getView().getModel("compensation");
            var sPath = oEvent.getSource().getBindingContext("compensation").getPath();
            var oRow = oModel.getProperty(sPath);
            
            var fFinalSalary = parseFloat(oRow.finalSalary) || 0;
            var fCurrentSalary = parseFloat(oRow.currentSalary) || 0;
            var fLumpSum = parseFloat(oRow.lumpSumAmount) || 0;
            
            if (fCurrentSalary > 0) {
                var fTotalRaise = fFinalSalary - fCurrentSalary;
                var fTotalIncreasePercent = (fTotalRaise / fCurrentSalary) * 100;
                var fTotalIncreaseAmount = fTotalRaise + fLumpSum;
                var fFinalSalaryRate = fFinalSalary / 12;
                var fTotalPayIncludingLumpSum = fFinalSalary + fLumpSum;
                
                oModel.setProperty(sPath + "/totalRaise", fTotalRaise.toFixed(2));
                oModel.setProperty(sPath + "/totalIncrease", fTotalIncreasePercent.toFixed(2));
                oModel.setProperty(sPath + "/totalIncreaseAmount", fTotalIncreaseAmount.toFixed(2));
                oModel.setProperty(sPath + "/newSalary", fFinalSalary.toFixed(2));
                oModel.setProperty(sPath + "/proposedSalary", fFinalSalary.toFixed(2));
                oModel.setProperty(sPath + "/finalSalaryRate", fFinalSalaryRate.toFixed(2));
                oModel.setProperty(sPath + "/totalPayIncludingLumpSum", fTotalPayIncludingLumpSum.toFixed(2));
                oModel.setProperty(sPath + "/totalPay", fTotalPayIncludingLumpSum.toFixed(2));
            }
        },
        
        onShowBudgets: function () {
            MessageBox.information("Budget information will be displayed here");
        },
        
        onShowWorkflowBuilder: function () {
            var oView = this.getView();
            var oModel = oView.getModel("compensation");
            var sCompanyId = oModel.getProperty("/companyId");
            var sFormId = oModel.getProperty("/formId");

            // Navigate to workflow builder
            var sBuilderUrl = "/app/workflow-builder.html?companyId=" + encodeURIComponent(sCompanyId) + 
                              "&formId=" + encodeURIComponent(sFormId);
            window.open(sBuilderUrl, "_blank");
        },
        
        onShowApprovals: function () {
            var oView = this.getView();
            var oModel = oView.getModel("compensation");
            var sCompanyId = oModel.getProperty("/companyId");
            var sUserId = oModel.getProperty("/userId");
            var sFormId = oModel.getProperty("/formId");

            // Navigate to workflow visualization page
            var sWorkflowUrl = "/app/workflow.html?companyId=" + encodeURIComponent(sCompanyId) + 
                              "&userId=" + encodeURIComponent(sUserId) + 
                              "&formId=" + encodeURIComponent(sFormId);
            window.location.href = sWorkflowUrl;
        },
        
        onExport: function () {
            MessageBox.information("Export to Excel functionality will be implemented");
        },

        _generateUUID: function () {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                var r = Math.random() * 16 | 0;
                var v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        }
    });
});
