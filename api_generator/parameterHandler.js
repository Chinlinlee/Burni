const _ = require('lodash');
const { capitalizeFirstLetter } = require('normalize-text');

/**
 * get clean fields of search parameter
 * @param {string} field The field to clean
 * @returns 
 */
function getSearchFields(field) {
    let searchFields = field.split("|").map(
        v => v.substr(v.indexOf(".") + 1).trim()
    );
    for (let key in searchFields) {
        let searchField = searchFields[key];
        if (searchField.includes(" as ")) {
            searchField = searchField.replace(")" , "");
            let [field , asType] = searchField.split(" as ");
            asType = capitalizeFirstLetter(asType);
            searchFields[key] = `${field}${asType}`;
        } else if (searchField.includes(".exists")) {
            searchFields[key] = `${searchField.substr(searchField, searchField.indexOf("."))}Boolean`;
        }
    }
    return searchFields;
}
/**
 * Get prefix code string.
 * @param {string} param 
 * @param {string} field 
 */
function getPrefixCodeString(param, field) {
    let codeStr = `//#region ${param}\r\n`;
    let searchFields = getSearchFields(field);
    codeStr += `paramsSearchFields["${param}"]= ${JSON.stringify(searchFields)};`;
    return codeStr;
}

class StringParameter {
    constructor(param, field, resourceDef) {
        this.Param = param;
        this.Field = field;
        this.ResourceDef = resourceDef;
    }

    handleAddress() {
        return `
        paramsSearch["address"] = (query) => {
            try {
                queryHandler.getAddressQuery(query, "address");
            } catch(e) {
                console.error(e);
                throw e;
            }
        };
        paramsSearch["address:contains"] = (query) => {
            try {
                queryHandler.getAddressQuery(query, "address:contains");
            } catch(e) {
                console.error(e);
                throw e;
            }
        };
        paramsSearch["address:exact"] = (query) => {
            try {
                queryHandler.getAddressQuery(query, "address:exact");
            } catch(e) {
                console.error(e);
                throw e;
            }
        };
        `;
    }

    handleName() {
        let searchFields = getSearchFields(this.Field);
        let typeOfField = _.get(this.ResourceDef, `${searchFields[0]}.type`);
        if (typeOfField == "string") {
            return `
            paramsSearchFields["name:contains"] = paramsSearchFields["name"];
            paramsSearchFields["name:exact"] = paramsSearchFields["name"];
            paramsSearch["name"] = (query) => {
                try {
                    queryHandler.getStringQuery(query, paramsSearchFields, "name");
                } catch(e) {
                    console.error(e);
                    throw e;
                }
            };
            paramsSearch["name:contains"] = (query) => {
                try {
                    queryHandler.getStringQuery(query, paramsSearchFields, "name:contains");
                } catch(e) {
                    console.error(e);
                    throw e;
                }
            };
            paramsSearch["name:exact"] = (query) => {
                try {
                    queryHandler.getStringQuery(query, paramsSearchFields, "name:exact");
                } catch(e) {
                    console.error(e);
                    throw e;
                }
            };
            `;
        } else {
            return `
            paramsSearch["name"] = (query) => {
                try {
                    queryHandler.getNameQuery(query, "name");
                } catch(e) {
                    console.error(e);
                    throw e;
                }
            };
            paramsSearch["name:contains"] = (query) => {
                try {
                    queryHandler.getNameQuery(query, "name:contains");
                } catch(e) {
                    console.error(e);
                    throw e;
                }
            };
            paramsSearch["name:exact"] = (query) => {
                try {
                    queryHandler.getNameQuery(query, "name:exact");
                } catch(e) {
                    console.error(e);
                    throw e;
                }
            };
            `;
        }
    }

    handleCommon() {
        return `
            paramsSearchFields["${this.Param}:contains"] = paramsSearchFields["${this.Param}"];
            paramsSearchFields["${this.Param}:exact"] = paramsSearchFields["${this.Param}"];
            paramsSearch["${this.Param}"] = (query) => {
                try {
                    queryHandler.getStringQuery(query, paramsSearchFields, "${this.Param}");
                } catch(e) {
                    console.error(e);
                    throw e;
                }
            };
            paramsSearch["${this.Param}:contains"] = (query) => {
                try {
                    queryHandler.getStringQuery(query, paramsSearchFields, "${this.Param}:contains");
                } catch(e) {
                    console.error(e);
                    throw e;
                }
            };
            paramsSearch["${this.Param}:exact"] = (query) => {
                try {
                    queryHandler.getStringQuery(query, paramsSearchFields, "${this.Param}:exact");
                } catch(e) {
                    console.error(e);
                    throw e;
                }
            };
        `;
    }

