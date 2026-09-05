require("module-alias/register");

const fs = require("fs");
const { expect } = require("chai");
const {
    DEFAULT_ARTIFACT_PATH,
    computeManifestChecksumValue
} = require("@models/mongodb/provisioning/desiredManifest");
const { loadApprovedBuiltinDefinitions } = require("@models/mongodb/provisioning/temporalIndexAdapter");
const { NON_TEMPORAL_POLICY_VERSION } = require("@models/FHIR/searchParameter/indexes/nonTemporal/constants");

describe("committed desired index manifest artifact", function () {
    it("matches runtime policy and artifact identity", function () {
        expect(fs.existsSync(DEFAULT_ARTIFACT_PATH)).to.equal(true);
        const persisted = JSON.parse(fs.readFileSync(DEFAULT_ARTIFACT_PATH, "utf8"));
        const runtime = loadApprovedBuiltinDefinitions();
        expect(persisted.derivedIndexPolicy.searchParameterPolicyVersion).to.equal(
            NON_TEMPORAL_POLICY_VERSION
        );
        expect(persisted.derivedIndexPolicy.searchParameterPolicySource).to.equal(
            "search-parameter-derived-indexes"
        );
        expect(persisted.artifactIdentity).to.deep.equal(runtime.artifactIdentity);
        expect(computeManifestChecksumValue(persisted)).to.equal(persisted.checksum.value);
        expect(
            persisted.derivedIndexes.some((entry) => entry.source === "search-parameter")
        ).to.equal(true);
    });
});
