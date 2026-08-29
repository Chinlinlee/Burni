require("module-alias/register");

const fs = require("fs");
const path = require("path");
const { expect } = require("chai");
const {
    getGeneratedApiFiles
} = require("../../api_generator/API_Generator_V2");

const GENERATOR_PATH = path.join(
    __dirname,
    "../../api_generator/API_Generator_V2.js"
);

function fhirParametersCleanCacheKeys() {
    return Object.keys(require.cache).filter((id) =>
        id.replace(/\\/g, "/").endsWith("/api_generator/FHIRParametersClean.json")
    );
}

function generatedContents(resourceType) {
    return Object.values(getGeneratedApiFiles(resourceType)).join("\n");
}

describe("API generator without SearchParameter handlers", function () {
    it("does not load FHIRParametersClean.json when producing API files", function () {
        for (const key of fhirParametersCleanCacheKeys()) {
            delete require.cache[key];
        }
        getGeneratedApiFiles("Patient");
        expect(fhirParametersCleanCacheKeys()).to.deep.equal([]);
    });

    it("does not emit a SearchParameter handler file", function () {
        const files = getGeneratedApiFiles("Patient");
        const generatorSource = fs.readFileSync(GENERATOR_PATH, "utf8");
        expect(Object.keys(files)).to.not.include("PatientParametersHandler.js");
        expect(generatorSource).to.not.include("FHIRParametersClean");
        expect(generatorSource).to.not.include("searchParametersCodeGenerator");
        expect(generatorSource).to.not.include("ParametersHandler.js");
    });

    it("still emits CRUD, history, and validation controllers", function () {
        const files = getGeneratedApiFiles("Patient");
        const contents = generatedContents("Patient");

        expect(files).to.have.property("controller/postPatient.js");
        expect(files).to.have.property("controller/getPatientById.js");
        expect(files).to.have.property("controller/putPatient.js");
        expect(files).to.have.property("controller/deletePatient.js");
        expect(files).to.have.property("controller/getPatientHistory.js");
        expect(files).to.have.property("controller/getPatientHistoryById.js");
        expect(files).to.have.property("controller/postPatientValidate.js");
        expect(files).to.have.property("index.js");

        expect(contents).to.include("FHIRApiService/create");
        expect(contents).to.include("FHIRApiService/read");
        expect(contents).to.include("FHIRApiService/update.js");
        expect(contents).to.include("FHIRApiService/delete");
        expect(contents).to.include("FHIRApiService/history");
        expect(contents).to.include("FHIRApiService/vread");
        expect(contents).to.include("FHIRApiService/$validate");
    });
});
