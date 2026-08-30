require("module-alias/register");

const { expect } = require("chai");
const mongoose = require("mongoose");
const time = require("@mongodb/FHIRDataTypesSchema/time");
const date = require("@mongodb/FHIRDataTypesSchema/date");
const dateTime = require("@mongodb/FHIRDataTypesSchema/dateTime");
const { Reference } = require("@mongodb/FHIRDataTypesSchema/Reference");
const { HumanName } = require("@mongodb/FHIRDataTypesSchema/HumanName");
const { Timing } = require("@mongodb/FHIRDataTypesSchema/Timing");
const {
    normalizeDate,
    normalizeDateTime,
    serializeDate,
    serializeDateTime
} = require("@models/FHIR/temporal");

function castWithSchema(pathDef, value) {
    const schema = new mongoose.Schema({ value: pathDef }, { _id: false });
    const Model = mongoose.model(`CastTest_${Date.now()}_${Math.random()}`, schema);
    return new Model({ value }).toObject({ getters: true }).value;
}

function validateReference(value) {
    const schema = new mongoose.Schema(
        { reference: Reference.path("reference") },
        { _id: false }
    );
    const doc = new (mongoose.model(`RefTest_${Date.now()}_${Math.random()}`, schema))({
        reference: value
    });
    return doc.validateSync();
}

describe("FHIR datatype persistence", function () {
    it("preserves FHIR time values without timezone conversion", function () {
        expect(castWithSchema(time, "17:00:00")).to.equal("17:00:00");
        expect(castWithSchema(time, "08:30:00")).to.equal("08:30:00");
        expect(castWithSchema(time, "09:30:00.500")).to.equal("09:30:00.500");
    });

    it("preserves partial FHIR date precision", function () {
        for (const scalar of ["1995", "2012-01", "2012-06-01"]) {
            const stored = castWithSchema(date, normalizeDate(scalar));
            expect(serializeDate(stored)).to.equal(scalar);
        }
    });

    it("preserves partial FHIR dateTime precision", function () {
        for (const scalar of ["2004", "2012-06", "2015-02-09T16:04:15.817Z"]) {
            const stored = castWithSchema(dateTime, normalizeDateTime(scalar));
            expect(serializeDateTime(stored)).to.equal(scalar);
        }
    });

    it("accepts absolute references with implementation-specific resource types", function () {
        const absoluteReferences = [
            "http://www.BenefitsInc.com/fhir/oralhealthclaim/15476332402",
            "http://www.BenefitsInc.com/fhir/coverageeligibilityrequest/225476332402",
            "http://benefitsinc.com/fhir/claimresponse/CR12345"
        ];

        for (const reference of absoluteReferences) {
            expect(validateReference(reference), reference).to.equal(undefined);
        }
    });

    it("round-trips HumanName element extensions on family", function () {
        const schema = new mongoose.Schema({ name: HumanName }, { _id: false });
        const Model = mongoose.model(`HumanNameTest_${Date.now()}`, schema);
        const payload = {
            family: "du Marché",
            _family: {
                extension: [
                    {
                        url: "http://hl7.org/fhir/StructureDefinition/humanname-own-prefix",
                        valueString: "VV"
                    }
                ]
            }
        };
        const stored = new Model({ name: payload }).toObject({ getters: true }).name;
        expect(stored).to.deep.equal(payload);
    });

    it("round-trips Timing element extensions on event", function () {
        const schema = new mongoose.Schema({ timing: Timing }, { _id: false });
        const Model = mongoose.model(`TimingTest_${Date.now()}`, schema);
        const payload = {
            _event: [
                {
                    extension: [
                        {
                            url: "http://hl7.org/fhir/StructureDefinition/cqf-expression",
                            valueExpression: {
                                language: "text/cql",
                                expression: "Now()"
                            }
                        }
                    ]
                }
            ]
        };
        const stored = new Model({ timing: payload }).toObject({ getters: true }).timing;
        expect(stored).to.deep.equal(payload);
    });
});
