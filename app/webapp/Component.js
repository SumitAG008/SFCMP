sap.ui.define([
    "sap/ui/core/UIComponent",
    "sap/ui/Device",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/mvc/View",
    "sap/ui/core/mvc/ViewType",
    "com/sap/sf/compensation/model/models"
], function (UIComponent, Device, JSONModel, View, ViewType, models) {
    "use strict";

    return UIComponent.extend("com.sap.sf.compensation.Component", {
        metadata: {
            manifest: "json"
        },

        init: function () {
            UIComponent.prototype.init.apply(this, arguments);
            this.setModel(models.createDeviceModel(), "device");
            
            // Initialize compensation model with default values
            var oCompensationModel = new JSONModel({
                companyId: "SFHUB003674",
                userId: "",
                formId: "",
                effectiveDate: "",
                totalEmployees: 0,
                CompensationWorksheet: []
            });
            this.setModel(oCompensationModel, "compensation");
        },
        
        createContent: function() {
            // Explicitly create the root view
            return View.create({
                viewName: "com.sap.sf.compensation.view.CompensationWorksheet",
                type: ViewType.XML,
                id: this.createId("CompensationWorksheet")
            });
        }
    });
});
