# Add search parameter (/docs/search-parameter/add-search-parameter)



The code about search parameters can be found in `models\FHIR\queryBuild.js` and `models\FHIR\searchParameterQueryHandler.js` files.

* `queryBuild.js`: get single MongoDB query object from data type.
* `searchParameterQueryHandler.js`: using `queryBuild.js` and get fully MongoDB query object from HTTP query param.

Some search parameters from generator will got missing or incorrect. You can fix by using methods in `models\FHIR\searchParameterQueryHandler.js`.

## Example: Bundle.composition and Bundle.message [#example-bundlecomposition-and-bundlemessage]

FHIR R4 defines `Bundle.composition` and `Bundle.message` as reference search parameters. Burni resolves them from the SearchParameter Registry and evaluates only `entry[0].resource`:

* `composition` — `document` Bundles whose first entry is a `Composition`
* `message` — `message` Bundles whose first entry is a `MessageHeader`

Burni does not fan out across all `entry` elements to find the special Composition or MessageHeader. Chained reference targets may resolve from later entries when the reference identity and target type match.

### Direct identity search [#direct-identity-search]

Supported value forms include relative `ResourceType/id`, a bare id normalized to the fixed target type, and an absolute URL that matches `entry[0].fullUrl`. Versioned, contained, and logical identifier references are rejected.

Example URLs:

```sh
http://localhost:8080/fhir/Bundle?composition=Composition/comp-1
http://localhost:8080/fhir/Bundle?message=https://example.org/fhir/MessageHeader/msg-1
```

### Chained search [#chained-search]

After the inline hop, Burni applies the target resource SearchParameter plan from the Registry. Examples:

```sh
http://localhost:8080/fhir/Bundle?composition.patient=Patient/123
http://localhost:8080/fhir/Bundle?composition.subject:Patient.name=Eve%20Everywoman
http://localhost:8080/fhir/Bundle?composition.subject:Patient.phone=555-555-2003
http://localhost:8080/fhir/Bundle?message.focus:Patient.name=Smith
```

`composition.patient` follows `Composition::patient` and may fan out to `Patient` and `Group`. `MessageHeader.focus` is an open reference target, so a type filter is required before chaining further:

`composition.subject` follows the R4 `Composition::subject` SearchParameter. Its target is open, so a type filter such as `:Patient` is required. Burni first resolves the referenced Patient from later entries in the same document Bundle and falls back to the Patient collection when the Bundle does not contain that resource.

```sh
http://localhost:8080/fhir/Bundle?message.focus.name=Smith
```

This request is rejected with HTTP 400 and `missing-type-filter`.

## Composite search [#composite-search]

Burni supports FHIR R4 composite SearchParameters through the SearchParameter Registry. A composite value joins component values with `$`; each component is evaluated against the same composite scope. For an array scope, all components must match the same array element.

Examples:

```sh
http://localhost:8080/fhir/Observation?code-value-quantity=http://loinc.org%7C29463-7$gt5.4
http://localhost:8080/fhir/Observation?component-code-value-quantity=http://loinc.org%7C8480-6$lt60
http://localhost:8080/fhir/Group?characteristic-value=gender$mixed,owner$Eve
```

An unescaped comma separates multiple composite Pairs with OR semantics. Repeating the same composite parameter combines Pairs with AND semantics:

```sh
http://localhost:8080/fhir/Group?characteristic-value=gender$mixed&characteristic-value=owner$Eve
```

The characters `$`, `,`, `|`, and `\` in literal component values must be escaped with `\` (`\$`, `\,`, `\|`, `\\`). Composite parameters do not accept modifiers. Missing or extra components, empty components, incomplete escapes, unsupported component operators, and invalid composite values are rejected with HTTP 400; Burni does not broaden them into independent component filters.

## URI search (`uri`) [#uri-search]

Burni evaluates `uri` search parameters with raw string equality for the default modifier. Matching is case-sensitive and treats escape sequences, query strings, and fragments as part of the value. Relative references, URNs, and non-http(s) schemes are valid for exact search when they satisfy basic RFC 3986 syntax. Empty or syntactically invalid values are rejected with HTTP 400 and `Invalid uri search value`. Canonical `|version` suffixes are not stripped or interpreted.

The `:below` and `:above` modifiers apply only to hierarchical absolute URLs. URN, opaque, and relative values are rejected for these modifiers. Hierarchy is derived from the raw scheme, authority, and path segments of the search value; scheme and authority casing are preserved and never normalized. Query and fragment components in the search value are excluded when building hierarchy prefixes, but `:above` still matches stored values with MongoDB `$in` over that prefix set only—stored URIs that include query or fragment components are not matched unless the stored string exactly equals one of the generated prefixes. Trailing slash semantics are preserved and never normalized away. `:below` uses a path-boundary prefix match so `/fhir` does not match `/fhirx`. `:above` matches stored values with MongoDB `$in` over the ancestor prefix set of the search value.

Example URLs:

```sh
http://localhost:8080/fhir/ValueSet?url=http://hl7.org/fhir/ValueSet/example
http://localhost:8080/fhir/StructureDefinition?url:below=http://example.org/fhir
http://localhost:8080/fhir/StructureDefinition?url:above=http://example.org/fhir/StructureDefinition/foo
```

### Limitations [#limitations]

* Only `entry[0].resource` is evaluated as the special Composition or MessageHeader; later entries are considered only as referenced target resources for a chained search.
* Bundle type and first-entry resource type must match; invalid stored Bundles simply do not match rather than returning parameter errors.