    getCodeString() {
        let codeStr = getPrefixCodeString(this.Param, this.Field);
        if (this.Param == "address") {
            codeStr += `${this.handleAddress()}`;
        } else if (this.Param == "name") {
            codeStr += `${this.handleName()}`;
        } else {
            codeStr += `${this.handleCommon()}`;
        }
        codeStr += `//#endregion\r\n`;
        return codeStr;
    }
}

const TokenDataTypes = [
    {
        dataType: "Coding",
        uri: "",
        code: "code"
    },
    {
        dataType: "CodeableConcept",
        uri: "coding.system",
        code: "coding.code"
    },
    {
        dataType: "ContactPoint",
        uri: "",
        code: "value"
    },
    {
        dataType: "Identifier",
        uri: "",
        code: "value"
    },
    {
        dataType: "code",
        uri: "",
        code: ""
    },
    {
        dataType: "string",
        uri: "",
        code: ""
    },
    {
        dataType: "boolean",
        uri: "",
        code: ""
    }
];
class TokenParameter {

    constructor(param, field, resourceDef) {
        this.Param = param;
        this.Field = field;
        this.ResourceDef = resourceDef;
        this.ParamsSearchFieldTxt = "";
        this.NormalizeParamName = this.Param.replace(/-/gm, "_");
    }

    fixedParamsSearchFieldTxt() {
        let searchFields = getSearchFields(this.Field);
        searchFields = searchFields.map( v => v.substr(0, v.indexOf(".")));
        this.ParamsSearchFieldTxt = `paramsSearchFields["${this.Param}"]= ${JSON.stringify(searchFields)};`;
    }

    handlePhone() {
        return `
        paramsSearch["phone"] = (query) => {
            try {
                queryHandler.getTokenQuery(query, paramsSearchFields, "phone");
            } catch(e) {
                console.error(e);
                throw e;
            }
        };
        `;
    }

    handleEmail() {
        return `
        paramsSearch["email"] = (query) => {
            try {
                queryHandler.getTokenQuery(query, paramsSearchFields, "email");
            } catch(e) {
                console.error(e);
                throw e;
            }
        };
        `;
    }

    handleIdentifier() {
        return `
        paramsSearch["identifier"] = (query) => {
            try {
                queryHandler.getTokenQuery(query, paramsSearchFields, "identifier");
            } catch(e) {
                console.error(e);
                throw e;
            }
        };
        `;
    }
    handleCommon(field) {
        let typeOfField = _.get(this.ResourceDef, `${field}.type`);
        let hitToken = TokenDataTypes.find(v => v.dataType == typeOfField);
        if (hitToken) {
            let isCodeableConcept = hitToken.dataType == "CodeableConcept";
            return `
            ${this.NormalizeParamName}SearchFunc["${field}"] = (item, field) => {
                return queryBuild.tokenQuery(item , "${hitToken.code}" , field, "", ${isCodeableConcept});
            };
            `;
        } else {
            return `
            ${this.NormalizeParamName}SearchFunc["${field}"] = (item, field) => {
                return queryBuild.tokenQuery(item , "" , field, "", false);
            };
            `;
        }
    }
    getCodeString() {
        if (this.Param == "phone") {
            this.fixedParamsSearchFieldTxt();
            return `//#region ${this.Param}\r\n${this.ParamsSearchFieldTxt}${this.handlePhone()}//#endregion\r\n`;
        } else if (this.Param == "email") {
            this.fixedParamsSearchFieldTxt();
            return `//#region ${this.Param}\r\n${this.ParamsSearchFieldTxt}${this.handleEmail()}//#endregion\r\n`;
        } else if (this.Param == "identifier") {
            this.ParamsSearchFieldTxt = getPrefixCodeString(this.Param, this.Field);
            return `${this.ParamsSearchFieldTxt}${this.handleIdentifier()}//#endregion\r\n`;
        } else {
            let searchFields = getSearchFields(this.Field);
            let paramsSearchFieldTxt = `paramsSearchFields["${this.Param}"]= ${JSON.stringify(searchFields)};\r\n`;
            let codeStr = `//#region ${this.Param}\r\n${paramsSearchFieldTxt}`;
            codeStr += `const ${this.NormalizeParamName}SearchFunc = {};`;
            for (let i = 0 ; i < searchFields.length; i++) { 
                let field = searchFields[i];
                try {
                    codeStr += this.handleCommon(field);
                } catch(e) {
                    console.error(e);
                }
            }
            codeStr += `
            paramsSearch["${this.Param}"] = (query) => {
                try {
                    queryHandler.getPolyTokenQuery(query, paramsSearchFields, "${this.Param}", ${this.NormalizeParamName}SearchFunc);
                } catch(e) {
                    console.error(e);
                    throw e;
                }
            };
            `;
            return `${codeStr}//#endregion\r\n`;
        }
    }
}


class NumberParameter {
    constructor(param, field) {
        this.Param = param;
        this.Field = field;
    }

