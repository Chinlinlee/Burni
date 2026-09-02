require("module-alias/register");

const { expect } = require("chai");
const {
    createDocumentTransformer,
    DocumentTransformError,
    TRANSFORM_FAILED_CODE
} = require("@models/FHIR/searchParameter/migration/documentTransformer");
const { validateAuditRecord } = require("@models/FHIR/searchParameter/migration/migrationContracts");

function baseRunIdentity(overrides = {}) {
    return {
        runId: "run-1",
        sourceDatabaseIdentity: "source-db",
        targetDatabaseIdentity: "target-db",
        ...overrides
    };
}

function patientSource(overrides = {}) {
    return {
        resource: "Patient",
        model: "Patient",
        kind: "resource",
        collectionName: "Patient",
        ...overrides
    };
}

function transformContext(overrides = {}) {
    return {
        runIdentity: baseRunIdentity(),
        source: patientSource(),
        batchId: "batch-1",
        ...overrides
    };
}

function patientDocument(overrides = {}) {
    return {
        _id: "patient-1",
        id: "patient-1",
        resourceType: "Patient",
        active: true,
        name: [{ family: "Smith" }],
        meta: { versionId: "3", lastUpdated: "2024-01-01T00:00:00Z" },
        birthDate: "1995-06",
        deceasedDateTime: "2020-01-01T00:00:00Z",
        contained: [
            {
                resourceType: "Observation",
                effectiveDateTime: "2024-01-01",
                effectiveTiming: {
                    event: ["2024-01-01T00:00:00Z"]
                }
            }
        ],
        contact: [
            {
                period: {
                    start: "2020-01-01",
                    end: "2020-02-01"
                }
            }
        ],
        ...overrides
    };
}

