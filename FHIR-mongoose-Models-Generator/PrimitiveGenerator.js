const fs =require('fs');
const _ = require('lodash');
const beautify = require('js-beautify').js;
const path =require('path');
const mkdirp = require('mkdirp');
let schemaJson = JSON.parse(fs.readFileSync(path.join(__dirname ,'./fhir.schema.json') , {encoding: 'utf-8'}));

let resourceList = schemaJson.definitions.ResourceList.oneOf.map(v=> {
    let itemSplit = v["$ref"].split("/");
    return itemSplit[itemSplit.length - 1];
});

let FHIRJson = schemaJson.definitions;

function checkIsFHIRResource (resourceName) {
    return resourceList.includes(resourceName);
}

let datePrimitiveType = ['instant' ,'time' , 'dateTime' , 'date'];
function main() {
    mkdirp.sync("./FHIRPrimitiveTypes");
    for (let type in FHIRJson) { 
        if (!checkIsFHIRResource(type) && type != "ResourceList") {
            if (/^[a-z]/.test(type) && !type.includes("_")) {
                let primitiveType = FHIRJson[type];
                //console.log(`${type} : ` , primitiveType);
                let pattern = _.get(primitiveType , 'pattern');
                let typeInSchema = _.get(primitiveType , 'type') || "String";
                if (datePrimitiveType.includes(type)) {
                    typeInSchema = "Date";
                }
                typeInSchema = typeInSchema.substring(0 , 1).toUpperCase() + typeInSchema.substring(1);
                if (pattern && !datePrimitiveType.includes(type)) {
                    fs.writeFileSync(`./FHIRPrimitiveTypes/${type}.js` , beautify(`module.exports = {
                        type : ${typeInSchema} ,
                        validate : {
                            validator : function (v) {
                                return /${pattern}/.test(v);
                            } , 
                            message : props => \`\${props.value} is not a valid ${type}!\`
                        } ,
                        default : void 0
                    }`));
                } else {
                    let schema = {
                        type : typeInSchema ,
                        default : "void 0" ,
                        get : ""
                    };
                    if (type == "date") {
                        schema.get = "function (v) {return moment(v).format('YYYY-MM-DD');}";
                    } else if (type == "dateTime") {
                        schema.get = "function (v) {return moment(v).format('YYYY-MM-DDThh:mm:ssZ');}";
                    } else if (type == "instant") {
                        schema.get = "function (v) {return moment(v).format('YYYY-MM-DDThh:mm:ss.SSSZ');}";
                    } else if (type== "time") {
                        schema.get = "function (v) {return moment(v).format('hh:mm:ss');}";
                    } else {
                        delete schema.get;
                    }

                    fs.writeFileSync(`./FHIRPrimitiveTypes/${type}.js` , beautify(`
                    const moment = require('moment');
                    module.exports = ${JSON.stringify(schema).replace(/\"/gm , '')}`));
                }
                
            }
        }
    }
    
}


main();