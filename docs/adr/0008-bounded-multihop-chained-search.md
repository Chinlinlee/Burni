---
status: accepted
---

# Bounded multi-hop chained search

Phase one froze chained search at a single hop and called a second dot a recursive chain. That word was wrong: FHIR chained search is a client-specified dotted path, not a graph walk. Burni will compose relation hops recursively so `Observation?subject.organization.name=` and `Organization?partof.partof.name=` work, and will bound them with relation depth, relation cost, and a type filter on every open reference target.

## Considered Options

- Follow the same reference along the resource graph until a cycle or budget stops it. Rejected: that is not FHIR chained search, and it does not belong on dotted parameter names.
- Treat a repeated `(resourceType, code)` as a relation cycle. Rejected: it forbids legal hierarchy chains such as `partof.partof`. Data-level reference loops do not make a finite `$lookup` pipeline unbounded, so there is no separate cycle limit.
- Fan out an official 145-type `target` list the same way as `Patient|Group`. Rejected: R4 never stores `Resource` as a target token; those 145-type lists are the open case and would explode without a type filter.
- Keep `MAX_RELATION_COST` shared with `MAX_QUERY_COST` (10) and the old `source + target + 3` formula. Rejected: two hops already scrape the cap, three hops fail, and four closed targets cost the same as one.
- Cap cost on the whole HTTP request. Rejected: the error can no longer name the parameter that blew the budget. A request may still stack several paths; that residual is accepted.
- Return every chain failure as `Unknown search parameter`. Rejected: `Composition.subject.name` would look unsupported instead of missing `subject:Patient`. Unknown hops stay unknown; missing type filter, depth, and cost get their own 400 OperationOutcome diagnostics.
- Fold `_include` / `_revinclude` / `_has` into this decision. Rejected: include is a post-search fetch, and `_has` does not exist. The same chain rules apply to normal search, Bundle GET validation, and conditional delete.

## Consequences

- `MAX_RELATION_DEPTH` is 3. Depth is the number of dots in the parameter name.
- `MAX_RELATION_COST` is 24 per chained search path. Cost sums, at each hop, a fixed lookup overhead plus each executable target plan's `estimatedCost`, multiplied by the fan-out width of that hop. It does not share `MAX_QUERY_COST`.
- A closed hop without a type filter continues only on declared reference target types that have an effective lookup for the next code. Zero matches is unknown, not an empty hit-set. Each reference target type uses its own plan; last-plan-wins is a defect.
- An open reference target hop without a type filter is rejected before cost is applied.
- Contained `Resource` extraction paths stay unchainable. They are not collections, and they are not open reference targets.
- Empty chain allowlist still means any effective next-hop lookup. A non-empty list still restricts codes.
- The fhirpath-mongo-query "phase one / one-level / block recursive chain" requirement has to be replaced before runtime changes. This ADR does not by itself ship the executor.