describe("document transformer", function () {
    /** @type {ReturnType<typeof createDocumentTransformer>} */
    let transformer;

    before(function () {
        transformer = createDocumentTransformer({
            runIdentity: baseRunIdentity()
        });
    });

    it("preserves _id, id, meta.versionId, and non-temporal fields", function () {
        const sourceDoc = patientDocument({
            customField: "keep-me",
            extension: [{ url: "http://example.org", valueString: "x" }]
        });
        const { document, auditEntries } = transformer.transformDocument(
            sourceDoc,
            transformContext()
        );

        expect(document._id).to.equal("patient-1");
        expect(document.id).to.equal("patient-1");
        expect(document.meta.versionId).to.equal("3");
        expect(document.meta.lastUpdated).to.have.property("epochSeconds");
        expect(document.active).to.equal(true);
        expect(document.name).to.deep.equal([{ family: "Smith" }]);
        expect(document.customField).to.equal("keep-me");
        expect(document.extension).to.deep.equal([
            { url: "http://example.org", valueString: "x" }
        ]);
        expect(auditEntries.length).to.be.greaterThan(0);
    });

    it("converts legacy string temporal values to canonical objects", function () {
        const sourceDoc = patientDocument();
        const { document, auditEntries } = transformer.transformDocument(
            sourceDoc,
            transformContext()
        );

        expect(document.birthDate).to.deep.include({
            value: "1995-06",
            precision: "month",
            normalizedStart: "1995-06-01",
            normalizedEnd: "1995-07-01"
        });
        expect(document.deceasedDateTime).to.have.property("normalizedStart");
        expect(
            auditEntries.some(
                (entry) =>
                    entry.fhirPath === "birthDate" &&
                    entry.temporalType === "date" &&
                    entry.policy === "legacy-string" &&
                    entry.originalValue === "1995-06"
            )
        ).to.equal(true);
        for (const entry of auditEntries) {
            validateAuditRecord(entry);
        }
    });

    it("preserves already-canonical temporal values without double wrapping", function () {
        const canonicalBirthDate = {
            value: "1995-06",
            precision: "month",
            normalizedStart: "1995-06-01",
            normalizedEnd: "1995-07-01"
        };
        const sourceDoc = patientDocument({
            birthDate: canonicalBirthDate,
            deceasedDateTime: "2020-01-01T00:00:00Z"
        });

        const { document, auditEntries } = transformer.transformDocument(
            sourceDoc,
            transformContext()
        );

        expect(document.birthDate).to.equal(canonicalBirthDate);
        expect(
            auditEntries.some((entry) => entry.fhirPath === "birthDate")
        ).to.equal(false);
    });

    it("handles nested choice, contained, and array temporal paths", function () {
        const sourceDoc = patientDocument();
        const { document, auditEntries } = transformer.transformDocument(
            sourceDoc,
            transformContext()
        );

        const convertedPaths = auditEntries.map((entry) => entry.fhirPath);
        expect(convertedPaths).to.include.members([
            "birthDate",
            "deceasedDateTime",
            "contained[0].effectiveDateTime",
            "contained[0].effectiveTiming.event[0]",
            "contact[0].period.start",
            "contact[0].period.end"
        ]);

        expect(document.contained[0].effectiveDateTime).to.have.property("precision");
        expect(document.contained[0].effectiveTiming.event[0]).to.have.property(
            "normalizedStart"
        );
        expect(document.contact[0].period.start).to.have.property("normalizedStart");
        expect(document.contact[0].period.end).to.have.property("normalizedStart");
    });

    it("returns auditEntries and diagnostics for each converted value", function () {
        const sourceDoc = {
            _id: "patient-1",
            id: "patient-1",
            resourceType: "Patient",
            birthDate: "1995"
        };
        const { auditEntries, diagnostics } = transformer.transformDocument(
            sourceDoc,
            transformContext()
        );

        expect(auditEntries).to.have.length(1);
        expect(auditEntries[0]).to.include({
            sourceDatabaseIdentity: "source-db",
            sourceCollection: "Patient",
            sourceDocumentId: "patient-1",
            fhirPath: "birthDate",
            temporalType: "date",
            policy: "legacy-string",
            originalValue: "1995"
        });
        expect(auditEntries[0].generatedValue).to.deep.include({
            value: "1995",
            precision: "year"
        });
        expect(diagnostics).to.have.length(1);
        expect(diagnostics[0]).to.include({
            category: "legacy-string",
            temporalType: "date",
            resource: "Patient",
            model: "Patient",
            path: "birthDate",
            batchId: "batch-1"
        });
    });

    it("fail-fast on invalid temporal values with path and value metadata", function () {
        const sourceDoc = patientDocument({ birthDate: "not-a-date" });

        try {
            transformer.transformDocument(sourceDoc, transformContext());
            expect.fail("expected transform to fail");
        } catch (error) {
            expect(error).to.be.instanceOf(DocumentTransformError);
            expect(error.code).to.equal(TRANSFORM_FAILED_CODE);
            expect(error.metadata).to.include({
                resource: "Patient",
                model: "Patient",
                batchId: "batch-1",
                sourceDocumentId: "patient-1",
                path: "birthDate",
                value: "not-a-date"
            });
            expect(error.cause).to.be.instanceOf(Error);
        }
    });

    it("transformBatch processes each document independently", function () {
        const results = transformer.transformBatch(
            [
                {
                    _id: "doc-1",
                    id: "doc-1",
                    resourceType: "Patient",
                    birthDate: "1995"
                },
                {
                    _id: "doc-2",
                    id: "doc-2",
                    resourceType: "Patient",
                    birthDate: "1996"
                }
            ],
            transformContext()
        );

        expect(results).to.have.length(2);
        expect(results[0].document._id).to.equal("doc-1");
        expect(results[1].document._id).to.equal("doc-2");
        expect(
            results[0].auditEntries.find((entry) => entry.fhirPath === "birthDate")?.originalValue
        ).to.equal("1995");
        expect(
            results[1].auditEntries.find((entry) => entry.fhirPath === "birthDate")?.originalValue
        ).to.equal("1996");
    });
});
