sap.ui.define([
    "sap/ui/core/mvc/Controller"
], function (Controller) {
    "use strict";

    return Controller.extend("com.sap.sf.compensation.controller.App", {
        onInit: function () {
            // Initialize router
            this.getOwnerComponent().getRouter().initialize();
        }
    });
});
