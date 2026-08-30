const fs = require("fs");
const _ = require("lodash");
const beautify = require("js-beautify").js;
const primitiveType = ["Boolean", "String", "Date", "Number", "Buffer"];
let skipFieldTypes = ["Number", "String", "Date", "this", "Object"];
const path = require("path");
const mkdirp = require("mkdirp");
let schemaJson = JSON.parse(
    fs.readFileSync(path.join(__dirname, "./fhir.schema.json"), {
        encoding: "utf-8"
    })
);

let resourceList = schemaJson.definitions.ResourceList.oneOf.map((v) => {
    let itemSplit = v["$ref"].split("/");
    return itemSplit[itemSplit.length - 1];
});

let FHIRJson = schemaJson.definitions;
let genedType = [];

const DataTypesSummary = require("./DataTypesSummary");
const { fixChoiceTypeOfDate } = require("./temporalFieldMapping");
const {
    resolveElementExtensionField,
    formatElementExtensionField
} = require("./elementExtensionMapping");

function checkIsFHIRResource(resourceName) {
    return resourceList.find((v) => {
        return v.includes(resourceName) && v.length === resourceName.length;
    });
}

function cleanChildSchema(item) {
    for (let i in item) {
        if (_.get(item[i], "type")) {
            let isArray = /[\[\]]/gm.test(item[i].type);
            let type = item[i].type.replace(/[\[\]]/gm, "");
            if (type == "number") {
                item[i].type = isArray ? "[Number]" : "Number";
            } else if (type == "ResourceList") {
                //todo, the resourceList need all resource, maybe just generate minium resourceList dynamic?
                item[i].type = "Object";
            }
        }
    }
}

function isPrimitiveType(typeName) {
    return (
        /^[a-z]/.test(typeName) &&
        typeName != "number" &&
        DataTypesSummary.PrimitiveTypes.includes(typeName)
    );
}
function getSchema(resource, name) {
    //let skipCol = ["resourceType" , "id" , "meta" ,"implicitRules" ,"language" , "text" ,"contained" , "extension" , "modifierExtension"];
    let skipCol = ["id"];
    let result = {};

    for (let i in resource.properties) {
        //skip the unusual type
        if (skipCol.indexOf(i) >= 0) continue;
        else if (i.indexOf("_") == 0) {
            const elementExtension = resolveElementExtensionField(
                i,
                resource.properties[i],
                resource.properties
            );
            if (!elementExtension.yes) {
                continue;
            }
            result[i] = {
                __elementExtension: elementExtension.isArray
            };
            continue;
        }
        let type = _.get(resource.properties[i], "type");
        let choiceTypeDate = fixChoiceTypeOfDate(i, type);
        let refSchema = _.get(resource.properties[i], "$ref");
        let isCode = _.get(resource.properties[i], "enum");
        if (type == "array") {
            let arrayRef = resource.properties[i].items.$ref;
            if (resource.properties[i].items.enum) {
                result[i] = {
                    type: `[String]`
                };
                continue;
            }
            let arrayRefClean = arrayRef.split("/");
            let typeOfField = arrayRefClean[arrayRefClean.length - 1];
            if (typeOfField == name) typeOfField = "this";
            if (choiceTypeDate.yes) typeOfField = choiceTypeDate.type;
            if (/^#/.test(arrayRef)) {
                result[i] = {
                    type: `[${typeOfField}]`
                };
            } else {
                result[i] = {
                    type: `[${typeOfField}]`
                };
            }
        } else if (refSchema) {
            if (/^#/.test(refSchema)) {
                let refClean = refSchema.split("/");
                let typeOfField = refClean[refClean.length - 1];
                if (choiceTypeDate.yes) typeOfField = choiceTypeDate.type;
                if (isPrimitiveType(typeOfField)) {
                    result[i] = typeOfField;
                } else {
                    result[i] = {
                        type: typeOfField
                    };
                }
            } else if (!/^#/.test(refSchema)) {
                let refClean = refSchema.split("/");
                let typeOfField = refClean[refClean.length - 1];
                if (choiceTypeDate.yes) typeOfField = choiceTypeDate.type;
                if (isPrimitiveType(typeOfField)) {
                    result[i] = typeOfField;
                } else {
                    result[i] = {
                        type: typeOfField
                    };
                }
            }
        } else if (isCode) {
            let typeOfField = "String";
            //console.log(type);
            result[i] = {
                type: typeOfField,
                enum: JSON.stringify(isCode)
            };
        } else {
            if (choiceTypeDate.yes) type = choiceTypeDate.type;
            if (isPrimitiveType(type)) {
                result[i] = type;
            } else {
                result[i] = {
                    type: type
                };
            }
        }
        let isRequired = _.get(resource, "required");
        if (isRequired) {
            for (let item of isRequired) {
                if (item == i) {
                    Object.assign(result[i], { required: true });
                }
            }
        }
    }
    return result;
}

