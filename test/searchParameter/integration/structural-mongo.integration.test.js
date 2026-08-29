require("module-alias/register");

const { expect } = require("chai");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const { reloadRegistry } = require("@models/FHIR/searchParameter/registry/registryManager");
const { getEffectiveDefinition } = require("@models/FHIR/searchParameter/registry/snapshot");
const { loadHitSetArtifact } = require("@models/FHIR/searchParameter/migration/hitSets");
const { prepareMainDocumentForHitSet } = require("@models/FHIR/searchParameter/migration/hitSetDocuments");
const { buildLookupMatrix } = require("@models/FHIR/searchParameter/migration/lookupMatrix");
const { loadBuiltinDefinitions } = require("@models/FHIR/searchParameter/registry/sourceAdapter");
const { applyActivationOverlay } = require("@models/FHIR/searchParameter/registry/activationPolicy");
const { compileDefinition } = require("@models/FHIR/searchParameter/compiler/compiler");
const { mergeDefinitions } = require("@models/FHIR/searchParameter/registry/merge");
const { executeSearchQueryPlan } = require("@models/FHIR/searchParameter/executor/mongoExecutor");
const {
    startRegistryTestContext,
    stopRegistryTestContext
} = require("../support/registry-test-context");

const ARCHIVE_ROOT = path.join(__dirname, "../../fixtures/archive");
const LOOKUP_MATRIX_PATH = path.join(
    __dirname,
    "../../../models/FHIR/searchParameter/migration/artifacts/lookup-matrix.json"
);
const NO_LOOKUP_RESOURCES = [
    "Binary",
    "BiologicallyDerivedProduct",
    "CatalogEntry",
    "MedicinalProductIngredient",
    "MedicinalProductManufactured",
    "ObservationDefinition",
    "OperationOutcome",
    "Parameters",
    "SubstanceNucleicAcid",
    "SubstancePolymer",
    "SubstanceProtein",
    "SubstanceReferenceInformation",
    "SubstanceSourceMaterial"
];

async function compileDefinitions() {
    const builtin = loadBuiltinDefinitions();
    const compiledDefinitions = [];

    for (const definition of builtin.definitions) {
        const compileResult = compileDefinition(definition);
        const activated = applyActivationOverlay(definition, {
            compilable: compileResult.compilable,
            reason: compileResult.reason
        });
        if (compileResult.lookupPlans) {
            activated.lookupPlans = compileResult.lookupPlans;
        }
        compiledDefinitions.push(activated);
    }

    return mergeDefinitions(compiledDefinitions).definitions;
}

/**
 * @param {string} collectionName
 * @param {Object} filter
 * @returns {Promise<Object[]>}
 */
async function queryCollection(collectionName, filter) {
    const collection = mongoose.connection.collection(collectionName);
    return collection.find(filter).toArray();
}

/**
 * @param {string} collectionName
 * @param {Object[]} documents
 * @returns {Promise<void>}
 */
async function seedCollection(collectionName, documents) {
    const collection = mongoose.connection.collection(collectionName);
    await collection.drop().catch(() => undefined);
    await collection.insertMany(documents);
}

/**
 * @param {string} resourceType
 * @param {string} code
 * @param {string} rawValue
 * @param {import('@models/FHIR/searchParameter/registry/types').RegistrySnapshot} snapshot
 * @returns {Object}
 */
function buildRegistryFilter(snapshot, resourceType, code, rawValue) {
    const definition = getEffectiveDefinition(snapshot, resourceType, code);
    expect(definition?.compiledPlan, `${resourceType}::${code} plan`).to.exist;
    return executeSearchQueryPlan(definition.compiledPlan, rawValue, code);
}

