require("module-alias/register");

const { expect } = require("chai");
const {
    TEMPORAL_CATEGORIES,
    CONVERSION_POLICY,
    resolveConversionPolicy,
    processTemporalDocument,
    classifyTemporalValue,
    loadDefinitions
} = require("@models/FHIR/searchParameter/migration/temporalDocumentTransform");

describe("temporal document transform", function () {
    it("maps BSON date categories to a single lossy conversion policy", function () {
        expect(
            resolveConversionPolicy(TEMPORAL_CATEGORIES.ABSOLUTE_BSON_DATE, "date")
        ).to.equal(CONVERSION_POLICY.UTC_CALENDAR_DAY_LOSSY);
        expect(
            resolveConversionPolicy(TEMPORAL_CATEGORIES.ABSOLUTE_BSON_DATE, "dateTime")
        ).to.equal(CONVERSION_POLICY.UTC_ABSOLUTE_TIME_LOSSY);
        expect(
            resolveConversionPolicy(TEMPORAL_CATEGORIES.LEGACY_STRING, "date")
        ).to.equal(CONVERSION_POLICY.LEGACY_STRING);
    });

    it("uses the same classification categories in preflight and write modes", function () {
        const legacyDate = new Date("2020-01-15T12:00:00.000Z");
        const definitions = loadDefinitions();
        const preflightCategory = classifyTemporalValue(
            legacyDate,
            "date",
            "Patient",
            "Patient",
            "birthDate"
        ).category;

        const { auditEntries } = processTemporalDocument(
            {
                resourceType: "Patient",
                birthDate: legacyDate
            },
            definitions.Patient,
            { resourceType: "Patient", model: "Patient" },
            definitions,
            {
                mode: "write",
                auditContext: {
                    runIdentity: {
                        runId: "run-1",
                        sourceDatabaseIdentity: "source",
                        targetDatabaseIdentity: "target"
                    },
                    source: {
                        resource: "Patient",
                        model: "Patient",
                        kind: "resource",
                        collectionName: "Patient"
                    },
                    batchId: "batch-1",
                    sourceDocument: { _id: "patient-1" },
                    sourceDocumentId: "patient-1"
                }
            }
        );

        expect(preflightCategory).to.equal(TEMPORAL_CATEGORIES.ABSOLUTE_BSON_DATE);
        expect(auditEntries).to.have.length(1);
        expect(auditEntries[0].policy).to.equal(
            resolveConversionPolicy(preflightCategory, "date")
        );
    });
});
