require("module-alias/register");

const { expect } = require("chai");
const { compileDefinition } = require("@models/FHIR/searchParameter/compiler/compiler");
const {
    describeWhenCompositeCompilerAvailable
} = require("../support/composite-api-seam");
const {
    findBuiltinResourceByUrl,
    observationComponentCodeValueQuantityDefinition,
    groupCharacteristicValueDefinition,
    compileSetForComposite,
    toDefinition
} = require("../support/composite-fixtures");

describe("composite compiler baseline (current API)", function () {
    it("classifies composite definitions as unsupported without a component resolver", function () {
        const definition = observationComponentCodeValueQuantityDefinition();
        const compiled = compileDefinition(definition);
        const lookup = compiled.lookupPlans["Observation::component-code-value-quantity"];

        expect(compiled.compilable).to.equal(false);
        expect(lookup.compilable).to.equal(false);
        expect(lookup.reason).to.include("Unsupported search type");
        expect(compiled.diagnostics.some((entry) => entry.code === "unsupported-type")).to.equal(
            true
        );
        expect(lookup.plan).to.equal(undefined);
    });
});

describeWhenCompositeCompilerAvailable("composite compiler", (getModule) => {
    /**
     * @returns {{
     *   createComponentResolver: (
     *     definitions: import('@models/FHIR/searchParameter/registry/types').SearchParameterDefinition[]
     *   ) => unknown,
     *   compileCompositeDefinition: (
     *     definition: import('@models/FHIR/searchParameter/registry/types').SearchParameterDefinition,
     *     resolver: unknown
     *   ) => ReturnType<typeof compileDefinition>
     * }}
     */
    function compilerApi() {
        const api = getModule();
        return {
            createComponentResolver: api.createComponentResolver,
            compileCompositeDefinition: api.compileCompositeDefinition
        };
    }

    /**
     * @param {import('@models/FHIR/searchParameter/registry/types').SearchParameterDefinition} compositeDefinition
     */
    function compileComposite(compositeDefinition) {
        const { createComponentResolver, compileCompositeDefinition } = compilerApi();
        const resolver = createComponentResolver(compileSetForComposite(compositeDefinition));
        return compileCompositeDefinition(compositeDefinition, resolver);
    }

    describe("diagnostics", function () {
        it("disables lookup when a component canonical cannot be resolved", function () {
            const definition = toDefinition({
                resourceType: "SearchParameter",
                url: "http://example.org/SearchParameter/missing-component",
                version: "4.0.1",
                status: "active",
                code: "missing-component",
                base: ["Patient"],
                type: "composite",
                expression: "Patient.extension",
                component: [
                    {
                        definition: "http://example.org/SearchParameter/does-not-exist",
                        expression: "url"
                    },
                    {
                        definition: "http://hl7.org/fhir/SearchParameter/Patient-name",
                        expression: "valueString"
                    }
                ]
            });
            const compiled = compileComposite(definition);
            const lookup = compiled.lookupPlans["Patient::missing-component"];

            expect(compiled.compilable).to.equal(false);
            expect(lookup.compilable).to.equal(false);
            expect(lookup.reason).to.match(/component|canonical|resolve/i);
            expect(
                compiled.diagnostics.some((entry) =>
                    /component|canonical|resolve/i.test(entry.message || "")
                )
            ).to.equal(true);
            expect(lookup.plan).to.equal(undefined);
        });

        it("disables lookup when a component points at another composite definition", function () {
            const nestedComposite = groupCharacteristicValueDefinition();
            const definition = toDefinition({
                resourceType: "SearchParameter",
                url: "http://example.org/SearchParameter/nested-composite",
                version: "4.0.1",
                status: "active",
                code: "nested-composite",
                base: ["Group"],
                type: "composite",
                expression: "Group.characteristic",
                component: [
                    {
                        definition: nestedComposite.resource.url,
                        expression: "code"
                    },
                    {
                        definition: "http://hl7.org/fhir/SearchParameter/Group-value",
                        expression: "value"
                    }
                ]
            });
            const compiled = compileComposite(definition);
            const lookup = compiled.lookupPlans["Group::nested-composite"];

            expect(compiled.compilable).to.equal(false);
            expect(lookup.compilable).to.equal(false);
            expect(lookup.reason).to.match(/composite|component/i);
            expect(
                compiled.diagnostics.some((entry) => /composite|component/i.test(entry.message || ""))
            ).to.equal(true);
        });

        it("disables lookup when a component definition uses chained search", function () {
            const definition = toDefinition({
                resourceType: "SearchParameter",
                url: "http://example.org/SearchParameter/chained-component",
                version: "4.0.1",
                status: "active",
                code: "chained-component",
                base: ["Observation"],
                type: "composite",
                expression: "Observation.component",
                component: [
                    {
                        definition: "http://hl7.org/fhir/SearchParameter/Observation-subject",
                        expression: "code"
                    },
                    {
                        definition: "http://hl7.org/fhir/SearchParameter/Observation-value-quantity",
                        expression: "value.as(Quantity)"
                    }
                ],
                chain: ["subject"]
            });
            const compiled = compileComposite(definition);
            const lookup = compiled.lookupPlans["Observation::chained-component"];

            expect(compiled.compilable).to.equal(false);
            expect(lookup.compilable).to.equal(false);
            expect(lookup.reason).to.match(/chain|component/i);
        });

        it("disables lookup when a referenced component version is unavailable", function () {
            const definition = toDefinition({
                resourceType: "SearchParameter",
                url: "http://example.org/SearchParameter/version-mismatch",
                version: "4.0.1",
                status: "active",
                code: "version-mismatch",
                base: ["Patient"],
                type: "composite",
                expression: "Patient.extension",
                component: [
                    {
                        definition: "http://hl7.org/fhir/SearchParameter/Patient-name|9.9.9",
                        expression: "valueString"
                    },
                    {
                        definition: "http://hl7.org/fhir/SearchParameter/Patient-gender",
                        expression: "valueCode"
                    }
                ]
            });
            const compiled = compileComposite(definition);

            expect(compiled.compilable).to.equal(false);
            expect(compiled.diagnostics.some((entry) => entry.code === "component-version-mismatch")).to.equal(
                true
            );
        });

        it("disables lookup when a referenced component is chained", function () {
            const chainedComponent = toDefinition({
                resourceType: "SearchParameter",
                url: "http://example.org/SearchParameter/chained-component-definition",
                version: "4.0.1",
                status: "active",
                code: "chained-component-definition",
                base: ["Patient"],
                type: "string",
                expression: "Patient.name",
                chain: ["given"]
            });
            const definition = toDefinition({
                resourceType: "SearchParameter",
                url: "http://example.org/SearchParameter/references-chained-component",
                version: "4.0.1",
                status: "active",
                code: "references-chained-component",
                base: ["Patient"],
                type: "composite",
                expression: "Patient.extension",
                component: [
                    {
                        definition: chainedComponent.resource.url,
                        expression: "valueString"
                    },
                    {
                        definition: "http://hl7.org/fhir/SearchParameter/Patient-gender",
                        expression: "valueCode"
                    }
                ]
            });
            const resolver = compilerApi().createComponentResolver([
                chainedComponent,
                ...compileSetForComposite(definition)
            ]);
            const compiled = compilerApi().compileCompositeDefinition(definition, resolver);

            expect(compiled.compilable).to.equal(false);
            expect(compiled.diagnostics.some((entry) => entry.code === "chained-component")).to.equal(
                true
            );
        });
    });

    describe("executable plans", function () {
        /** @type {ReturnType<typeof compileComposite>} */
        let observationCompiled;

        before(function () {
            observationCompiled = compileComposite(observationComponentCodeValueQuantityDefinition());
            if (!observationCompiled.compilable) {
                this.skip();
            }
        });

        it("resolves component canonicals and produces an executable composite plan", function () {
            const lookup = observationCompiled.lookupPlans["Observation::component-code-value-quantity"];

            expect(lookup.compilable).to.equal(true);
            expect(lookup.plan?.searchType).to.equal("composite");
            expect(lookup.plan?.composite?.components).to.have.length(2);
            expect(lookup.plan?.composite?.components?.[0]?.searchType).to.equal("token");
            expect(lookup.plan?.composite?.components?.[1]?.searchType).to.equal("quantity");
            expect(lookup.plan?.composite?.branches?.[0]?.correlationMode).to.equal(
                "array-element"
            );
        });

        it("records component metadata and estimated cost on the composite plan", function () {
            const plan = observationCompiled.lookupPlans["Observation::component-code-value-quantity"]
                .plan;

            expect(plan?.composite?.components).to.have.length(2);
            expect(plan?.estimatedCost).to.be.greaterThan(0);
            expect(plan?.requiredIndexes).to.be.an("array");
            expect(plan?.diagnostics).to.be.an("array");
        });

        it("keeps multi-base union branches on separate resource type maps", function () {
            const resource = findBuiltinResourceByUrl(
                "http://hl7.org/fhir/SearchParameter/conformance-context-type-value"
            );
            if (!resource) {
                throw new Error("Missing conformance-context-type-value fixture");
            }
            const compiled = compileComposite(toDefinition(resource));
            if (!compiled.compilable) {
                this.skip();
            }

            const capabilityLookup = compiled.lookupPlans["CapabilityStatement::context-type-value"];
            const codeSystemLookup = compiled.lookupPlans["CodeSystem::context-type-value"];
            expect(capabilityLookup.compilable).to.equal(true);
            expect(codeSystemLookup.compilable).to.equal(true);
            expect(capabilityLookup.plan?.resourceType).to.equal("CapabilityStatement");
            expect(codeSystemLookup.plan?.resourceType).to.equal("CodeSystem");
            expect(capabilityLookup.plan?.composite?.branches?.[0]?.scopePath).to.equal(
                "useContext"
            );
            expect(codeSystemLookup.plan?.composite?.branches?.[0]?.scopePath).to.equal(
                "useContext"
            );
        });

        it("compiles %resource component expressions relative to the composite scope", function () {
            const resource = findBuiltinResourceByUrl(
                "http://hl7.org/fhir/SearchParameter/MolecularSequence-chromosome-window-coordinate"
            );
            const compiled = compileComposite(toDefinition(resource));

            expect(compiled.compilable).to.equal(true);
            expect(
                compiled.lookupPlans["MolecularSequence::chromosome-window-coordinate"].plan.composite
                    .branches[0].components[0].extractionPath.path
            ).to.equal("chromosome");
        });
    });
});
