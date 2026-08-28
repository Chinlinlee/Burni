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
