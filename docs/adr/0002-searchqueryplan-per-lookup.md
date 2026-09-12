---
status: accepted
---

# SearchQueryPlan per lookup, not per canonical SearchParameter

A FHIR SearchParameter often lists several `base` types and a union expression (`Patient.address | Person.address`). Compiling that once and attaching one plan to the canonical definition makes Patient search use Person paths, and makes datatype lookup use the wrong Resource type map (`Patient.name` is HumanName, `Location.name` is string). Each `(resourceType, code)` lookup therefore gets its own `SearchQueryPlan` of typed extraction paths (path + FHIR datatype). The SearchParameter resource stays shared; the plan does not.

## Considered Options

- One `compiledPlan` on the canonical definition, `resourceType` taken from `base[0]`. Rejected: cross-resource union branches leak into the wrong collection, and the compiler cannot type `name` without the lookup resource.
- Infer datatype from the last path segment (`name` → HumanName, `address` → Address). Rejected: `Location.name` is string.
- Look up mongoose Schema objects at request time. Rejected: `.type` is a Schema class, not a FHIR datatype name, and the plan would no longer be a replayable snapshot artifact.

## Consequences

- Snapshot indexes plans by lookup key. Executor never guesses datatype from the parameter code.
- `as` / `ofType` become Choice element names (`deceasedDateTime`) in the compiler, then typed from the Resource type map (`to-code-use-definition`), not from concatenating the FHIRPath type token.
- Union branches for other `base` types are dropped from that lookup's plan, not executed against the wrong resource.
