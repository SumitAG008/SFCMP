sap.ui.define([
    "sap/ui/core/UIComponent",
    "sap/ui/Device",
    "sap/ui/model/json/JSONModel",
    "com/sap/sf/compensation/model/models"
], function (UIComponent, Device, JSONModel, models) {
    "use strict";

    return UIComponent.extend("com.sap.sf.compensation.Component", {
        metadata: {
            manifest: "json",
            interfaces: ["sap.ui.core.IAsyncContentCreation"]
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
            
            // Initialize router
            this.getRouter().initialize();
        },
        
    });
});
