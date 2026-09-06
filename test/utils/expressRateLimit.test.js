require("module-alias/register");

const http = require("http");
const express = require("express");
const { expect } = require("chai");
const rateLimit = require("express-rate-limit");

describe("express-rate-limit compatibility", function () {
    it("applies the production limiter config with standard rate-limit headers", async function () {
        const app = express();
        const limiter = rateLimit({
            windowMs: 1 * 60 * 1000,
            max: 1000,
            standardHeaders: true,
            legacyHeaders: false
        });

        app.use(limiter);
        app.get("/health", (_req, res) => {
            res.status(200).send("ok");
        });

        const server = http.createServer(app);

        await new Promise((resolve, reject) => {
            server.once("error", reject);
            server.listen(0, "127.0.0.1", resolve);
        });

        try {
            const address = server.address();
            const response = await new Promise((resolve, reject) => {
                const request = http.get(
                    `http://127.0.0.1:${address.port}/health`,
                    {
                        agent: false,
                        headers: { connection: "close" }
                    },
                    (res) => {
                        let body = "";
                        res.setEncoding("utf8");
                        res.on("data", (chunk) => {
                            body += chunk;
                        });
                        res.on("end", () => {
                            resolve({
                                status: res.statusCode,
                                headers: res.headers,
                                body
                            });
                        });
                    }
                );
                request.on("error", reject);
            });

            expect(response.status).to.equal(200);
            expect(response.body).to.equal("ok");
            expect(response.headers).to.have.property("ratelimit-limit");
            expect(response.headers).to.have.property("ratelimit-remaining");
            expect(response.headers).to.not.have.property("x-ratelimit-limit");
        } finally {
            await new Promise((resolve, reject) => {
                server.close((error) => (error ? reject(error) : resolve()));
            });
        }
    });
});
