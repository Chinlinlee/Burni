require("module-alias/register");

const fs = require("fs");
const path = require("path");
const { expect } = require("chai");
const productionResources = require("@models/FHIR/fhir.resourceList.json");
const { tryApplyRegistryParameter } = require("@models/FHIR/searchParameter/runtime/registrySearchHandler");
const {
    buildRegistryIntegrityReport
} = require("@models/FHIR/searchParameter/migration/registryIntegrityReport");
const { reloadRegistry } = require("@models/FHIR/searchParameter/registry/registryManager");
describe("Registry-only production search path", function () {
    it("does not keep a resource rollout config file", function () {
        const rolloutPath = path.join(
            __dirname,
            "../../models/FHIR/searchParameter/config/registry-rollout.json"
        );
        expect(fs.existsSync(rolloutPath)).to.equal(false);
    });

    it("returns disabled for unknown codes without a legacy fallback path", async function () {
        const result = await tryApplyRegistryParameter({
            resourceType: "Account",
            query: { definitelyUnknownParam: "x" },
            parameterName: "definitelyUnknownParam"
        });
        expect(result).to.equal("disabled");
    });

    it("reports every production resource as registry-enabled with fallback disabled", async function () {
        const snapshot = await reloadRegistry();
        const report = buildRegistryIntegrityReport({
            snapshot,
            definitions: [...snapshot.byCanonicalKey.values()]
        });

        expect(report.summary.enabledResources).to.equal(productionResources.length);

        for (const resourceType of productionResources) {
            const resource = report.resources[resourceType];
            expect(resource.enablement.registryEnabled, resourceType).to.equal(true);
            expect(resource.enablement.fallbackDisabled, resourceType).to.equal(true);
        }
    });
});
