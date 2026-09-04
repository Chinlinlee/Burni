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

### Limitations [#limitations]

* Only `entry[0].resource` is evaluated as the special Composition or MessageHeader; later entries are considered only as referenced target resources for a chained search.
* Bundle type and first-entry resource type must match; invalid stored Bundles simply do not match rather than returning parameter errors.