describe("SearchParameter structural Mongo integration", function () {
    /** @type {import('@models/FHIR/searchParameter/registry/types').RegistrySnapshot} */
    let snapshot;

    before(async function () {
        this.timeout(120000);
        await startRegistryTestContext();
        snapshot = await reloadRegistry();
    });

    after(async function () {
        await stopRegistryTestContext();
    });

    describe("choice", function () {
        it("matches deceased=true across boolean and dateTime branches via registry plan", async function () {
            const plan = getEffectiveDefinition(snapshot, "Patient", "deceased")?.compiledPlan;
            expect(plan?.extractionPaths.map((entry) => entry.path)).to.deep.equal([
                "deceasedBoolean",
                "deceasedDateTime"
            ]);

            await seedCollection("Patient_structural_choice", [
                { resourceType: "Patient", deceasedBoolean: true, _fixtureRole: "boolean" },
                {
                    resourceType: "Patient",
                    deceasedDateTime: new Date("2019-05-01T12:00:00.000Z"),
                    _fixtureRole: "dateTime"
                },
                { resourceType: "Patient", _fixtureRole: "alive" }
            ]);

            const filter = executeSearchQueryPlan(plan, "true", "deceased");
            const matches = await queryCollection("Patient_structural_choice", filter);
            const roles = matches.map((entry) => entry._fixtureRole).sort();

            expect(roles).to.deep.equal(["boolean", "dateTime"]);
        });
    });

    describe("union", function () {
        it("matches combo-code across code and component.code branches via registry plan", async function () {
            const plan = getEffectiveDefinition(snapshot, "Observation", "combo-code")?.compiledPlan;
            expect(plan?.extractionPaths.map((entry) => entry.path)).to.deep.equal([
                "code",
                "component.code"
            ]);

            await seedCollection("Observation_structural_union", [
                {
                    resourceType: "Observation",
                    code: {
                        coding: [{ system: "http://loinc.org", code: "root-only" }]
                    },
                    _fixtureRole: "root"
                },
                {
                    resourceType: "Observation",
                    component: [
                        {
                            code: {
                                coding: [{ system: "http://loinc.org", code: "nested-only" }]
                            }
                        }
                    ],
                    _fixtureRole: "nested"
                },
                {
                    resourceType: "Observation",
                    code: {
                        coding: [{ system: "http://loinc.org", code: "other" }]
                    },
                    _fixtureRole: "miss"
                }
            ]);

            const rootFilter = executeSearchQueryPlan(plan, "http://loinc.org|root-only", "combo-code");
            const nestedFilter = executeSearchQueryPlan(
                plan,
                "http://loinc.org|nested-only",
                "combo-code"
            );

            const rootMatches = await queryCollection("Observation_structural_union", rootFilter);
            const nestedMatches = await queryCollection("Observation_structural_union", nestedFilter);

            expect(rootMatches.map((entry) => entry._fixtureRole)).to.deep.equal(["root"]);
            expect(nestedMatches.map((entry) => entry._fixtureRole)).to.deep.equal(["nested"]);
            expect(rootFilter.$or).to.have.length(2);
        });
    });

    describe("nested array", function () {
        it("matches component.code without matching the root code via registry plan", async function () {
            const filter = buildRegistryFilter(
                snapshot,
                "Observation",
                "combo-code",
                "http://loinc.org|component-leaf"
            );

            await seedCollection("Observation_structural_nested", [
                {
                    resourceType: "Observation",
                    code: {
                        coding: [{ system: "http://loinc.org", code: "root-code" }]
                    },
                    component: [
                        {
                            code: {
                                coding: [{ system: "http://loinc.org", code: "component-leaf" }]
                            }
                        }
                    ],
                    _fixtureRole: "nested-hit"
                },
                {
                    resourceType: "Observation",
                    code: {
                        coding: [{ system: "http://loinc.org", code: "unrelated-root" }]
                    },
                    _fixtureRole: "miss"
                }
            ]);

            const matches = await queryCollection("Observation_structural_nested", filter);
            expect(matches.map((entry) => entry._fixtureRole)).to.deep.equal(["nested-hit"]);
        });
    });

    describe("reference correlation", function () {
        it("requires reference and type in the same subject array element via Account::patient", async function () {
            const plan = getEffectiveDefinition(snapshot, "Account", "patient")?.compiledPlan;
            const extractionPath = plan?.extractionPaths[0];
            expect(extractionPath?.referenceTargetType).to.equal("Patient");
            expect(extractionPath?.correlation).to.deep.equal({
                kind: "same-array-element",
                parentPath: "subject",
                fields: ["reference", "type"]
            });

            await seedCollection("Account_structural_reference", [
                {
                    resourceType: "Account",
                    subject: [
                        { reference: "Patient/correct", type: "Patient" },
                        { reference: "Practitioner/other", type: "Practitioner" }
                    ],
                    _fixtureRole: "correlated-hit"
                },
                {
                    resourceType: "Account",
                    subject: [{ reference: "Patient/false-positive", type: "Practitioner" }],
                    _fixtureRole: "uncorrelated-miss"
                },
                {
                    resourceType: "Account",
                    subject: [{ reference: "Patient/only", type: "Patient" }],
                    _fixtureRole: "single-hit"
                }
            ]);

            const filter = executeSearchQueryPlan(plan, "Patient/correct", "patient");
            const matches = await queryCollection("Account_structural_reference", filter);
            expect(matches.map((entry) => entry._fixtureRole)).to.deep.equal(["correlated-hit"]);

            const falsePositiveFilter = executeSearchQueryPlan(
                plan,
                "Patient/false-positive",
                "patient"
            );
            const falsePositiveMatches = await queryCollection(
                "Account_structural_reference",
                falsePositiveFilter
            );
            expect(falsePositiveMatches).to.deep.equal([]);

            const singleFilter = executeSearchQueryPlan(plan, "Patient/only", "patient");
            const singleMatches = await queryCollection("Account_structural_reference", singleFilter);
            expect(singleMatches.map((entry) => entry._fixtureRole)).to.deep.equal(["single-hit"]);
        });
    });

    describe("synthetic fixture", function () {
        it("matches Account subject search after synthetic hit-set augmentation", async function () {
            const artifact = loadHitSetArtifact();
            const hitSet = artifact.resources.Account.subject;
            const plan = getEffectiveDefinition(snapshot, "Account", "subject")?.compiledPlan;
            expect(hitSet.valueSource).to.equal("synthetic");

            const baseFixture = JSON.parse(
                fs.readFileSync(path.join(ARCHIVE_ROOT, "official", "Account.json"), "utf8")
            );
            const companionFixture = JSON.parse(
                fs.readFileSync(path.join(ARCHIVE_ROOT, "companion", "Account.json"), "utf8")
            );
            const preparedMain = prepareMainDocumentForHitSet(baseFixture, hitSet, plan);

            await seedCollection("Account_structural_synthetic", [
                { ...preparedMain, _fixtureRole: "main" },
                { ...companionFixture, _fixtureRole: "companion" }
            ]);

            const parameterName = Object.keys(hitSet.positive.query)[0];
            const rawValue = hitSet.positive.query[parameterName];
            const filter = executeSearchQueryPlan(plan, rawValue, parameterName);
            const matches = await queryCollection("Account_structural_synthetic", filter);

            expect(
                matches.some((entry) => entry._fixtureRole === "main"),
                "synthetic-augmented main fixture should match"
            ).to.equal(true);
            expect(
                matches.some((entry) => entry._fixtureRole === "companion"),
                "companion fixture should not match positive query"
            ).to.equal(false);
        });

        it("archives pure synthetic fixtures for resources without official examples", function () {
            const syntheticFixture = JSON.parse(
                fs.readFileSync(
                    path.join(ARCHIVE_ROOT, "synthetic", "SubstanceNucleicAcid.json"),
                    "utf8"
                )
            );
            expect(syntheticFixture.resourceType).to.equal("SubstanceNucleicAcid");
            expect(syntheticFixture.meta.tag).to.deep.equal([
                { system: "urn:burni:fixture-source", code: "synthetic" }
            ]);
        });
    });

    describe("no-lookup resource", function () {
        it("records every catalog no-lookup resource without registry search parameters", async function () {
            const matrix = JSON.parse(fs.readFileSync(LOOKUP_MATRIX_PATH, "utf8"));
            expect(matrix.summary.noLookupResources).to.deep.equal(NO_LOOKUP_RESOURCES);

            const definitions = await compileDefinitions();
            const liveMatrix = buildLookupMatrix(snapshot, definitions);
            expect(liveMatrix.summary.noLookupResources).to.deep.equal(NO_LOOKUP_RESOURCES);

            for (const resourceType of NO_LOOKUP_RESOURCES) {
                const registryLookups = [...snapshot.byLookupKey.keys()].filter((key) =>
                    key.startsWith(`${resourceType}::`)
                );
                expect(registryLookups, `${resourceType} should have no effective lookups`).to.deep.equal(
                    []
                );
                expect(matrix.resources[resourceType]).to.deep.include({
                    lookupCount: 0,
                    outcome: "no-lookup",
                    fixtureCoverage: "not-applicable"
                });
            }
        });

        it("stores Binary documents without requiring a search hit-set gate", async function () {
            const binaryFixture = JSON.parse(
                fs.readFileSync(path.join(ARCHIVE_ROOT, "official", "Binary.json"), "utf8")
            );

            await seedCollection("Binary_structural_no_lookup", [
                { ...binaryFixture, _fixtureRole: "stored" }
            ]);

            const stored = await queryCollection("Binary_structural_no_lookup", {
                resourceType: "Binary"
            });
            expect(stored).to.have.length(1);
            expect(stored[0]._fixtureRole).to.equal("stored");
            expect([...snapshot.byLookupKey.keys()].some((key) => key.startsWith("Binary::"))).to.equal(
                false
            );
        });
    });
});
