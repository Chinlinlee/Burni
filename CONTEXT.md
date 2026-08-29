# Burni

Burni is a FHIR server. A resource may be profile-validated by a remote Validator before Burni stores it or answers `$validate`.

## Language

**Validator**:
A remote HTTP service that profile-validates a FHIR resource and returns an OperationOutcome. Burni does not embed a validation engine.
_Avoid_: Java validator, C# validator, in-process validator, node-java-fhir-validator

**Profile validation**:
Checking a resource against FHIR profiles and IGs. The Validator owns which IGs are loaded. Burni forwards the resource; it does not load StructureDefinitions.
_Avoid_: `$validate` as a synonym. `$validate` is the FHIR operation and may use profile validation or structure validation depending on configuration.

**Structure validation**:
Checking a resource against Burni's mongoose FHIR base schema, without profiles. Used when the Validator is disabled.

**Validator enabled**:
Create, update, Bundle writes, and `$validate` wait on the Validator. Disabled means structure validation only.
_Avoid_: treating this as “turn `$validate` on or off”. `$validate` always exists.

**Validation failure**:
The Validator returned an OperationOutcome that contains an issue with severity error or fatal. Burni responds 422 and echoes that OperationOutcome.
_Avoid_: calling a timeout or a non-OperationOutcome body a validation failure.

**Validator unavailable**:
Burni could not complete profile validation because the Validator was unreachable, timed out, or returned a body that is not an OperationOutcome. Burni responds 503 or 502 with an OperationOutcome it created. The resource is not stored.
_Avoid_: treating this as a validation failure.

## Search

**Registry**:
The effective SearchParameter definitions Burni uses to answer a search.
_Avoid_: handler, FHIRParametersClean, SearchParameter table

**Legacy search**:
The generated per-resource search still serving clients during migration. It is a comparison baseline, not the definition of correct search.
_Avoid_: old compiler, parameterHandler as the runtime

**Shadow comparison**:
Running Registry and Legacy search side by side without switching which one answers the client.
_Avoid_: shadow SearchParameter, shadow registry

**Search-type projection**:
The mapping from the FHIR datatype at an expression leaf to the stored resource fields a search of that type actually matches. The expression still names the datatype root.
_Avoid_: field rewrite, SearchParameter expansion, parameterHandler string rules

**Choice element name**:
The FHIR JSON field for a choice, formed from the element name plus the capitalised type, for example `deceasedDateTime`.
_Avoid_: concatenating the FHIRPath type token as-is (`deceaseddateTime`)

**Extraction path**:
One stored field path on a single resource type, together with that field's FHIR datatype, taken from one union branch of a SearchParameter expression.
_Avoid_: fieldPaths as an untyped string list, a plan shared across all `base` types

**Resource type map**:
Burni's per-resource catalog of stored fields and their FHIR datatypes, used to type extraction paths. The catalog is the `to-code-use-definition` JSON, not live mongoose Schema objects and not official StructureDefinitions.
_Avoid_: mongoose schema, StructureDefinition, profiles-resources as this catalog

**Incompatible branch**:
A union alternative that cannot be searched for this SearchParameter type: the leaf datatype has no search-type projection, the path is missing from the Resource type map, or the leaf is a BackboneElement with no projection. It is omitted with a diagnostic; it is not compiled into a filter that cannot match stored data.
_Avoid_: disabling the whole canonical SearchParameter because one branch is incompatible; identity-projecting an unknown path

**Enablement**:
Letting Registry answer search for a resource type after golden filters and document-fixture hit-sets pass.
_Avoid_: shadow filter equality; `readyForEnablement` on the shadow report

**Hit-set**:
The stored documents a search returns.
_Avoid_: Mongo filter JSON equality; shadow sample values

**Document fixture**:
Stored FHIR JSON used to assert a hit-set.
_Avoid_: golden Mongo filters; one official example as the only stored document

**Effective Registry code**:
A Patient search code with an active compiled definition in the Registry snapshot.
_Avoid_: every generated legacy code; disabled code treated as a successful search

**Companion fixture**:
A second stored resource used to prove that a search does not return documents outside its expected hit-set.
_Avoid_: treating a positive-only assertion as a complete search test

**Patient 23-code migration contract**:
The agreed Patient migration boundary covering `active`, `address`, `address-city`, `address-country`, `address-postalcode`, `address-state`, `address-use`, `birthdate`, `death-date`, `deceased`, `email`, `family`, `gender`, `general-practitioner`, `given`, `identifier`, `language`, `link`, `name`, `organization`, `phone`, `phonetic`, and `telecom`. Completion means each code has an effective definition and passes its declared search-value and hit-set contract.
_Avoid_: treating a generated handler or a positive-only test as completion

**Compatibility-plus-corrections**:
The migration acceptance policy that preserves the existing public search projection boundary while correcting known omissions required for Patient searches, including deceased choice handling and same-ContactPoint system/value correlation for email and phone. It does not claim full R4 Address.text or phonetic matching.
_Avoid_: silently expanding the hit-set and calling it compatibility
