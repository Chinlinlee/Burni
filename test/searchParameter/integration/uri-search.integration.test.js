require("module-alias/register");

const { expect } = require("chai");
const mongoose = require("mongoose");
const { executeSearchQueryPlan } = require("@models/FHIR/searchParameter/executor/mongoExecutor");
const {
    startMongoMemory,
    dropMongoTestDatabase,
    stopMongoMemory
} = require("../../support/mongo-memory");

function uriPlan(path = "url") {
    return {
        estimatedCost: 1,
        searchType: "uri",
        code: path,
        extractionPaths: [{ path, datatype: "uri" }],
        modifiers: ["below", "above"]
    };
}

async function seedCollection(collectionName, documents) {
    const collection = mongoose.connection.collection(collectionName);
    await collection.drop().catch(() => undefined);
    await collection.insertMany(documents);
}

async function queryHitSet(collectionName, filter) {
    const collection = mongoose.connection.collection(collectionName);
    const findMatches = await collection.find(filter).toArray();
    const aggregateMatches = await collection.aggregate([{ $match: filter }]).toArray();
    const findRoles = findMatches.map((entry) => entry.role).sort();
    const aggregateRoles = aggregateMatches.map((entry) => entry.role).sort();

    expect(findRoles).to.deep.equal(
        aggregateRoles,
        `find and aggregate hit-sets diverged for ${collectionName}`
    );

    return findRoles;
}

