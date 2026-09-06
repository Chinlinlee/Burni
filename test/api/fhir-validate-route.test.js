require("module-alias/register");
require("rootpath")();

const express = require("express");
const { expect } = require("chai");
const { getGeneratedApiFiles } = require("../../api_generator/API_Generator_V2");

describe("FHIR $validate route paths", () => {
    it("registers literal /$validate routes under Express 5", () => {
        const router = express.Router();
        router.post("/$validate", (req, res) => {
            res.sendStatus(204);
        });

        const app = express();
        app.use("/Patient", router);

        const layer = router.stack.find(
            (entry) => entry.route && entry.route.path === "/$validate"
        );

        expect(layer).to.exist;
    });

    it("loads generated resource routers with literal /$validate paths", () => {
        const files = getGeneratedApiFiles("Patient");

        expect(files["index.js"]).to.include("router.post('/$validate'");
        expect(files["index.js"]).to.not.include("([\\$])validate");
    });

    it("loads an existing FHIR resource router without path-to-regexp errors", () => {
        const router = require("@root/api/FHIR/Account");
        const validateRoute = router.stack.find(
            (entry) => entry.route && entry.route.path === "/$validate"
        );

        expect(validateRoute).to.exist;
        expect(validateRoute.route.methods.post).to.equal(true);
    });
});
