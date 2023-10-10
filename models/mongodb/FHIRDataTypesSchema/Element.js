const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");

const { Element } = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
Element.add({
    extension: {
        type: [Extension],
        default: void 0
    }
});
module.exports.Element = Element;
