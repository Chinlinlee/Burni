require("module-alias/register");

const http = require("http");
const express = require("express");
const { expect } = require("chai");
const configureRoutes = require("../routes");

describe("application routes", function () {
    it("registers the fallback routes with Express 5", function () {
        expect(() =>
            configureRoutes.registerFallbackRoutes(express())
        ).not.to.throw();
    });

    it("returns JSON 404 responses for fallback route roots and descendants", async function () {
        const app = express();
        configureRoutes.registerFallbackRoutes(app);
        const server = http.createServer(app);

        await new Promise((resolve, reject) => {
            server.once("error", reject);
            server.listen(0, "127.0.0.1", resolve);
        });

        try {
            const address = server.address();
            const paths = ["/api", "/api/resource", "/auth", "/web/page"];

            for (const routePath of paths) {
                const response = await new Promise((resolve, reject) => {
                    const request = http.get(
                        `http://127.0.0.1:${address.port}${routePath}`,
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
                                    body: JSON.parse(body)
                                });
                            });
                        }
                    );
                    request.on("error", reject);
                });

                expect(response.status).to.equal(404);
                expect(response.body).to.deep.equal({
                    status: 404,
                    message: "not found"
                });
            }
        } finally {
            await new Promise((resolve, reject) => {
                server.close((error) => (error ? reject(error) : resolve()));
            });
        }
    });
});
