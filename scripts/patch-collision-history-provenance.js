#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const types = [
    "ClaimResponse",
    "PaymentNotice",
    "BiologicallyDerivedProduct",
    "MedicationAdministration",
    "EnrollmentResponse",
    "Specimen",
    "PaymentReconciliation",
    "MessageHeader"
];

const importLine = 'const { setHistoryProvenance } = require("../historyProvenance");\n';

function patchResource(type) {
    const file = path.join(__dirname, "../models/mongodb/model", `${type}.js`);
    let src = fs.readFileSync(file, "utf8");

    if (!src.includes("setHistoryProvenance")) {
        src = src.replace(
            /const \{\s*canonicalInstantFromUtcDate,\s*serializeResourceTemporals\s*\} = require\("\.\.\/\.\.\/FHIR\/temporal"\);/,
            `const {\n    canonicalInstantFromUtcDate,\n    serializeResourceTemporals\n} = require("../../FHIR/temporal");\n${importLine}`
        );
    }

    const blockPattern = new RegExp(
        `_.set\\(item, "request", \\{\\s*` +
        `"method": "(POST|PUT|DELETE)",\\s*` +
        `url: \`http://\\$\\{process\\.env\\.FHIRSERVER_HOST\\}\\$\\{port\\}/\\$\\{process\\.env\\.FHIRSERVER_APIPATH\\}/${type}/\\$\\{item\\.id\\}/_history/\\$\\{version\\}\`\\s*` +
        `\\}\\);\\s*` +
        `_.set\\(item, "response", \\{\\s*` +
        `status: "(201|200)"\\s*` +
        `\\}\\);`,
        "g"
    );

    src = src.replace(blockPattern, (match, method, status) => {
        const indent = match.match(/^(\s*)_/)[1];
        return [
            `${indent}setHistoryProvenance(item, {`,
            `${indent}    method: "${method}",`,
            `${indent}    url: \`http://\${process.env.FHIRSERVER_HOST}\${port}/\${process.env.FHIRSERVER_APIPATH}/${type}/\${item.id}/_history/\${version}\`,`,
            `${indent}    status: "${status}"`,
            `${indent}});`
        ].join("\n");
    });

    if (src.includes('_.set(item, "request"')) {
        throw new Error(`Residual request provenance in ${type}`);
    }

    fs.writeFileSync(file, src);
    console.log(`patched ${type}`);
}

for (const type of types) {
    patchResource(type);
}
