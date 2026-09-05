"use strict";

module.exports = {
    ...require("./contracts"),
    ...require("./indexIdentity"),
    ...require("./indexComparison"),
    ...require("./modelCatalog"),
    ...require("./schemaIndexCollector"),
    ...require("./serviceIndexes"),
    ...require("./temporalIndexAdapter"),
    ...require("./desiredManifest"),
    ...require("./mongoDdlClient"),
    ...require("./collectionProvisioner"),
    ...require("./indexReconciler"),
    ...require("./provisioningService"),
    ...require("./controlPlaneModels"),
    ...require("./provisioningLock"),
    ...require("./provisioningState"),
    ...require("./provisioningRun"),
    ...require("./operationalCommands"),
    ...require("./identityAuditClient"),
    ...require("./identityAuditService"),
    ...require("./identityAuditAdapter"),
    ...require("./startupIntegration")
};
