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

            // Initialize workflow model
            var oWorkflowModel = new JSONModel({
                companyId: sCompanyId,
                userId: sUserId,
                formId: sFormId,
                overallStatus: "In Progress",
                statusState: "Warning",
                statusIcon: "sap-icon://pending",
                currentStep: "Step 2: Manager Review",
                initiatedBy: sUserId || "System",
                initiatedDate: new Date().toLocaleDateString(),
                steps: [
                    {
                        stepNumber: 1,
                        stepName: "Initiated",
                        status: "Completed",
                        statusState: "Success",
                        assigneeName: sUserId || "System User",
                        assigneeRole: "Initiator",
                        assigneePhoto: "sap-icon://employee",
                        completedDate: new Date().toLocaleDateString(),
                        comments: "Compensation form created and submitted"
                    },
                    {
                        stepNumber: 2,
                        stepName: "Manager Review",
                        status: "In Progress",
                        statusState: "Warning",
                        assigneeName: "John Manager",
                        assigneeRole: "Direct Manager",
                        assigneePhoto: "sap-icon://manager",
                        completedDate: "",
                        comments: ""
                    },
                    {
                        stepNumber: 3,
                        stepName: "HR Review",
                        status: "Pending",
                        statusState: "None",
                        assigneeName: "Sarah HR",
                        assigneeRole: "HR Manager",
                        assigneePhoto: "sap-icon://employee",
                        completedDate: "",
                        comments: ""
                    },
                    {
                        stepNumber: 4,
                        stepName: "Finance Approval",
                        status: "Pending",
                        statusState: "None",
                        assigneeName: "Mike Finance",
                        assigneeRole: "Finance Director",
                        assigneePhoto: "sap-icon://money-bills",
                        completedDate: "",
                        comments: ""
                    },
                    {
                        stepNumber: 5,
                        stepName: "Final Approval",
                        status: "Pending",
                        statusState: "None",
                        assigneeName: "Lisa Executive",
                        assigneeRole: "VP of HR",
                        assigneePhoto: "sap-icon://approvals",
                        completedDate: "",
                        comments: ""
                    },
                    {
                        stepNumber: 6,
                        stepName: "Completed",
                        status: "Pending",
                        statusState: "None",
                        completedDate: ""
                    }
                ],
                employees: []
            });

            this.getView().setModel(oWorkflowModel, "workflow");

            // Load workflow data
            this.loadWorkflowData();
        },

        onNavBack: function () {
            // Navigate back to compensation worksheet
            window.history.back();
        },

        loadWorkflowData: function () {
            var oView = this.getView();
            var oModel = oView.getModel("workflow");
            var sCompanyId = oModel.getProperty("/companyId");
            var sFormId = oModel.getProperty("/formId");

            if (!sFormId) {
                MessageToast.show("No Form ID provided");
                return;
            }

            // Show busy indicator
            oView.setBusy(true);

            // Call workflow API (you'll need to implement this in backend)
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
                    if (data && data.steps) {
                        oModel.setProperty("/steps", data.steps);
                        oModel.setProperty("/overallStatus", data.overallStatus);
                        oModel.setProperty("/currentStep", data.currentStep);
                        oModel.setProperty("/employees", data.employees || []);
                    }
                    oView.setBusy(false);
                },
                error: function (error) {
                    console.error("Error loading workflow:", error);
                    // Use mock data if API fails
                    MessageToast.show("Using mock workflow data");
                    oView.setBusy(false);
                }
            });
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
