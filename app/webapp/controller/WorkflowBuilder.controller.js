sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/m/Dialog",
    "sap/m/Input",
    "sap/m/Select",
    "sap/ui/core/Item"
], function (Controller, JSONModel, MessageBox, MessageToast, Dialog, Input, Select, Item) {
    "use strict";

    return Controller.extend("com.sap.sf.compensation.controller.WorkflowBuilder", {
        onInit: function () {
            // Get URL parameters
            var oUriParams = new URLSearchParams(window.location.search);
            var sCompanyId = oUriParams.get('companyId') || "SFHUB003674";
            var sFormId = oUriParams.get('formId') || "";

            // Initialize workflow builder model
            var oWorkflowBuilderModel = new JSONModel({
                workflowName: "Compensation Approval Workflow",
                companyId: sCompanyId,
                formId: sFormId,
                description: "Standard compensation approval workflow",
                steps: [
                    {
                        stepNumber: 1,
                        stepName: "Initiated",
                        status: "Completed",
                        statusState: "Success",
                        assigneeRole: "Initiator",
                        icon: "sap-icon://initiative",
                        assigneeName: "",
                        comments: ""
                    },
                    {
                        stepNumber: 2,
                        stepName: "Manager Review",
                        status: "Pending",
                        statusState: "None",
                        assigneeRole: "Direct Manager",
                        icon: "sap-icon://manager",
                        assigneeName: "",
                        comments: ""
                    },
                    {
                        stepNumber: 3,
                        stepName: "HR Review",
                        status: "Pending",
                        statusState: "None",
                        assigneeRole: "HR Manager",
                        icon: "sap-icon://employee",
                        assigneeName: "",
                        comments: ""
                    },
                    {
                        stepNumber: 4,
                        stepName: "Finance Approval",
                        status: "Pending",
                        statusState: "None",
                        assigneeRole: "Finance Director",
                        icon: "sap-icon://money-bills",
                        assigneeName: "",
                        comments: ""
                    },
                    {
                        stepNumber: 5,
                        stepName: "Final Approval",
                        status: "Pending",
                        statusState: "None",
                        assigneeRole: "VP of HR",
                        icon: "sap-icon://approvals",
                        assigneeName: "",
                        comments: ""
                    },
                    {
                        stepNumber: 6,
                        stepName: "Completed",
                        status: "Pending",
                        statusState: "None",
                        assigneeRole: "System",
                        icon: "sap-icon://accept",
                        assigneeName: "",
                        comments: ""
                    }
                ]
            });

            this.getView().setModel(oWorkflowBuilderModel, "workflowBuilder");
        },

        onNavBack: function () {
            window.history.back();
        },

        onAddStep: function () {
            var oModel = this.getView().getModel("workflowBuilder");
            var aSteps = oModel.getProperty("/steps") || [];
            
            var iNewStepNumber = aSteps.length + 1;
            var oNewStep = {
                stepNumber: iNewStepNumber,
                stepName: "New Step " + iNewStepNumber,
                status: "Pending",
                statusState: "None",
                assigneeRole: "Assignee",
                icon: "sap-icon://employee",
                assigneeName: "",
                comments: ""
            };
            
            aSteps.push(oNewStep);
            oModel.setProperty("/steps", aSteps);
            
            MessageToast.show("Step added");
        },

        onEditStep: function (oEvent) {
            var oModel = this.getView().getModel("workflowBuilder");
            var oStep = oEvent.getSource().getBindingContext("workflowBuilder").getObject();
            var iStepIndex = oEvent.getSource().getBindingContext("workflowBuilder").getPath().split("/").pop();
            
            // Create dialog for editing step
            if (!this._oEditStepDialog) {
                this._oEditStepDialog = new Dialog({
                    title: "Edit Workflow Step",
                    contentWidth: "500px",
                    content: [
                        new Input({
                            id: "editStepName",
                            label: "Step Name",
                            placeholder: "Enter step name"
                        }),
                        new Input({
                            id: "editAssigneeRole",
                            label: "Assignee Role",
                            placeholder: "Enter assignee role"
                        }),
                        new Select({
                            id: "editStepIcon",
                            label: "Icon",
                            items: [
                                new Item({ key: "sap-icon://initiative", text: "Initiative" }),
                                new Item({ key: "sap-icon://manager", text: "Manager" }),
                                new Item({ key: "sap-icon://employee", text: "Employee" }),
                                new Item({ key: "sap-icon://money-bills", text: "Finance" }),
                                new Item({ key: "sap-icon://approvals", text: "Approval" }),
                                new Item({ key: "sap-icon://accept", text: "Completed" })
                            ]
                        }),
                        new Select({
                            id: "editStepStatus",
                            label: "Initial Status",
                            items: [
                                new Item({ key: "Pending", text: "Pending" }),
                                new Item({ key: "In Progress", text: "In Progress" }),
                                new Item({ key: "Completed", text: "Completed" })
                            ]
                        })
                    ],
                    beginButton: new sap.m.Button({
                        text: "Save",
                        type: "Emphasized",
                        press: this.onSaveStepEdit.bind(this)
                    }),
                    endButton: new sap.m.Button({
                        text: "Cancel",
                        press: function () {
                            this._oEditStepDialog.close();
                        }.bind(this)
                    })
                });
            }
            
            // Populate dialog with step data
            this._oEditStepDialog.getContent()[0].setValue(oStep.stepName);
            this._oEditStepDialog.getContent()[1].setValue(oStep.assigneeRole);
            this._oEditStepDialog.getContent()[2].setSelectedKey(oStep.icon);
            this._oEditStepDialog.getContent()[3].setSelectedKey(oStep.status);
            
            // Store step index for saving
            this._iEditingStepIndex = iStepIndex;
            
            this._oEditStepDialog.open();
        },

        onSaveStepEdit: function () {
            var oModel = this.getView().getModel("workflowBuilder");
            var aSteps = oModel.getProperty("/steps");
            var oStep = aSteps[this._iEditingStepIndex];
            
            oStep.stepName = this._oEditStepDialog.getContent()[0].getValue();
            oStep.assigneeRole = this._oEditStepDialog.getContent()[1].getValue();
            oStep.icon = this._oEditStepDialog.getContent()[2].getSelectedKey();
            oStep.status = this._oEditStepDialog.getContent()[3].getSelectedKey();
            oStep.statusState = oStep.status === "Completed" ? "Success" : (oStep.status === "In Progress" ? "Warning" : "None");
            
            oModel.setProperty("/steps", aSteps);
            this._oEditStepDialog.close();
            
            MessageToast.show("Step updated");
        },

        onDeleteStep: function (oEvent) {
            var oModel = this.getView().getModel("workflowBuilder");
            var iStepIndex = parseInt(oEvent.getSource().getBindingContext("workflowBuilder").getPath().split("/").pop());
            var aSteps = oModel.getProperty("/steps");
            
            MessageBox.confirm("Are you sure you want to delete this step?", {
                title: "Delete Step",
                actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                onClose: function (sAction) {
                    if (sAction === MessageBox.Action.YES) {
                        aSteps.splice(iStepIndex, 1);
                        // Renumber steps
                        aSteps.forEach(function(oStep, iIndex) {
                            oStep.stepNumber = iIndex + 1;
                        });
                        oModel.setProperty("/steps", aSteps);
                        MessageToast.show("Step deleted");
                    }
                }
            });
        },

        onSaveWorkflow: function () {
            var oView = this.getView();
            var oModel = oView.getModel("workflowBuilder");
            var oWorkflowData = oModel.getData();
            
            // Show busy indicator
            oView.setBusy(true);
            
            // Save workflow to backend
            var sServiceUrl = "/compensation/CompensationService/saveWorkflow";
            var oPayload = {
                companyId: oWorkflowData.companyId,
                formId: oWorkflowData.formId,
                workflow: oWorkflowData
            };
            
            $.ajax({
                url: sServiceUrl,
                method: "POST",
                contentType: "application/json",
                data: JSON.stringify(oPayload),
                success: function (response) {
                    MessageToast.show("Workflow saved successfully");
                    oView.setBusy(false);
                },
                error: function (error) {
                    console.error("Error saving workflow:", error);
                    MessageBox.error("Failed to save workflow: " + (error.responseJSON?.error?.message || error.statusText));
                    oView.setBusy(false);
                }
            });
        },

        onPreviewWorkflow: function () {
            // Open workflow visualization in new window/tab
            var oModel = this.getView().getModel("workflowBuilder");
            var sCompanyId = oModel.getProperty("/companyId");
            var sFormId = oModel.getProperty("/formId");
            
            var sUrl = "/app/workflow.html?companyId=" + encodeURIComponent(sCompanyId) + 
                      "&formId=" + encodeURIComponent(sFormId) + 
                      "&preview=true";
            window.open(sUrl, "_blank");
        }
    });
});
