const { expect } = require("chai");
const jsonPath = require("jsonpath");

describe("jsonpath compatibility", () => {
    const patientWithReference = {
        resourceType: "Patient",
        managingOrganization: {
            reference: "Organization/org-1"
        }
    };

    const bundleEntry = [
        {
            fullUrl: "urn:uuid:entry-a",
            resource: {
                resourceType: "Patient",
                subject: { reference: "urn:uuid:entry-b" }
            }
        },
        {
            fullUrl: "urn:uuid:entry-b",
            resource: { resourceType: "Observation" }
        }
    ];

    const questionnaireWithCollection = {
        resourceType: "Questionnaire",
        item: [
            {
                linkId: "group-1",
                type: "group",
                collection: [{ linkId: "q1", type: "string" }]
            }
        ]
    };

    it("finds reference paths with $..reference", () => {
        const paths = jsonPath
            .paths(patientWithReference, "$..reference")
            .map((path) => path.join(".").substring(2));

        expect(paths).to.deep.equal(["managingOrganization.reference"]);
    });

    it("finds reference nodes with $..reference", () => {
        const nodes = jsonPath.nodes(patientWithReference, "$..reference");

        expect(nodes).to.have.length(1);
        expect(nodes[0].value).to.equal("Organization/org-1");
    });

    it("finds collection nodes with $..collection", () => {
        const nodes = jsonPath.nodes(questionnaireWithCollection, "$..collection");

        expect(nodes).to.have.length(1);
        expect(nodes[0].value).to.deep.equal([{ linkId: "q1", type: "string" }]);
    });

    it("finds bundle entry resources with $.entry[*].resource", () => {
        const resources = jsonPath.query(
            { entry: bundleEntry },
            "$.entry[*].resource"
        );

        expect(resources).to.have.length(2);
        expect(resources[0].resourceType).to.equal("Patient");
    });

    it("finds bundle entry references via item query used in sorting", () => {
        const references = jsonPath.query(bundleEntry[0], "$.resource..reference");

        expect(references).to.deep.equal(["urn:uuid:entry-b"]);
    });

    it("finds all references in sorted entry wrappers with $..reference", () => {
        const sortedEntry = bundleEntry.map((item, idx) => ({ item, idx }));
        const references = jsonPath.nodes(sortedEntry, "$..reference");

        expect(references).to.have.length(1);
        expect(references[0].value).to.equal("urn:uuid:entry-b");
    });

    it("blocks prototype pollution keys introduced in 1.3.0", () => {
        const target = { safe: "ok" };

        expect(() => jsonPath.value(target, "$['__proto__'].polluted", "bad")).to.throw();
        expect(Object.prototype).to.not.have.property("polluted");
    });
});