describe("URI search execution", function () {
    before(async function () {
        this.timeout(120000);
        await startMongoMemory();
    });

    after(async function () {
        await dropMongoTestDatabase();
        await stopMongoMemory();
        await mongoose.disconnect();
    });

    describe("exact hit-set", function () {
        beforeEach(async function () {
            await seedCollection("uri_exact", [
                { role: "exact-hit", url: "http://Example.org/FHIR?x=1#frag" },
                { role: "case-miss", url: "http://example.org/fhir?x=1#frag" },
                { role: "query-miss", url: "http://Example.org/FHIR" },
                { role: "fragment-miss", url: "http://Example.org/FHIR?x=1" },
                { role: "relative-hit", url: "Patient/example" },
                { role: "urn-hit", url: "urn:oid:1.2.3" }
            ]);
        });

        it("matches only the raw stored uri string", async function () {
            const filter = executeSearchQueryPlan(
                uriPlan(),
                "http://Example.org/FHIR?x=1#frag",
                "url"
            );

            expect(await queryHitSet("uri_exact", filter)).to.deep.equal(["exact-hit"]);
        });

        it("matches relative and urn exact values", async function () {
            const relativeFilter = executeSearchQueryPlan(uriPlan(), "Patient/example", "url");
            const urnFilter = executeSearchQueryPlan(uriPlan(), "urn:oid:1.2.3", "url");

            expect(await queryHitSet("uri_exact", relativeFilter)).to.deep.equal(["relative-hit"]);
            expect(await queryHitSet("uri_exact", urnFilter)).to.deep.equal(["urn-hit"]);
        });

        it("does not decode percent-encoding for exact search", async function () {
            await seedCollection("uri_exact_encoding", [
                { role: "encoded-hit", url: "http://acme.org/a%2Fb" },
                { role: "decoded-miss", url: "http://acme.org/a/b" }
            ]);

            const encodedFilter = executeSearchQueryPlan(
                uriPlan(),
                "http://acme.org/a%2Fb",
                "url"
            );
            const decodedFilter = executeSearchQueryPlan(uriPlan(), "http://acme.org/a/b", "url");

            expect(await queryHitSet("uri_exact_encoding", encodedFilter)).to.deep.equal([
                "encoded-hit"
            ]);
            expect(await queryHitSet("uri_exact_encoding", decodedFilter)).to.deep.equal([
                "decoded-miss"
            ]);
        });

        it("does not strip canonical version suffixes for exact search", async function () {
            await seedCollection("uri_exact_version", [
                {
                    role: "versioned-hit",
                    url: "http://acme.org/fhir/ValueSet/example|1.0"
                },
                { role: "unversioned-miss", url: "http://acme.org/fhir/ValueSet/example" }
            ]);

            const versionedFilter = executeSearchQueryPlan(
                uriPlan(),
                "http://acme.org/fhir/ValueSet/example|1.0",
                "url"
            );
            const unversionedFilter = executeSearchQueryPlan(
                uriPlan(),
                "http://acme.org/fhir/ValueSet/example",
                "url"
            );

            expect(await queryHitSet("uri_exact_version", versionedFilter)).to.deep.equal([
                "versioned-hit"
            ]);
            expect(await queryHitSet("uri_exact_version", unversionedFilter)).to.deep.equal([
                "unversioned-miss"
            ]);
        });
    });

    describe(":below hit-set", function () {
        beforeEach(async function () {
            await seedCollection("uri_below", [
                { role: "prefix-hit", url: "http://acme.org/fhir" },
                { role: "descendant-hit", url: "http://acme.org/fhir/Patient/1" },
                { role: "boundary-miss", url: "http://acme.org/fhirx" },
                { role: "case-miss", url: "HTTP://acme.org/fhir" },
                { role: "trailing-slash-miss", url: "http://acme.org/fhir/" }
            ]);
        });

        it("matches descendants with path boundaries and case sensitivity", async function () {
            const filter = executeSearchQueryPlan(
                uriPlan(),
                "http://acme.org/fhir",
                "url:below"
            );

            expect(await queryHitSet("uri_below", filter)).to.deep.equal([
                "descendant-hit",
                "prefix-hit"
            ]);
        });

        it("preserves trailing slash semantics for :below", async function () {
            await seedCollection("uri_below_trailing", [
                { role: "slash-hit", url: "http://acme.org/fhir/" },
                { role: "no-slash-miss", url: "http://acme.org/fhir" }
            ]);

            const filter = executeSearchQueryPlan(
                uriPlan(),
                "http://acme.org/fhir/",
                "url:below"
            );

            expect(await queryHitSet("uri_below_trailing", filter)).to.deep.equal(["slash-hit"]);
        });
    });

    describe(":above hit-set", function () {
        beforeEach(async function () {
            await seedCollection("uri_above", [
                { role: "root-hit", url: "http://acme.org" },
                { role: "ancestor-hit", url: "http://acme.org/fhir" },
                { role: "same-hit", url: "http://acme.org/fhir/Patient/1" },
                { role: "descendant-miss", url: "http://acme.org/fhir/Patient/1/extra" },
                { role: "sibling-miss", url: "http://acme.org/fhir/Patient/2" }
            ]);
        });

        it("matches stored ancestors using $in", async function () {
            const filter = executeSearchQueryPlan(
                uriPlan(),
                "http://acme.org/fhir/Patient/1",
                "url:above"
            );

            expect(filter.url).to.have.property("$in");
            expect(await queryHitSet("uri_above", filter)).to.deep.equal([
                "ancestor-hit",
                "root-hit",
                "same-hit"
            ]);
        });

        it("does not include query or fragment in the $in prefix set", async function () {
            const filter = executeSearchQueryPlan(
                uriPlan(),
                "http://acme.org/fhir/Patient/1?x=1#frag",
                "url:above"
            );

            expect(filter.url.$in.every((entry) => !entry.includes("?") && !entry.includes("#"))).to
                .be.true;
        });
    });

    describe("case-sensitive hierarchy hit-set", function () {
        it("matches :below only for the same scheme and authority casing", async function () {
            await seedCollection("uri_case_below", [
                { role: "mixed-below-hit", url: "HTTP://Example.ORG/fhir" },
                { role: "mixed-below-descendant", url: "HTTP://Example.ORG/fhir/Patient/1" },
                { role: "lower-case-miss", url: "http://example.org/fhir" },
                { role: "scheme-case-miss", url: "http://Example.ORG/fhir" }
            ]);

            const filter = executeSearchQueryPlan(
                uriPlan(),
                "HTTP://Example.ORG/fhir",
                "url:below"
            );

            expect(await queryHitSet("uri_case_below", filter)).to.deep.equal([
                "mixed-below-descendant",
                "mixed-below-hit"
            ]);
        });

        it("matches :above only for stored values in the raw-case $in prefix set", async function () {
            await seedCollection("uri_case_above", [
                { role: "mixed-above-root", url: "HTTP://Example.ORG" },
                { role: "mixed-above-ancestor", url: "HTTP://Example.ORG/fhir" },
                { role: "lower-case-miss", url: "http://example.org/fhir" },
                { role: "scheme-case-miss", url: "http://Example.ORG/fhir" },
                { role: "query-stored-miss", url: "HTTP://Example.ORG/fhir?x=1" }
            ]);

            const filter = executeSearchQueryPlan(
                uriPlan(),
                "HTTP://Example.ORG/fhir/Patient/1",
                "url:above"
            );

            expect(filter.url.$in).to.include("HTTP://Example.ORG/fhir");
            expect(filter.url.$in).to.not.include("http://example.org/fhir");
            expect(await queryHitSet("uri_case_above", filter)).to.deep.equal([
                "mixed-above-ancestor",
                "mixed-above-root"
            ]);
        });
    });
});
