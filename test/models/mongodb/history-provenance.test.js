require("module-alias/register");

const { expect } = require("chai");
const {
    isHttpProvenanceRequest,
    isHttpProvenanceResponse,
    setHistoryProvenance,
    extractBundleProvenance,
    stripHistoryProvenanceForVread,
    stripInternalProvenanceFields
} = require("@root/models/mongodb/historyProvenance");
const { createBundle } = require("@root/models/FHIR/func");
const { createFakeRequest } = require("../../support/fake-http");

describe("historyProvenance", function () {
    describe("isHttpProvenanceRequest", function () {
        it("returns false for FHIR Reference", function () {
            expect(
                isHttpProvenanceRequest({
                    reference: "http://www.BenefitsInc.com/fhir/coverageeligibilityrequest/225476332402"
                })
            ).to.equal(false);
        });

        it("returns true for HTTP bundle request provenance", function () {
            expect(
                isHttpProvenanceRequest({
                    method: "POST",
                    url: "http://localhost:8080/fhir/CoverageEligibilityResponse/abc/_history/1"
                })
            ).to.equal(true);
        });

        it("returns false when reference coexists with method/url", function () {
            expect(
                isHttpProvenanceRequest({
                    method: "POST",
                    url: "http://localhost/fhir/Patient/1/_history/1",
                    reference: "Patient/1"
                })
            ).to.equal(false);
        });
    });

    describe("isHttpProvenanceResponse", function () {
        it("returns false for FHIR response reference", function () {
            expect(
                isHttpProvenanceResponse({
                    reference: "MessageHeader/abc"
                })
            ).to.equal(false);
        });

        it("returns true for HTTP bundle response provenance", function () {
            expect(isHttpProvenanceResponse({ status: "201" })).to.equal(true);
        });

        it("returns false when method or url are present", function () {
            expect(
                isHttpProvenanceResponse({
                    status: "200",
                    method: "PUT",
                    url: "http://localhost/fhir/Patient/1/_history/2"
                })
            ).to.equal(false);
        });
    });

    describe("setHistoryProvenance", function () {
        it("writes bundleRequest and bundleResponse without touching FHIR request", function () {
            const item = {
                resourceType: "CoverageEligibilityResponse",
                id: "E2500",
                request: {
                    reference: "http://www.BenefitsInc.com/fhir/coverageeligibilityrequest/225476332402"
                }
            };

            setHistoryProvenance(item, {
                method: "PUT",
                url: "http://localhost:8080/fhir/CoverageEligibilityResponse/E2500/_history/2",
                status: 200
            });

            expect(item.bundleRequest).to.deep.equal({
                method: "PUT",
                url: "http://localhost:8080/fhir/CoverageEligibilityResponse/E2500/_history/2"
            });
            expect(item.bundleResponse).to.deep.equal({
                status: "200"
            });
            expect(item.request).to.deep.equal({
                reference: "http://www.BenefitsInc.com/fhir/coverageeligibilityrequest/225476332402"
            });
        });
    });

    describe("stripHistoryProvenanceForVread", function () {
        it("preserves FHIR request and strips bundle provenance fields", function () {
            const doc = {
                _id: "mongo-id",
                __v: 0,
                resourceType: "CoverageEligibilityResponse",
                id: "E2500",
                request: {
                    reference: "http://www.BenefitsInc.com/fhir/coverageeligibilityrequest/225476332402"
                },
                bundleRequest: {
                    method: "POST",
                    url: "http://localhost:8080/fhir/CoverageEligibilityResponse/E2500/_history/1"
                },
                bundleResponse: {
                    status: "201"
                }
            };

            const result = stripHistoryProvenanceForVread(doc);

            expect(result).to.not.have.property("_id");
            expect(result).to.not.have.property("__v");
            expect(result).to.not.have.property("bundleRequest");
            expect(result).to.not.have.property("bundleResponse");
            expect(result.request).to.deep.equal({
                reference: "http://www.BenefitsInc.com/fhir/coverageeligibilityrequest/225476332402"
            });
        });

        it("strips legacy HTTP request/response provenance", function () {
            const doc = {
                resourceType: "ClaimResponse",
                id: "R3500",
                request: {
                    method: "PUT",
                    url: "http://localhost:8080/fhir/ClaimResponse/R3500/_history/2"
                },
                response: {
                    status: "200"
                }
            };

            const result = stripHistoryProvenanceForVread(doc);

            expect(result).to.not.have.property("request");
            expect(result).to.not.have.property("response");
        });

        it("preserves FHIR request while stripping legacy HTTP response", function () {
            const doc = {
                resourceType: "CoverageEligibilityResponse",
                id: "E2500",
                request: {
                    reference: "http://www.BenefitsInc.com/fhir/coverageeligibilityrequest/225476332402"
                },
                response: {
                    status: "200"
                }
            };

            const result = stripHistoryProvenanceForVread(doc);

            expect(result.request).to.deep.equal({
                reference: "http://www.BenefitsInc.com/fhir/coverageeligibilityrequest/225476332402"
            });
            expect(result).to.not.have.property("response");
        });
    });

    describe("extractBundleProvenance", function () {
        it("prefers bundleRequest and bundleResponse", function () {
            const doc = {
                request: {
                    reference: "http://example.com/request"
                },
                bundleRequest: {
                    method: "PUT",
                    url: "http://localhost/fhir/CoverageEligibilityResponse/abc/_history/2"
                },
                bundleResponse: {
                    status: "200"
                }
            };

            expect(extractBundleProvenance(doc)).to.deep.equal({
                request: doc.bundleRequest,
                response: doc.bundleResponse
            });
        });

        it("falls back to legacy HTTP request/response fields", function () {
            const doc = {
                request: {
                    method: "POST",
                    url: "http://localhost/fhir/ClaimResponse/R3500/_history/1"
                },
                response: {
                    status: "201"
                }
            };

            expect(extractBundleProvenance(doc)).to.deep.equal({
                request: doc.request,
                response: doc.response
            });
        });

        it("returns undefined provenance when only FHIR request is present", function () {
            const doc = {
                request: {
                    reference: "http://example.com/request"
                }
            };

            expect(extractBundleProvenance(doc)).to.deep.equal({
                request: undefined,
                response: undefined
            });
        });
    });

    describe("stripInternalProvenanceFields", function () {
        it("removes bundle and legacy HTTP provenance without mutating the source doc", function () {
            const doc = {
                resourceType: "CoverageEligibilityResponse",
                id: "E2500",
                request: {
                    reference: "http://www.BenefitsInc.com/fhir/coverageeligibilityrequest/225476332402"
                },
                bundleRequest: {
                    method: "POST",
                    url: "http://localhost/fhir/CoverageEligibilityResponse/E2500/_history/1"
                },
                bundleResponse: {
                    status: "201"
                }
            };

            const stripped = stripInternalProvenanceFields(doc);

            expect(doc.bundleRequest).to.exist;
            expect(stripped).to.not.have.property("bundleRequest");
            expect(stripped).to.not.have.property("bundleResponse");
            expect(stripped.request).to.deep.equal({
                reference: "http://www.BenefitsInc.com/fhir/coverageeligibilityrequest/225476332402"
            });
        });
    });

    describe("createBundle history path", function () {
        it("places FHIR request on resource and HTTP provenance on entry.request/response", function () {
            const historyDoc = {
                resourceType: "CoverageEligibilityResponse",
                id: "E2500",
                meta: {
                    versionId: "1",
                    lastUpdated: "2014-08-16T00:00:00.000Z"
                },
                request: {
                    reference: "http://www.BenefitsInc.com/fhir/coverageeligibilityrequest/225476332402"
                },
                bundleRequest: {
                    method: "POST",
                    url: "http://localhost:8080/fhir/CoverageEligibilityResponse/E2500/_history/1"
                },
                bundleResponse: {
                    status: "201"
                }
            };

            const req = createFakeRequest({
                params: { id: "E2500" },
                originalUrl: "/CoverageEligibilityResponse/E2500/_history"
            });
            const bundle = createBundle(
                req,
                [historyDoc],
                1,
                0,
                100,
                "CoverageEligibilityResponse",
                { type: "history" }
            );

            expect(bundle.entry).to.have.length(1);
            const entry = bundle.entry[0];
            expect(entry.resource.request).to.deep.equal({
                reference: "http://www.BenefitsInc.com/fhir/coverageeligibilityrequest/225476332402"
            });
            expect(entry.request).to.deep.equal({
                method: "POST",
                url: "http://localhost:8080/fhir/CoverageEligibilityResponse/E2500/_history/1"
            });
            expect(entry.response).to.deep.equal({
                status: "201"
            });
            expect(entry.resource).to.not.have.property("bundleRequest");
            expect(entry.resource).to.not.have.property("bundleResponse");
        });

        it("supports legacy HTTP provenance stored on request/response fields", function () {
            const historyDoc = {
                resourceType: "ClaimResponse",
                id: "R3500",
                meta: {
                    versionId: "2",
                    lastUpdated: "2014-08-16T00:00:00.000Z"
                },
                request: {
                    method: "PUT",
                    url: "http://localhost:8080/fhir/ClaimResponse/R3500/_history/2"
                },
                response: {
                    status: "200"
                }
            };

            const req = createFakeRequest({
                params: { id: "R3500" },
                originalUrl: "/ClaimResponse/R3500/_history"
            });
            const bundle = createBundle(
                req,
                [historyDoc],
                1,
                0,
                100,
                "ClaimResponse",
                { type: "history" }
            );

            expect(bundle.entry).to.have.length(1);
            const entry = bundle.entry[0];
            expect(entry.resource).to.not.have.property("request");
            expect(entry.request).to.deep.equal({
                method: "PUT",
                url: "http://localhost:8080/fhir/ClaimResponse/R3500/_history/2"
            });
            expect(entry.response).to.deep.equal({
                status: "200"
            });
        });
    });
});
