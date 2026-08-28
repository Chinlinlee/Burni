# FHIR Validator (/docs/fhir-validator)



Burni's FHIR Validator is implemented through the integration of Node.js and Java from the project [node-java-fhir-validator](https://www.npmjs.com/package/node-java-fhir-validator).

<Callout type="warn" title="Important Note">
  Please use version 0.2.0 of [node-java-fhir-validator](https://www.npmjs.com/package/node-java-fhir-validator). Subsequent versions have not been integrated into Burni yet.

  * Version 0.2.0 of node-java-fhir-validator uses [joeferner / node-java](https://github.com/joeferner/node-java).
  * Subsequent versions use [node-java-bridge](https://github.com/MarkusJx/node-java-bridge) to replicate the functionality of [fhir-validator-wrapper](https://github.com/inferno-framework/fhir-validator-wrapper).
</Callout>

* The path where Burni places the FHIR Validator: `utils/validator`
  * `index.js`: Initializes and imports StructureDefinition (profile json file) and xxx.package.tgz (ig tgz file) from the `utils/validator/igs` folder into the validator code.
  * `processor.js`: Implements the code for `validateResource`.

## Which APIs use the FHIR Validator? [#which-apis-use-the-fhir-validator]

* create: When POSTing data, validation is performed first. If validation passes, then create operation is executed; otherwise, a 422 error is returned.
* update: When PUTting data, validation is performed first. If validation passes, then update operation is executed; otherwise, a 422 error is returned.
* $validate: Validation function that returns a 200 response if successful; otherwise, a 422 error is returned.
