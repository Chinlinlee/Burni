require("module-alias/register");

const { expect } = require("chai");
const {
    runTemporalMigration,
    TemporalMigrationPreflightError,
    TemporalMigrationWriteError
} = require("@models/FHIR/searchParameter/migration/temporalMigration");

function setAtPath(value, path, replacement) {
    const segments = path.split(".");
    const last = segments.pop();
    let current = value;
    for (const segment of segments) {
        current = current[segment];
    }
    current[last] = replacement;
}

function fakeModel(documents, calls = []) {
    return {
        find() {
            return {
                lean() {
                    return this;
                },
                exec: async () => documents
            };
        },
        async updateOne(filter, update) {
            calls.push({ filter, update });
            const document = documents.find(
                (entry) => entry._id === filter._id || entry.id === filter.id
            );
            for (const [path, replacement] of Object.entries(update.$set || {})) {
                setAtPath(document, path, replacement);
            }
            return { acknowledged: true, modifiedCount: 1 };
        }
    };
}

function patientDocument(overrides = {}) {
    return {
        _id: "patient-1",
        id: "patient-1",
        resourceType: "Patient",
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

describe("temporal migration orchestration", function () {
    it("blocks writes when preflight reports invalid temporal values", async function () {
        const updateCalls = [];
        const model = fakeModel(
            [
                patientDocument({
                    birthDate: new Date("2020-01-01T00:00:00.000Z"),
                    deceasedDateTime: "not-a-date"
                })
            ],
            updateCalls
        );

        try {
            await runTemporalMigration({
                catalog: ["Patient"],
                includeHistory: false,
                models: { Patient: model },
                logger: () => undefined
            });
            expect.fail("expected preflight to fail");
        } catch (error) {
            expect(error).to.be.instanceOf(TemporalMigrationPreflightError);
            expect(error.report.valid).to.equal(false);
            expect(error.report.summary.lossyBsonDates).to.equal(1);
            expect(error.report.summary.unresolvedAmbiguousBsonDates).to.equal(0);
            expect(
                error.diagnostics.filter(
                    (diagnostic) => diagnostic.category === "invalid"
                )
            ).to.have.length(1);
            expect(error.diagnostics.every((diagnostic) => diagnostic.resource === "Patient")).to.equal(
                true
            );
            expect(updateCalls).to.have.length(0);
        }
    });

    it("converts nested choice, contained, history, and temporal array paths", async function () {
        const document = patientDocument();
        const originalBirthDate = document.birthDate;
        const originalContainedValue = document.contained[0].effectiveDateTime;
        const writes = [];
        const result = await runTemporalMigration({
            catalog: ["Patient"],
            includeHistory: false,
            models: { Patient: fakeModel([document]) },
            logger: () => undefined,
            updateStrategy: async (input) => {
                writes.push(input);
            }
        });

        expect(result.preflight.valid).to.equal(true);
        expect(result.summary).to.include({
            batches: 1,
            processed: 1,
            updated: 1,
            skipped: 0,
            failed: 0
        });
        expect(writes).to.have.length(1);
        expect(writes[0].changes.map((change) => change.path)).to.include.members([
            "birthDate",
            "deceasedDateTime",
            "contained[0].effectiveDateTime",
            "contained[0].effectiveTiming.event[0]",
            "contact[0].period.start",
            "contact[0].period.end"
        ]);
        expect(writes[0].convertedDocument.birthDate).to.have.property(
            "normalizedStart",
            "1995-06-01"
        );
        expect(document.birthDate).to.equal(originalBirthDate);
        expect(document.contained[0].effectiveDateTime).to.equal(originalContainedValue);
    });

    it("reruns without rewrapping canonical values or writing skipped documents", async function () {
        const documents = [patientDocument()];
        const updateCalls = [];
        const model = fakeModel(documents, updateCalls);

        const first = await runTemporalMigration({
            catalog: ["Patient"],
            includeHistory: false,
            models: { Patient: model },
            logger: () => undefined
        });
        const second = await runTemporalMigration({
            catalog: ["Patient"],
            includeHistory: false,
            models: { Patient: model },
            logger: () => undefined
        });

        expect(first.summary.updated).to.equal(1);
        expect(second.summary).to.include({
            processed: 1,
            updated: 0,
            skipped: 1,
            failed: 0
        });
        expect(updateCalls).to.have.length(1);
        expect(documents[0].birthDate).to.deep.equal({
            value: "1995-06",
            precision: "month",
            normalizedStart: "1995-06-01",
            normalizedEnd: "1995-07-01"
        });
    });

    it("processes history models through the same migration entry point", async function () {
        const writes = [];
        const historyDocument = {
            _id: "history-1",
            id: "patient-1",
            resourceType: "Patient",
            meta: { versionId: "1" },
            birthDate: "1995"
        };
        const result = await runTemporalMigration({
            catalog: ["Patient"],
            models: {
                Patient: fakeModel([]),
                Patient_history: fakeModel([historyDocument])
            },
            logger: () => undefined,
            updateStrategy: async (input) => {
                writes.push(input);
            }
        });

        expect(result.summary).to.include({
            processed: 1,
            updated: 1,
            skipped: 0,
            failed: 0
        });
        expect(writes).to.have.length(1);
        expect(writes[0]).to.include({
            modelName: "Patient_history",
            kind: "history"
        });
    });

    it("reports unavailable requested sources instead of silently omitting them", async function () {
        try {
            await runTemporalMigration({
                catalog: ["Patient"],
                models: { Patient: fakeModel([]) },
                logger: () => undefined
            });
            expect.fail("expected the history source gate to fail");
        } catch (error) {
            expect(error).to.be.instanceOf(TemporalMigrationPreflightError);
            expect(error.report.gateFailure).to.include({
                code: "TEMPORAL_MIGRATION_SOURCE_UNAVAILABLE"
            });
            expect(error.report.gateFailure.sources).to.deep.include({
                resource: "Patient",
                model: "Patient_history",
                kind: "history",
                available: false,
                documentCount: 0
            });
        }
    });

    it("logs each batch and returns an actionable summary", async function () {
        const events = [];
        const documents = [patientDocument({ _id: "one", id: "one" }), patientDocument({ _id: "two", id: "two" })];
        const result = await runTemporalMigration({
            catalog: ["Patient"],
            includeHistory: false,
            batchSize: 1,
            models: { Patient: fakeModel(documents) },
            logger: (event) => events.push(event)
        });

        const batches = events.filter((event) => event.event === "temporal-migration-batch");
        expect(batches).to.have.length(2);
        expect(batches[0]).to.include({
            batchSize: 1,
            processed: 1,
            updated: 1,
            skipped: 0,
            failed: 0
        });
        expect(events.at(-1)).to.include({
            event: "temporal-migration-summary",
            processed: 2,
            updated: 2,
            failed: 0
        });
        expect(result.summary.temporalValuesUpdated).to.be.greaterThan(0);
    });

    it("returns resource, model, path, value, and category on write failure", async function () {
        const document = {
            _id: "patient-1",
            id: "patient-1",
            resourceType: "Patient",
            birthDate: "1995-06"
        };
        const events = [];

        try {
            await runTemporalMigration({
                catalog: ["Patient"],
                includeHistory: false,
                models: { Patient: fakeModel([document]) },
                logger: (event) => events.push(event),
                updateStrategy: async () => {
                    throw new Error("simulated write failure");
                }
            });
            expect.fail("expected write to fail");
        } catch (error) {
            expect(error).to.be.instanceOf(TemporalMigrationWriteError);
            expect(error.metadata).to.include({
                resource: "Patient",
                model: "Patient",
                path: "birthDate",
                category: "legacy-string"
            });
            expect(error.metadata.value).to.equal("1995-06");
            expect(error.summary).to.include({
                processed: 1,
                updated: 0,
                failed: 1
            });
            expect(events).to.deep.include({
                event: "temporal-migration-batch",
                batchSize: 1,
                processed: 1,
                updated: 0,
                skipped: 0,
                failed: 1,
                temporalValuesUpdated: 0,
                resource: "Patient",
                model: "Patient",
                kind: "resource",
                batchNumber: 1
            });
        }
    });
});
