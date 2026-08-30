require("module-alias/register");

const fs = require("fs");
const os = require("os");
const path = require("path");
const { expect } = require("chai");
const {
    reloadRegistry,
    resetRegistryCache
} = require("@models/FHIR/searchParameter/registry/registryManager");
const { resolveLookupStatus } = require("@models/FHIR/searchParameter/registry/snapshot");
const { compileDefinition } = require("@models/FHIR/searchParameter/compiler/compiler");

/**
 * @param {import('@models/FHIR/searchParameter/registry/types').SearchParameterDefinition} definition
 * @returns {boolean}
 */
function isBuiltinDefinition(definition) {
    return definition.source === "builtin-bundle";
}

/**
 * @param {() => Promise<unknown>} action
 * @returns {Promise<{ compileCalls: import('@models/FHIR/searchParameter/registry/types').SearchParameterDefinition[] }>}
 */
async function withCompileSpy(action) {
    const compiler = require("@models/FHIR/searchParameter/compiler/compiler");
    const originalCompile = compiler.compileDefinition;
    /** @type {import('@models/FHIR/searchParameter/registry/types').SearchParameterDefinition[]} */
    const compileCalls = [];

    compiler.compileDefinition = (definition) => {
        compileCalls.push(definition);
        return originalCompile(definition);
    };

    try {
        await action();
        return { compileCalls };
    } finally {
        compiler.compileDefinition = originalCompile;
    }
}

/**
 * @returns {string}
 */
function writeMinimalBundle() {
    const bundle = {
        resourceType: "Bundle",
        type: "collection",
        entry: [
            {
                resource: {
                    resourceType: "SearchParameter",
                    url: "http://example.org/SearchParameter/hydrate-test-minimal",
                    version: "4.0.1",
                    status: "active",
                    code: "hydrate-test-minimal",
                    base: ["Patient"],
                    type: "string",
                    expression: "Patient.name"
                }
            }
        ]
    };
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "burni-sp-hydrate-"));
    const bundlePath = path.join(tempDir, "minimal-search-parameters.json");
    fs.writeFileSync(bundlePath, JSON.stringify(bundle));
    return bundlePath;
}

describe("SearchParameter registry hydrate reload", function () {
    this.timeout(300000);

    afterEach(function () {
        resetRegistryCache();
    });

    it("does not compile builtin definitions on the default reload path", async function () {
        resetRegistryCache();
        const { compileCalls } = await withCompileSpy(async () => {
            await reloadRegistry({ databaseResources: [] });
        });

        expect(compileCalls.filter(isBuiltinDefinition)).to.have.length(0);
    });

    it("compiles database overlay definitions on reload", async function () {
        resetRegistryCache();
        const { compileCalls } = await withCompileSpy(async () => {
            const snapshot = await reloadRegistry({
                databaseResources: [
                    {
                        resourceType: "SearchParameter",
                        url: "http://example.org/SearchParameter/hydrate-overlay",
                        version: "4.0.1",
                        status: "active",
                        code: "hydrate-overlay",
                        base: ["Patient"],
                        type: "string",
                        expression: "Patient.name"
                    }
                ]
            });

            expect(resolveLookupStatus(snapshot, "Patient", "hydrate-overlay")).to.equal(
                "effective"
            );
        });

        expect(compileCalls.filter((definition) => definition.source === "database")).to.have.length(
            1
        );
        expect(compileCalls.filter(isBuiltinDefinition)).to.have.length(0);
    });

    it("rejects reload when artifact identity no longer matches current inputs", async function () {
        resetRegistryCache();
        const compiledArtifactModule = require("@models/FHIR/searchParameter/registry/artifacts/compiledArtifact");
        const savedRead = compiledArtifactModule.readArtifact;

        compiledArtifactModule.readArtifact = () => {
            const artifact = savedRead();
            return {
                ...artifact,
                header: {
                    ...artifact.header,
                    identity: {
                        ...artifact.header.identity,
                        bundleChecksum: "0".repeat(64)
                    }
                }
            };
        };

        try {
            let reloadError = null;
            try {
                await reloadRegistry({ databaseResources: [] });
            } catch (error) {
                reloadError = error;
            }

            expect(reloadError).to.be.instanceOf(Error);
            expect(reloadError.message).to.include("npm run search-parameter:build-artifacts");
        } finally {
            compiledArtifactModule.readArtifact = savedRead;
        }
    });

    it("rejects reload when the committed runtime artifact is missing", async function () {
        resetRegistryCache();
        const compiledArtifactModule = require("@models/FHIR/searchParameter/registry/artifacts/compiledArtifact");
        const savedRead = compiledArtifactModule.readArtifact;

        compiledArtifactModule.readArtifact = () => {
            throw new Error(
                "SearchParameter compile artifact not found. Run npm run search-parameter:build-artifacts to generate it."
            );
        };

        try {
            let reloadError = null;
            try {
                await reloadRegistry({ databaseResources: [] });
            } catch (error) {
                reloadError = error;
            }

            expect(reloadError).to.be.instanceOf(Error);
            expect(reloadError.message).to.include("npm run search-parameter:build-artifacts");
        } finally {
            compiledArtifactModule.readArtifact = savedRead;
        }
    });

    it("compiles builtin definitions when bundlePath override is used", async function () {
        resetRegistryCache();
        const bundlePath = writeMinimalBundle();
        const { compileCalls } = await withCompileSpy(async () => {
            await reloadRegistry({ bundlePath, databaseResources: [] });
        });

        expect(compileCalls.filter(isBuiltinDefinition).length).to.be.greaterThan(0);
    });
});