function formatSchemaBody(schema) {
    /** @type {Record<string, unknown>} */
    const normalSchema = {};
    /** @type {Record<string, boolean>} */
    const elementExtensions = {};

    for (const [fieldName, fieldDef] of Object.entries(schema)) {
        if (fieldDef && fieldDef.__elementExtension !== undefined) {
            elementExtensions[fieldName] = fieldDef.__elementExtension;
            continue;
        }
        normalSchema[fieldName] = fieldDef;
    }

    let schemaStr = JSON.stringify(normalSchema, null, 4).replace(/\"/gm, "");
    schemaStr = schemaStr.replace(/\\/gm, '"');

    if (Object.keys(elementExtensions).length > 0) {
        const extensionParts = Object.entries(elementExtensions).map(
            ([fieldName, isArray]) =>
                `    ${fieldName}: ${formatElementExtensionField(isArray)}`
        );
        schemaStr = schemaStr.replace(/\n\}$/, `,\n${extensionParts.join(",\n")}\n}`);
    }

    return schemaStr;
}

function getImportLibs(schema) {
    let importLib = "const mongoose = require('mongoose');\r\n";
    let importedTypeLib = [];
    let cleanType = "";
    for (let i in schema) {
        let item = schema[i];
        if (item && item.__elementExtension !== undefined) {
            continue;
        }
        if (_.get(item, "type")) {
            item.default = "void 0";
            cleanType = item.type.replace(/[\[\]]/gm, "");
        } else {
            cleanType = item.replace(/[\[\]]/gm, "");
        }
        if (
            skipFieldTypes.indexOf(cleanType) < 0 &&
            !importedTypeLib.includes(cleanType)
        ) {
            if (isPrimitiveType(cleanType)) {
                importLib = `${importLib}const ${cleanType} = require('../FHIRDataTypesSchema/${cleanType}');\r\n`;
            } else {
                importLib = `${importLib}const {${cleanType}} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');\r\n`;
            }
            importedTypeLib.push(cleanType);
        }
    }

    const needsElementExtensionImport = Object.values(schema).some(
        (fieldDef) => fieldDef && fieldDef.__elementExtension !== undefined
    );
    if (needsElementExtensionImport && !importedTypeLib.includes("Extension")) {
        importLib =
            `${importLib}const { Extension } = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');\r\n`;
    }

    return importLib;
}
async function generateSchema(type) {
    let schema = getSchema(FHIRJson[type], type);
    cleanChildSchema(schema);
    let importLibs = getImportLibs(schema);
    const schemaBody = formatSchemaBody(schema);
    let code = `
    const { ${type} } = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
    ${type}.add(${schemaBody});
    module.exports.${type} = ${type};`;
    code = `${importLibs}${code}`;

    mkdirp.sync(`./models/mongodb/FHIRDataTypesSchema`);
    fs.writeFileSync(
        `./models/mongodb/FHIRDataTypesSchema/${type}.js`,
        beautify(code, { indent_size: 4, pace_in_empty_paren: true })
    );
}

function main() {
    for (let FHIRType in FHIRJson) {
        let [maybeResourceName] = FHIRType.split("_");
        if (!checkIsFHIRResource(FHIRType) && FHIRType != "ResourceList") {
            if (/^[A-Z]/.test(FHIRType)) {
                generateSchema(FHIRType);
            }
        }
    }
}

main();
