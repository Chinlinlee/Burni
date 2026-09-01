require("module-alias/register");

const { expect } = require("chai");
const mongoose = require("mongoose");
const {
    TEMPORAL_CATEGORIES,
    runTemporalMigrationPreflight
} = require("@models/FHIR/searchParameter/migration/temporalPreflight");

function fakeModel(documents, calls) {
    return {
        find() {
            calls.find++;
            return {
                lean() {
                    calls.lean++;
                    return this;
                },
                exec: async () => documents
            };
        },
        updateMany() {
            throw new Error("preflight must not write");
        }
    };
}

describe("temporal migration preflight", function () {
    it("scans catalog resources, nested choice, contained, history, and temporal arrays", async function () {
        const calls = { find: 0, lean: 0 };
        const report = await runTemporalMigrationPreflight({
            catalog: ["Patient"],
            models: {
                Patient: fakeModel(
                    [
                        {
                            resourceType: "Patient",
                            birthDate: "1995-06",
                            deceasedDateTime: new Date("2020-01-15T00:00:00.000Z"),
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
                            ]
                        }
                    ],
                    calls
                ),
                Patient_history: fakeModel(
                    [
                        {
                            resourceType: "Patient",
                            meta: {
                                lastUpdated: new Date("2020-01-15T00:00:00.000Z")
                            }
                        }
                    ],
                    calls
                )
            }
        });

        expect(report.readOnly).to.equal(true);
        expect(report.valid).to.equal(true);
        expect(calls).to.deep.equal({ find: 2, lean: 2 });
        expect(report.summary).to.include({
            resourcesInCatalog: 1,
            sourcesScanned: 2,
            documentsScanned: 2,
            legacyStrings: 5,
            absoluteBsonDates: 2,
            ambiguousBsonDates: 0,
            invalid: 0
        });

        const paths = report.diagnostics.map((diagnostic) => diagnostic.path);
        expect(paths).to.include.members([
            "birthDate",
            "deceasedDateTime",
            "contained[0].effectiveDateTime",
            "contained[0].effectiveTiming.event[0]",
            "contact[0].period.start",
            "contact[0].period.end",
            "meta.lastUpdated"
        ]);
        expect(
            report.diagnostics.find(
                (diagnostic) => diagnostic.path === "deceasedDateTime"
            )
        ).to.include({
            resource: "Patient",
            model: "Patient",
            temporalType: "dateTime",
            category: TEMPORAL_CATEGORIES.ABSOLUTE_BSON_DATE
        });
        expect(
            report.diagnostics.find(
                (diagnostic) => diagnostic.path === "contained[0].effectiveDateTime"
            )
        ).to.include({
            category: TEMPORAL_CATEGORIES.LEGACY_STRING,
            temporalType: "dateTime"
        });
    });

    it("fails without writing for ambiguous dates and invalid temporal values", async function () {
        const calls = { find: 0, lean: 0 };
        const readyStateBefore = mongoose.connection.readyState;
        const report = await runTemporalMigrationPreflight({
            catalog: ["Patient"],
            includeHistory: false,
            models: {
                Patient: fakeModel(
                    [
                        {
                            resourceType: "Patient",
                            birthDate: new Date("2020-01-01T00:00:00.000Z"),
                            deceasedDateTime: "not-a-date"
                        }
                    ],
                    calls
                )
            }
        });

        expect(report.readOnly).to.equal(true);
        expect(report.valid).to.equal(false);
        expect(report.summary).to.include({
            ambiguousBsonDates: 1,
            invalid: 1
        });
        const ambiguousDate = report.diagnostics.find(
            (diagnostic) => diagnostic.path === "birthDate"
        );
        expect(ambiguousDate).to.include({
            category: TEMPORAL_CATEGORIES.AMBIGUOUS_BSON_DATE,
            temporalType: "date",
            resource: "Patient",
            model: "Patient",
            path: "birthDate"
        });
        expect(ambiguousDate.value).to.be.instanceOf(Date);
        expect(ambiguousDate.reason).to.match(/calendar date, timezone, or precision/);
        expect(
            report.diagnostics.find(
                (diagnostic) => diagnostic.path === "deceasedDateTime"
            )
        ).to.include({
            category: TEMPORAL_CATEGORIES.INVALID,
            resource: "Patient",
            model: "Patient"
        });
        expect(calls).to.deep.equal({ find: 1, lean: 1 });
        expect(mongoose.connection.readyState).to.equal(readyStateBefore);
    });

    it("fails and audits unavailable resource sources", async function () {
        const report = await runTemporalMigrationPreflight({
            catalog: ["Patient"],
            includeHistory: false,
            models: {}
        });

        expect(report.readOnly).to.equal(true);
        expect(report.valid).to.equal(false);
        expect(report.summary.unavailableSources).to.equal(1);
        expect(report.summary.temporalValuesScanned).to.equal(0);
        expect(
            report.diagnostics.find(
                (diagnostic) => diagnostic.code === "temporal-preflight-source-unavailable"
            )
        ).to.include({
            code: "temporal-preflight-source-unavailable",
            category: "unavailable-source",
            unresolved: true,
            resource: "Patient",
            model: "Patient",
            kind: "resource",
            available: false,
            reason: "model-unavailable"
        });
    });

    it("fails and audits unavailable resource definitions", async function () {
        const report = await runTemporalMigrationPreflight({
            catalog: ["Patient"],
            definitions: {},
            includeHistory: false,
            models: {
                Patient: fakeModel([], { find: 0, lean: 0 })
            }
        });

        expect(report.valid).to.equal(false);
        expect(report.summary.unavailableSources).to.equal(1);
        expect(report.sources[0]).to.include({ available: false });
        expect(report.diagnostics[0]).to.include({
            code: "temporal-preflight-source-unavailable",
            reason: "resource-definition-unavailable"
        });
    });
});
