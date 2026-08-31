require("module-alias/register");

const { expect } = require("chai");
const {
    generateTemporalIndexManifest,
    generateTemporalIndexManifestWithDiagnostics
} = require("@models/FHIR/searchParameter/indexes/indexGenerator");
const {
    validateTemporalIndexManifest
} = require("@models/FHIR/searchParameter/indexes/indexValidation");

function definition(canonicalKey, lookupKey, plan, effectiveStatus = "active") {
    return {
        canonicalKey,
        effectiveStatus,
        resource: {
            code: lookupKey.split("::")[1]
        },
        lookupPlans: {
            [lookupKey]: {
                compilable: true,
                plan
            }
        }
    };
}

function plan(resourceType, code, searchType, extractionPaths) {
    return {
        resourceType,
        code,
        searchType,
        extractionPaths
    };
}

describe("temporal search index generation", function () {
    it("generates the three temporal index shapes", function () {
        const manifest = generateTemporalIndexManifest([
            definition(
                "date",
                "Patient::birthdate",
                plan("Patient", "birthdate", "date", [
                    { path: "birthDate", datatype: "date" }
                ])
            ),
            definition(
                "date-time",
                "Observation::effective",
                plan("Observation", "effective", "date", [
                    { path: "effectiveDateTime", datatype: "dateTime" }
                ])
            ),
            definition(
                "instant",
                "Observation::issued",
                plan("Observation", "issued", "date", [
                    { path: "issued", datatype: "instant" }
                ])
            )
        ]);

        expect(manifest.indexes).to.have.length(3);
        expect(manifest.indexes.map((entry) => entry.indexKind)).to.have.members([
            "date-calendar-boundary",
            "dateTime-decimal-boundary",
            "instant-epoch"
        ]);
        const dateIndex = manifest.indexes.find((entry) => entry.datatype === "date");
        const dateTimeIndex = manifest.indexes.find((entry) => entry.datatype === "dateTime");
        const instantIndex = manifest.indexes.find((entry) => entry.datatype === "instant");
        expect(dateIndex.key).to.deep.equal({
            "birthDate.normalizedStart": 1,
            "birthDate.normalizedEnd": 1
        });
        expect(dateIndex.bsonType).to.equal("string");
        expect(dateTimeIndex.bsonType).to.equal("decimal");
        expect(instantIndex.key).to.deep.equal({ "issued.epochSeconds": 1 });
        expect(JSON.stringify(manifest)).to.not.include("legacy");
        expect(JSON.stringify(manifest)).to.not.include(".value");
        expect(validateTemporalIndexManifest(manifest).valid).to.equal(true);
    });

    it("keeps nested, choice, Period, and array metadata", function () {
        const manifest = generateTemporalIndexManifest([
            definition(
                "nested-choice",
                "Observation::component-date",
                plan("Observation", "component-date", "date", [
                    {
                        path: "component.valueDateTime",
                        datatype: "dateTime",
                        arrayPaths: ["component"]
                    }
                ])
            ),
            definition(
                "period",
                "CarePlan::activity-date",
                plan("CarePlan", "activity-date", "date", [
                    {
                        path: "activity.detail.scheduledPeriod",
                        datatype: "Period",
                        arrayPaths: ["activity"]
                    }
                ])
            )
        ]);

        const nested = manifest.indexes.find((entry) => entry.datatype === "dateTime");
        const period = manifest.indexes.find((entry) => entry.datatype === "Period");
        expect(nested.fields).to.deep.equal([
            "component.valueDateTime.normalizedStart",
            "component.valueDateTime.normalizedEnd"
        ]);
        expect(nested.compatibility).to.include({
            requiresElementCorrelation: true
        });
        expect(nested.compatibility.arrayPaths).to.deep.equal(["component"]);
        expect(period.fields).to.deep.equal([
            "activity.detail.scheduledPeriod.start.normalizedStart",
            "activity.detail.scheduledPeriod.end.normalizedEnd"
        ]);
        expect(period.compatibility.isPeriod).to.equal(true);
        expect(period.compatibility.mongo.explain).to.equal("deferred-to-7.2");
    });

    it("filters disabled, non-temporal, and invalid extraction paths", function () {
        const input = [
            definition(
                "disabled",
                "Patient::disabled",
                plan("Patient", "disabled", "date", [
                    { path: "birthDate", datatype: "date" }
                ]),
                "disabled"
            ),
            definition(
                "invalid",
                "Patient::invalid",
                plan("Patient", "invalid", "date", [
                    { path: "notARealPath", datatype: "date" }
                ])
            ),
            definition(
                "positional",
                "Observation::positional",
                plan("Observation", "positional", "date", [
                    { path: "component.0.valueDateTime", datatype: "dateTime" }
                ])
            ),
            definition(
                "string",
                "Patient::name",
                plan("Patient", "name", "string", [
                    { path: "birthDate", datatype: "date" }
                ])
            )
        ];

        const result = generateTemporalIndexManifestWithDiagnostics(input);
        expect(result.manifest.indexes).to.deep.equal([]);
        expect(result.diagnostics).to.deep.include({
            code: "invalid-temporal-extraction-path",
            resourceType: "Patient",
            lookupKey: "Patient::invalid",
            path: "notARealPath"
        });
        expect(result.diagnostics).to.deep.include({
            code: "invalid-temporal-extraction-path",
            resourceType: "Observation",
            lookupKey: "Observation::positional",
            path: "component.0.valueDateTime"
        });
    });

    it("is deterministic and deduplicates identical paths", function () {
        const inputs = [
            definition(
                "b",
                "Patient::b",
                plan("Patient", "b", "date", [{ path: "birthDate", datatype: "date" }])
            ),
            definition(
                "a",
                "Patient::a",
                plan("Patient", "a", "date", [{ path: "birthDate", datatype: "date" }])
            )
        ];

        const first = generateTemporalIndexManifest(inputs);
        const second = generateTemporalIndexManifest([...inputs].reverse());
        expect(JSON.stringify(first)).to.equal(JSON.stringify(second));
        expect(first.indexes).to.have.length(1);
        expect(first.indexes[0].sources.lookupKeys).to.deep.equal([
            "Patient::a",
            "Patient::b"
        ]);
        expect(first.indexes[0].name).to.match(/^fhir_temporal_[a-f0-9]{20}$/);
    });

    it("validates manifest paths against resource metadata", function () {
        const manifest = generateTemporalIndexManifest([
            definition(
                "valid",
                "Patient::birthdate",
                plan("Patient", "birthdate", "date", [
                    { path: "birthDate", datatype: "date" }
                ])
            )
        ]);
        manifest.indexes[0].extractionPath = "notARealPath";

        const result = validateTemporalIndexManifest(manifest);

        expect(result.valid).to.equal(false);
        expect(result.errors.some((error) => error.includes("extraction path"))).to.equal(
            true
        );
    });

    it("requires compiled plans when plan validation is enabled", function () {
        const manifest = generateTemporalIndexManifest([
            definition(
                "valid",
                "Patient::birthdate",
                plan("Patient", "birthdate", "date", [
                    { path: "birthDate", datatype: "date" }
                ])
            )
        ]);

        const emptyPlans = validateTemporalIndexManifest(manifest, {
            plans: [],
            requirePlans: true
        });
        const matchingPlan = validateTemporalIndexManifest(manifest, {
            plans: [
                plan("Patient", "birthdate", "date", [
                    { path: "birthDate", datatype: "date" }
                ])
            ],
            requirePlans: true
        });

        expect(emptyPlans.valid).to.equal(false);
        expect(emptyPlans.errors).to.include(
            "Temporal index manifest plan validation requires compiled plans"
        );
        expect(matchingPlan.valid).to.equal(true);
    });
});
