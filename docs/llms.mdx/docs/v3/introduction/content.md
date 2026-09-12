# Introduction (/docs/v3/introduction)



# Introduction [#introduction]

## Burni FHIR Server [#burni-fhir-server]

Burni is an enterprise-ready implementation of an HL7® FHIR® R4 Server built with Node.js, Express, and MongoDB. It provides straightforward mechanisms to generate Mongoose schemas and RESTful API endpoints for any designated FHIR resources, allowing rapid customization and extension for clinical and health data interoperability workflows. Burni supports both Windows and Linux environments to enable rapid deployment of FHIR services.

Burni conforms to &#x2A;*v4.0.1 (R4)** of the HL7 FHIR specification.

In **v3**, Burni introduces substantial foundational architecture upgrades:

* **Node.js >= 22 (LTS)** and **Express 5** for modern JavaScript runtime performance and improved asynchronous routing.
* **Mongoose 8** for resilient database connection management and modern driver support.
* **Dual Database & Temporal Architecture** for segregating active resources from historical versions and audit provenance records.
* **System-level search parameters** with native support for `_tag`, `_security`, `_profile`, and full-precision timezone date comparisons.

## Conformance Statement [#conformance-statement]

Burni has been validated with AEGIS Touchstone Basic-R4-Server test suites with 100% pass rates:

* [FHIR4-0-1-Basic-Server version 18](https://touchstone.aegis.net/touchstone/conformance/detail?suite=FHIR4-0-1-Basic-Server\&sVersion=18\&testSystem=5f9518730a120e4edef042ae\&supportedOnly=false\&cb=%2fFHIR4-0-1-Basic\&format=ALL\&published=true) (2,216 tests passed, 100% Pass)
* [FHIR4-0-1-Basic-Server version 14](https://touchstone.aegis.net/touchstone/conformance/detail?suite=FHIR4-0-1-Basic-Server\&sVersion=14\&testSystem=5f9518730a120e4edef042ae\&supportedOnly=false\&cb=%2FFHIR4-0-1-Basic\&published=true) (1,948 tests passed, 100% Pass)
