require("module-alias/register");

const express = require("express");
const { expect } = require("chai");
const { startServer } = require("../../../server/bootstrap");

describe("server bootstrap provisioning gate", function () {
    it("does not listen when application readiness fails", async function () {
        let listened = false;
        const app = express();

        await startServer(app, {
            readyPromise: Promise.reject(new Error("simulated readiness failure")),
            configureDatabaseDependentMiddleware: () => {},
            listen: () => {
                listened = true;
            },
            throwOnFailure: true
        }).catch(() => {});

        expect(listened).to.equal(false);
    });

    it("listens after application readiness resolves", async function () {
        let listened = false;
        const app = express();

        await startServer(app, {
            readyPromise: Promise.resolve(),
            configureDatabaseDependentMiddleware: () => {},
            listen: (_port, callback) => {
                listened = true;
                callback();
            },
            throwOnFailure: true,
            port: 0
        });

        expect(listened).to.equal(true);
    });
});
