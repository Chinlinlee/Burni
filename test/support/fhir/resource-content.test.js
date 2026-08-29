require("module-alias/register");

const { expect } = require("chai");
const {
    normalizeComparableContent,
    stripServerManagedContent
} = require("../../support/fhir/resource-content");

describe("FHIR resource content normalization", function () {
    it("removes top-level id and volatile meta fields", function () {
        const normalized = stripServerManagedContent({
            resourceType: "Patient",
            id: "server-id",
            meta: {
                versionId: "2",
                lastUpdated: "2026-01-01T00:00:00.000Z",
                profile: ["http://example.org/Patient"]
            },
            gender: "male"
        });

        expect(normalized).to.deep.equal({
            resourceType: "Patient",
            meta: {
                profile: ["http://example.org/Patient"]
            },
            gender: "male"
        });
    });

    it("normalizes nested contained resources", function () {
        const normalized = stripServerManagedContent({
            resourceType: "Bundle",
            id: "bundle-id",
            entry: [
                {
                    resource: {
                        resourceType: "Patient",
                        id: "contained-id",
                        meta: {
                            versionId: "1",
                            lastUpdated: "2026-01-01T00:00:00.000Z"
                        },
                        gender: "female"
                    }
                }
            ]
        });

        expect(normalized.entry[0].resource).to.deep.equal({
            resourceType: "Patient",
            gender: "female"
        });
    });

    it("normalizes equivalent dateTime strings", function () {
        expect(normalizeComparableContent({
            resourceType: "Account",
            servicePeriod: {
                start: "2016-01-01T00:00:00+00:00",
                end: "2016-06-30T00:00:00+00:00"
            }
        })).to.deep.equal({
            resourceType: "Account",
            servicePeriod: {
                start: "2016-01-01",
                end: "2016-06-30"
            }
        });
    });

    it("normalizes zulu dateTime strings consistently", function () {
        expect(
            normalizeComparableContent({ date: "2017-03-03T14:06:00+00:00" }).date
        ).to.equal(normalizeComparableContent({ date: "2017-03-03T14:06:00Z" }).date);
    });
});
