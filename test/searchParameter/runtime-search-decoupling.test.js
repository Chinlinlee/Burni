require("module-alias/register");

const fs = require("fs");
const path = require("path");
const { expect } = require("chai");

const API_SERVICE_ROOT = path.join(__dirname, "../../api/FHIRApiService");
const FHIR_ROOT = path.join(__dirname, "../../api/FHIR");

function listJsFiles(dir) {
    const files = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            files.push(...listJsFiles(fullPath));
            continue;
        }
        if (entry.name.endsWith(".js")) {
            files.push(fullPath);
        }
    }
    return files;
}

function readControllers() {
    const controllers = [];
    for (const resourceDir of fs.readdirSync(FHIR_ROOT)) {
        const controllerDir = path.join(FHIR_ROOT, resourceDir, "controller");
        if (!fs.existsSync(controllerDir)) {
            continue;
        }
        for (const file of fs.readdirSync(controllerDir)) {
            controllers.push(path.join(controllerDir, file));
        }
    }
    return controllers;
}

describe("runtime search decoupling from generated handlers", function () {
    it("does not require paramsSearch in search, condition-delete, or bundle service entry points", function () {
        const searchSource = fs.readFileSync(path.join(API_SERVICE_ROOT, "search.js"), "utf8");
        const conditionDeleteSource = fs.readFileSync(
            path.join(API_SERVICE_ROOT, "condition-delete.js"),
            "utf8"
        );
        const searchServiceSource = fs.readFileSync(
            path.join(API_SERVICE_ROOT, "services/search.service.js"),
            "utf8"
        );
        const bundleServiceSource = fs.readFileSync(
            path.join(API_SERVICE_ROOT, "services/bundle-operations.service.js"),
            "utf8"
        );
        const creatorSource = fs.readFileSync(
            path.join(API_SERVICE_ROOT, "search/searchParameterCreator.js"),
            "utf8"
        );

        expect(searchSource).to.not.include("paramsSearch");
        expect(conditionDeleteSource).to.not.include("paramsSearch");
        expect(searchServiceSource).to.not.include("paramsSearch");
        expect(bundleServiceSource).to.not.match(/ParametersHandler/);
        expect(creatorSource).to.not.include("paramsSearch");
    });

    it("does not import generated ParametersHandler from search or condition-delete controllers", function () {
        const offenders = [];

        for (const filePath of readControllers()) {
            const fileName = path.basename(filePath);
            if (!fileName.startsWith("get") && !fileName.startsWith("condition-delete")) {
                continue;
            }
            if (fileName.includes("History") || fileName.includes("ById")) {
                continue;
            }

            const content = fs.readFileSync(filePath, "utf8");
            if (content.includes("ParametersHandler") || content.includes("paramsSearch")) {
                offenders.push(path.relative(path.join(__dirname, "../.."), filePath));
            }
        }

        expect(offenders, offenders.join("\n")).to.deep.equal([]);
    });

    it("keeps chain-params as the only FHIRApiService module that still references generated handlers", function () {
        const offenders = [];

        for (const filePath of listJsFiles(API_SERVICE_ROOT)) {
            if (filePath.endsWith(`${path.sep}search${path.sep}chain-params.js`)) {
                continue;
            }
            const content = fs.readFileSync(filePath, "utf8");
            if (
                /ParametersHandler\.js/.test(content) ||
                content.includes("paramsSearchFields")
            ) {
                offenders.push(path.relative(path.join(__dirname, "../.."), filePath));
            }
        }

        expect(offenders, offenders.join("\n")).to.deep.equal([]);
    });
});
