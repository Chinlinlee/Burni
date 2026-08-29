---
status: accepted
---

# Search-type projection matches the existing API field set

Registry search must match stored FHIR JSON, not the expression's datatype root (`address`, `code`, `subject`). The executor therefore projects by `(search type, FHIR datatype)`: Address string fields, CodeableConcept `coding`, Reference `.reference`, and so on. This phase keeps Burni's current field sets, not the rest of R4 (CodeableConcept `.text`, Period overlap, Address `.text`, SampledData quantity bounds). Copying `parameterHandler` string-splitting is still forbidden; copying a known legacy parse bug (quantity `eq10` → `$eq: null`) is also forbidden.

## Considered Options

- Search the expression path as written. Rejected: Mongo will not match an Address object with a string regex, or a Reference object with `Patient/example`.
- Project the full R4 search surface in this phase. Rejected: it would change hit-sets for queries that already work (token would start matching `.text`; date-on-Period would switch from start∨end-in-range to overlap).
- Clone legacy Mongo filters, including quantity `$eq: null`. Rejected: that freezes a lodash `isNumber(NaN)` defect as the definition of correct search.

## Consequences

- Incompatible `(search type, datatype)` branches are omitted with a diagnostic (quantity on SampledData; a path missing from the Resource type map). Remaining Quantity branches stay searchable.
- Enablement is registry golden filters plus document fixtures, not shadow filter equality with legacy.
- Token `:text`, Period overlap, and SampledData bounds are a later product change, not a silent expansion of this projection table.
