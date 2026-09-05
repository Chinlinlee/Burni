require("module-alias/register");

const mongoose = require("mongoose");
const {
    discoverModelFiles,
    registerDiscoveredModels,
    disableAutomaticSchemaProvisioning
} = require("@models/mongodb/connector");
const { buildModelCatalog } = require("@models/mongodb/provisioning/modelCatalog");
const {
    generateDesiredManifest,
    writeDesiredManifestArtifact,
    DEFAULT_ARTIFACT_PATH
} = require("@models/mongodb/provisioning/desiredManifest");

async function main() {
    disableAutomaticSchemaProvisioning();
    const connection = mongoose.createConnection();
    const discovered = discoverModelFiles();
    /** @type {Record<string, import("mongoose").Model>} */
    const modelMap = {};
    registerDiscoveredModels(discovered, modelMap, connection);

    const manifest = generateDesiredManifest(modelMap, {
        catalog: buildModelCatalog({ discovered }),
        generatedAt: new Date().toISOString()
    });
    const artifactPath = writeDesiredManifestArtifact(manifest);
    await connection.close();

    console.log(
        JSON.stringify(
            {
                artifactPath: artifactPath || DEFAULT_ARTIFACT_PATH,
                checksum: manifest.checksum.value,
                derivedIndexes: manifest.counts.derivedIndexes,
                searchParameterPolicyVersion: manifest.derivedIndexPolicy.searchParameterPolicyVersion
            },
            null,
            2
        )
    );
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