    getCodeString() {
        let codeStr = getPrefixCodeString(this.Param, this.Field);
        codeStr += `
        paramsSearch["${this.Param}"] = (query) => {
            try {
                queryHandler.getNumberQuery(query, paramsSearchFields, "${this.Param}");
            } catch(e) {
                console.error(e);
                throw e;
            }
        };
        `;
        return codeStr;
    }
    
}

class DateParameter {
    constructor(param, field, resourceDef) {
        this.Param = param;
        this.Field = field;
        this.ResourceDef = resourceDef;
        this.NormalizeParamName = this.Param.replace(/-/gm, "_");
        this.LookUpFunc = {
            "date": (field) => this.handleDate(field),
            "dateTime": (field)=> this.handleDateTime(field),
            "instant": (field)=> this.handleInstant(field),
            "Period" : (field)=> this.handlePeriod(field),
            "Timing" : (field)=> this.handleTiming(field)
        };
    }

    handleDate(field) {
        return `
        ${this.NormalizeParamName}SearchFunc["${field}"] = (value, field) => {
            return queryBuild.dateQuery(value , field);
        };
        `;
    }
    handleDateTime(field) {
        return `
        ${this.NormalizeParamName}SearchFunc["${field}"] = (value, field) => {
            return queryBuild.dateTimeQuery(value , field);
        };
        `;
    }
    handleInstant(field) {
        return `
        ${this.NormalizeParamName}SearchFunc["${field}"] = (value, field) => {
            return queryBuild.instantQuery(value , field);
        };
        `;
    }

    handlePeriod (field) {
        return `
        ${this.NormalizeParamName}SearchFunc["${field}"] = (value, field) => {
            return queryBuild.periodQuery(value , field);
        };
        `;
    }

    handleTiming(field) {
        return `
        ${this.NormalizeParamName}SearchFunc["${field}"] = (value, field) => {
            return queryBuild.timingQuery(value , field);
        };
        `;
    }

    getCodeString() {
        let searchFields = getSearchFields(this.Field);
        let paramsSearchFieldTxt = `//#region ${this.Param}\r\nparamsSearchFields["${this.Param}"]= ${JSON.stringify(searchFields)};\r\n`;
        let codeStr = paramsSearchFieldTxt;
        codeStr += `const ${this.NormalizeParamName}SearchFunc = {};`;
        for (let i = 0 ; i < searchFields.length; i++) { 
            let field = searchFields[i];
            let typeOfField = _.get(this.ResourceDef, `${field}.type`);
            try {
                codeStr += this[`handle${capitalizeFirstLetter(typeOfField)}`](field);
            } catch(e) {
                console.error(e);
            }
        }
        codeStr += `
        paramsSearch["${this.Param}"] = (query) => {
            try {
                queryHandler.getPolyDateQuery(query, paramsSearchFields, "${this.Param}", ${this.NormalizeParamName}SearchFunc);
            } catch(e) {
                console.error(e);
                throw e;
            }
        };
        `;
        return `${codeStr}//#endregion\r\n`;
    }
}

class ReferenceParameter {
    constructor(param, field) {
        this.Param = param;
        this.Field = field;
    }

    getCodeString() {
        let codeStr = "";
        let searchFields = getSearchFields(this.Field);
        //clean fields to reference query field
        searchFields = searchFields.map(v=> {
            if (v.includes("where")) {
                let lastIndexFieldInField = v.lastIndexOf(".");
                v = v.substring(0, lastIndexFieldInField) + ".reference";
            } else if (v.includes(" as ")) {
                v = v.substr(0, v.indexOf(" as "));
            } else {
                v = v + ".reference";
            }
            return v;
        });
        codeStr += `//#region ${this.Param}\r\nparamsSearchFields["${this.Param}"]= ${JSON.stringify(searchFields)};`;
        codeStr += `
        paramsSearch["${this.Param}"] = (query) => {
            try {
                queryHandler.getReferenceQuery(query, paramsSearchFields, "${this.Param}");
            } catch(e) {
                console.error(e);
                throw e;
            }
        };
        `;
        return `${codeStr}//#endregion\r\n`;
    }
}

class QuantityParameter {
    constructor(param, field) {
        this.Param = param;
        this.Field = field;
    }

    getCodeString() {
        let codeStr = getPrefixCodeString(this.Param, this.Field);
        codeStr += `
        paramsSearch["${this.Param}"] = (query) => {
            try {
                queryHandler.getQuantityQuery(query, paramsSearchFields, "${this.Param}");
            } catch(e) {
                console.error(e);
                throw e;
            }
        };
        `;
        return codeStr;
    }
}

module.exports = {
    StringParameter: StringParameter,
    TokenParameter: TokenParameter,
    NumberParameter: NumberParameter,
    DateParameter: DateParameter,
    ReferenceParameter: ReferenceParameter,
    QuantityParameter: QuantityParameter
};