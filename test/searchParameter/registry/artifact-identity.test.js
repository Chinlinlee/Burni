require("module-alias/register");

const { expect } = require("chai");
const fs = require("fs");
const os = require("os");
const path = require("path");
const {
    computeCurrentIdentity,
    computeDirectoryHash,
    verifyArtifactIdentity,
    COMPILER_DIR,
    TYPE_MAPS_DIR
} = require("@models/FHIR/searchParameter/registry/artifacts/artifactIdentity");
const {
    writeArtifact,
    readArtifact,
    buildArtifact
} = require("@models/FHIR/searchParameter/registry/artifacts/compiledArtifact");
const { loadBuiltinDefinitions } = require("@models/FHIR/searchParameter/registry/sourceAdapter");
const { compileDefinition } = require("@models/FHIR/searchParameter/compiler/compiler");

describe("SearchParameter compiled artifact identity", function () {
    it("passes identity verification for the committed runtime artifact", function () {
        const artifact = readArtifact();
        const verification = verifyArtifactIdentity(artifact);
        expect(verification.valid, verification.errors.join("; ")).to.equal(true);
    });

    it("fails when current bundle checksum no longer matches the artifact header", function () {
        const artifact = readArtifact();
        const staleArtifact = {
            ...artifact,
            header: {
                ...artifact.header,
                identity: {
                    ...artifact.header.identity,
                    bundleChecksum: "0".repeat(64)
                }
            }
        };

        const verification = verifyArtifactIdentity(staleArtifact);
        expect(verification.valid).to.equal(false);
        expect(verification.errors.join(" ")).to.include("npm run search-parameter:build-artifacts");
        expect(verification.errors.some((error) => error.includes("bundle checksum"))).to.equal(
            true
        );
    });

    it("computes stable directory hashes for compiler and type maps inputs", function () {
        const identity = computeCurrentIdentity();
        expect(identity.bundleChecksum).to.match(/^[a-f0-9]{64}$/);
        expect(identity.compilerDirectoryHash).to.equal(computeDirectoryHash(COMPILER_DIR));
        expect(identity.typeMapsDirectoryHash).to.equal(computeDirectoryHash(TYPE_MAPS_DIR));
    });

    it("rejects missing, stale, and tampered artifacts with build-artifacts guidance", function () {
        const missing = verifyArtifactIdentity(null);
        expect(missing.valid).to.equal(false);
        expect(missing.errors.join(" ")).to.include("npm run search-parameter:build-artifacts");

        const identity = computeCurrentIdentity({ bodyChecksum: "deadbeef".repeat(8) });
        const stale = verifyArtifactIdentity({
            header: {
                version: 1,
                generatedAt: "2026-01-01T00:00:00.000Z",
                checksumAlgorithm: "sha256",
                identity
            },
            definitions: {}
        });
        expect(stale.valid).to.equal(false);
        expect(stale.errors.join(" ")).to.include("npm run search-parameter:build-artifacts");

        const body = { definitions: {} };
        const artifact = buildArtifact([], {});
        artifact.header.identity = computeCurrentIdentity({
            bodyChecksum: artifact.header.identity.bodyChecksum
        });
        artifact.definitions.tampered = {
            resource: { resourceType: "SearchParameter", code: "tampered" },
            source: "builtin-bundle",
            canonicalKey: "tampered",
            lookupKeys: [],
            rawStatus: "active",
            compile: {
                compilable: false,
                lookupPlans: {},
                diagnostics: []
            }
        };

        const tampered = verifyArtifactIdentity(artifact);
        expect(tampered.valid).to.equal(false);
        expect(tampered.errors.some((error) => error.includes("body checksum mismatch"))).to.equal(
            true
        );
        expect(tampered.errors.join(" ")).to.include("npm run search-parameter:build-artifacts");
    });

    it("writes and reads a roundtrip artifact without AST nodes in plans", function () {
        const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "burni-sp-artifact-"));
        const artifactPath = path.join(tempDir, "compiled-builtin-definitions.json");
        const builtin = loadBuiltinDefinitions();
        const sampleDefinitions = builtin.definitions.slice(0, 3);
        /** @type {Record<string, ReturnType<typeof compileDefinition>>} */
        const compileResults = {};

        for (const definition of sampleDefinitions) {
            compileResults[definition.canonicalKey] = compileDefinition(definition);
        }

        const written = writeArtifact(sampleDefinitions, compileResults, artifactPath);
        const verification = verifyArtifactIdentity(written);
        expect(verification.valid).to.equal(true, verification.errors.join("; "));

        const loaded = readArtifact(artifactPath);
        expect(loaded.header.identity.bodyChecksum).to.equal(written.header.identity.bodyChecksum);

        for (const entry of Object.values(loaded.definitions)) {
            for (const lookupResult of Object.values(entry.compile.lookupPlans)) {
                if (lookupResult.plan) {
                    expect(lookupResult.plan).to.not.have.property("ast");
                }
            }
            expect(entry).to.not.have.property("effectiveStatus");
            expect(entry).to.not.have.property("disableReason");
        }
    });
});
