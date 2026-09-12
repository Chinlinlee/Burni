# Overview (/docs/v2/search-parameter/overview)



# Search parameters overview [#search-parameters-overview]

The burni currently support [FHIR search operations](http://www.hl7.org/fhir/search.html) below:

## Search Parameter Types [#search-parameter-types]

* Number
* Date/DateTime
* String
* Token
* Reference

## Parameters for all resources [#parameters-for-all-resources]

* \_id
* \_lastUpdated

## Search result parameters [#search-result-parameters]

* \_count

## Derived indexes and custom SearchParameters [#derived-indexes-and-custom-searchparameters]

The SearchParameter Registry owns query correctness; MongoDB derived indexes only improve query performance. They are separate lifecycle concerns.

First-phase provisioning creates derived indexes for **approved built-in temporal and non-temporal SearchParameters**. Each included lookup must be active, compilable, pass the corresponding index policy, and expose a safe index contract for its extraction/projection branch.

### Non-temporal derived index boundary [#non-temporal-derived-index-boundary]

* **token**: system-code or system-value correlation for Coding/CodeableConcept/Identifier/ContactPoint; `:text` queries are not indexed.
* **reference**: indexes stored `reference` only; `Reference.type` target guards remain runtime filters.
* **string**: equality indexes on exact projected leaves only; default prefix and `:contains` keep regex semantics without B-tree claims.
* **number / quantity**: use existing numeric BSON fields; `sa`, `eb`, and `ap` comparators are not supported in the capability matrix.
* **uri**: raw URI single-field index shared by exact, `:above`, and `:below`.
* **array correlation**: only a single verifiable array scope is admitted; parallel multikey, positional paths, and unsafe branches produce stable rejection diagnostics.

**Custom database SearchParameters** remain executable by default but are **not** added to the desired index manifest, so they do not receive derived indexes. That does not disable the query; it means MongoDB may use COLLSCAN. When performance indexes are missing, run `npm run mongodb:verify` to inspect drift and run `npm run mongodb:provision` as part of deployment.

The expected derived index state is merged into the runtime-generated desired index manifest. See the MongoDB provisioning section in [Deploy](/docs/getting-started/deploy).
