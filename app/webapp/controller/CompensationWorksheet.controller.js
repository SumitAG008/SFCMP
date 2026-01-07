sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/m/MessageToast"
], function (Controller, JSONModel, MessageBox, MessageToast) {
    "use strict";

    return Controller.extend("com.sap.sf.compensation.controller.CompensationWorksheet", {
        onInit: function () {
            // Initialize default values
            var oModel = this.getView().getModel("compensation");
            if (!oModel) {
                oModel = new JSONModel({
                    companyId: "SFHUB003674",
                    userId: "",
                    formId: "",
                    CompensationWorksheet: []
                });
                this.getView().setModel(oModel, "compensation");
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

            // Call GET API
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
                    MessageToast.show("Data loaded successfully");
                    oView.setBusy(false);
                },
                error: function (error) {
                    console.error("Error loading data:", error);
                    MessageBox.error("Failed to load compensation data: " + (error.responseJSON?.error?.message || error.statusText));
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

            if (!aData || aData.length === 0) {
                MessageBox.warning("No data to save");
                return;
            }

            // Show busy indicator
            oView.setBusy(true);

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
                    MessageToast.show("Data saved successfully");
                    oView.setBusy(false);
                },
                error: function (error) {
                    console.error("Error saving data:", error);
                    MessageBox.error("Failed to save compensation data: " + (error.responseJSON?.error?.message || error.statusText));
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
            
            var fMerit = parseFloat(oRow.meritIncrease) || 0;
            var fPromotion = parseFloat(oRow.promotionIncrease) || 0;
            var fAdjustment = parseFloat(oRow.adjustmentIncrease) || 0;
            var fCurrentSalary = parseFloat(oRow.currentSalary) || 0;
            
            var fTotalIncrease = fMerit + fPromotion + fAdjustment;
            var fNewSalary = fCurrentSalary * (1 + fTotalIncrease / 100);
            
            oModel.setProperty(sPath + "/totalIncrease", fTotalIncrease.toFixed(2));
            oModel.setProperty(sPath + "/newSalary", fNewSalary.toFixed(2));
            oModel.setProperty(sPath + "/proposedSalary", fNewSalary.toFixed(2));
        },

        onCalculateFromProposed: function (oEvent) {
            var oModel = this.getView().getModel("compensation");
            var sPath = oEvent.getSource().getBindingContext("compensation").getPath();
            var oRow = oModel.getProperty(sPath);
            
            var fProposedSalary = parseFloat(oRow.proposedSalary) || 0;
            var fCurrentSalary = parseFloat(oRow.currentSalary) || 0;
            
            if (fCurrentSalary > 0) {
                var fTotalIncrease = ((fProposedSalary - fCurrentSalary) / fCurrentSalary) * 100;
                oModel.setProperty(sPath + "/totalIncrease", fTotalIncrease.toFixed(2));
                oModel.setProperty(sPath + "/newSalary", fProposedSalary.toFixed(2));
            }
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
