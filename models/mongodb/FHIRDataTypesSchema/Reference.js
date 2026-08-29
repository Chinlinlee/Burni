const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const string = require("../FHIRDataTypesSchema/string");
const uri = require("../FHIRDataTypesSchema/uri");
const {
    Identifier
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");

const {
    Reference
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const uuid = require("uuid");

Reference.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    reference: {
        type: String,
        validate: {
            validator: function (v) {
                return (
                    /((http|https):\/\/([A-Za-z0-9\-\\\.\:\%\$]*\/)+)?([A-Za-z][A-Za-z0-9]*)\/[A-Za-z0-9\-\.]{1,64}(\/_history\/[A-Za-z0-9\-\.]{1,64})?/.test(
                        v
                    ) || /^#[A-Za-z0-9\-\.]{1,64}$/.test(v)
                      || (v.startsWith("urn:uuid:") && uuid.validate(v.slice(9)))
                );
            },
            message: (props) =>
                `${props.value} is not a valid reference string!`
        },
        default: void 0
    },
    type: uri,
    identifier: {
        type: Identifier,
        default: void 0
    },
    display: string
});
module.exports.Reference = Reference;
