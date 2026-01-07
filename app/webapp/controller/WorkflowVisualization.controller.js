sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/m/MessageToast"
], function (Controller, JSONModel, MessageBox, MessageToast) {
    "use strict";

    return Controller.extend("com.sap.sf.compensation.controller.WorkflowVisualization", {
        onInit: function () {
            // Get URL parameters
            var oUriParams = new URLSearchParams(window.location.search);
            var sCompanyId = oUriParams.get('companyId') || "SFHUB003674";
            var sUserId = oUriParams.get('userId') || "";
            var sFormId = oUriParams.get('formId') || "";

            // Initialize workflow model with empty data - will be loaded from backend
            var oWorkflowModel = new JSONModel({
                companyId: sCompanyId,
                userId: sUserId,
                formId: sFormId,
                workflowName: "",
                overallStatus: "Loading...",
                statusState: "None",
                statusIcon: "sap-icon://pending",
                currentStep: "",
                initiatedBy: sUserId || "System",
                initiatedDate: "",
                steps: [],
                employees: []
            });

            this.getView().setModel(oWorkflowModel, "workflow");

            // Load real-time workflow data from backend
            this.loadWorkflowData();
        },

        onNavBack: function () {
            // Navigate back to compensation worksheet using UI5 router
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.navTo("compensation");
        },

        loadWorkflowData: function () {
            var oView = this.getView();
            var oModel = oView.getModel("workflow");
            var sCompanyId = oModel.getProperty("/companyId");
            var sFormId = oModel.getProperty("/formId");

            if (!sFormId) {
                MessageBox.warning("Form ID is required to load workflow status");
                return;
            }

            // Show busy indicator
            oView.setBusy(true);

            // Call workflow API to get real-time workflow status
            var sServiceUrl = "/compensation/CompensationService/getWorkflowStatus";
            var oPayload = {
                companyId: sCompanyId,
                formId: sFormId
            };

            $.ajax({
                url: sServiceUrl,
                method: "POST",
                contentType: "application/json",
                data: JSON.stringify(oPayload),
                success: function (data) {
                    if (data) {
                        // Update model with real-time workflow data
                        oModel.setProperty("/", data);
                        MessageToast.show("Workflow data loaded successfully");
                    } else {
                        MessageBox.warning("No workflow data found for this form");
                    }
                    oView.setBusy(false);
                },
                error: function (error) {
                    console.error("Error loading workflow:", error);
                    var sErrorMsg = error.responseJSON?.error?.message || error.statusText || "Unknown error";
                    MessageBox.error("Failed to load workflow status: " + sErrorMsg);
                    oView.setBusy(false);
                }
            });
        },
        
        onApproveStep: function (oEvent) {
            var oStep = oEvent.getSource().getBindingContext("workflow").getObject();
            MessageBox.confirm("Approve step: " + oStep.stepName + "?", {
                title: "Approve Step",
                actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                onClose: function (sAction) {
                    if (sAction === MessageBox.Action.YES) {
                        // TODO: Call backend API to approve step
                        MessageToast.show("Step approved (integration pending)");
                        // Refresh workflow data
                        this.loadWorkflowData();
                    }
                }.bind(this)
            });
        },
        
        onRejectStep: function (oEvent) {
            var oStep = oEvent.getSource().getBindingContext("workflow").getObject();
            MessageBox.confirm("Reject step: " + oStep.stepName + "?", {
                title: "Reject Step",
                actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                onClose: function (sAction) {
                    if (sAction === MessageBox.Action.YES) {
                        // TODO: Call backend API to reject step
                        MessageToast.show("Step rejected (integration pending)");
                        // Refresh workflow data
                        this.loadWorkflowData();
                    }
                }.bind(this)
            });
        },
        
        onAddComment: function (oEvent) {
            var oStep = oEvent.getSource().getBindingContext("workflow").getObject();
            MessageBox.prompt("Add comment for step: " + oStep.stepName, {
                title: "Add Comment",
                actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                onClose: function (sAction, sComment) {
                    if (sAction === MessageBox.Action.OK && sComment) {
                        // TODO: Call backend API to add comment
                        MessageToast.show("Comment added (integration pending)");
                        // Refresh workflow data
                        this.loadWorkflowData();
                    }
                }
            });
        },
        
        onConfigureWorkflow: function () {
            // Navigate back to compensation worksheet to configure workflow
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.navTo("compensation");
            // TODO: Open workflow config dialog automatically
        },

        onRefresh: function () {
            this.loadWorkflowData();
            MessageToast.show("Workflow refreshed");
        },

        onExport: function () {
            var oModel = this.getView().getModel("workflow");
            var oWorkflowData = oModel.getData();

            // Create export data
            var sExportData = JSON.stringify(oWorkflowData, null, 2);
            var sBlob = new Blob([sExportData], { type: "application/json" });
            var sUrl = URL.createObjectURL(sBlob);
            var oLink = document.createElement("a");
            oLink.href = sUrl;
            oLink.download = "workflow_" + oWorkflowData.formId + ".json";
            oLink.click();
            URL.revokeObjectURL(sUrl);

            MessageToast.show("Workflow exported");
        }
    });
});
