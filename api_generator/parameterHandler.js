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
        paramsSearch["${this.Param}"] = (query) => {
            if (!_.isArray(query["${this.Param}"])) {
                query["${this.Param}"] = [query["${this.Param}"]];
            }
            for (let item of query["${this.Param}"]) {
                let buildQs = {
                    $or : []
                };
                for (let field of paramsSearchFields["address"]) {
                    let buildResult = queryBuild.addressQuery(item, field);
                    buildQs.$or = [...buildQs.$or , ...buildResult.$or];
                }
                query.$and.push({
                    ...buildQs
                });
            }
            delete query["${this.Param}"];
        }; 
        `;
    }

    handleName() {
        let typeOfField = _.get(this.ResourceDef, `${this.Field}.type`);
        if (typeOfField == "string") {
            return `
            paramsSearch["name"] = (query) => {
                if (!_.isArray(query["name"])) {
                    query["name"] = [query["name"]];
                }
                for (let item of query["name"]) {
                    let buildQs = {
                        $or: []
                    };
                    for (let field of paramsSearchFields["name"]) {
                        let buildResult = {
                            [field] : queryBuild.stringQuery(item, field)
                        };
                        buildQs.$or.push(buildResult);
                    }
                    query.$and.push({
                        ...buildQs
                    });
                }
                delete query['name'];
            }; 
            `;
        } else {
            return `
            paramsSearch["name"] = (query) => {
                if (!_.isArray(query["name"])) {
                    query["name"] = [query["name"]];
                }
                for (let item of query["name"]) {
                    let buildResult = queryBuild.nameQuery(item , "name");
                    query.$and.push(buildResult);
                }
                delete query['name'];
            };
            `;
        }
    }

    handleCommon() {
        return `
        paramsSearch["${this.Param}"] = (query) => {
            if (!_.isArray(query["${this.Param}"])) {
                query["${this.Param}"] = [query["${this.Param}"]];
            }
            for (let item of query["${this.Param}"]) {
                let buildQs = {
                    $or: []
                };
                for (let field of paramsSearchFields["${this.Param}"]) {
                    let buildResult = {
                        [field] : queryBuild.stringQuery(item, field)
                    };
                    buildQs.$or.push(buildResult);
                }
                query.$and.push({
                    ...buildQs
                });
            }
            delete query['${this.Param}'];
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
            if (!_.isArray(query["phone"])) {
                query["phone"] = [query["phone"]];
            }
            for (let item of query["phone"]) {
                let buildResult = queryBuild.tokenQuery(item, "value" , "telecom" , "phone", false);
                for (let i in buildResult) {
                    query.$and.push({
                        [i]: buildResult[i]
                    });
                }
            }
            delete query['phone'];
        };
        `;
    }

    handleEmail() {
        return `
        paramsSearch["email"] = (query) => {
            if (!_.isArray(query["email"])) {
                query["email"] = [query["email"]];
            }
            for (let item of query["email"]) {
                let buildResult =queryBuild.tokenQuery(item , "value" , "telecom" , "email", false);
                for (let i in buildResult) {
                    query.$and.push({
                        [i]: buildResult[i]
                    });
                }
            }
            delete query['email'];
        };
        `;
    }

    handleIdentifier() {
        return `
        paramsSearch["identifier"] = (query) => {
            if (!_.isArray(query["identifier"])) {
                query["identifier"] = [query["identifier"]];
            }
            for (let item of query["identifier"]) {
                let buildQs = {
                    $or : []
                };
                for (let field of paramsSearchFields["identifier"]) {
                    let buildResult =queryBuild.tokenQuery(item , "value" , field);
                    buildQs.$or = [...buildQs.$or , ...buildResult.$or];
                }
                query.$and.push({
                    ...buildQs
                });
            }
            delete query['identifier'];
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
                if (!_.isArray(query["${this.Param}"])) {
                    query["${this.Param}"] = [query["${this.Param}"]];
                }
                for (let item of query["${this.Param}"]) {
                    let buildQs = {
                        $or: []
                    };
                    for (let field of paramsSearchFields["${this.Param}"]) {
                        let buildResult = ${this.NormalizeParamName}SearchFunc[field](item, field);
                        buildQs.$or.push(buildResult);
                    }
                    query.$and.push({
                        ...buildQs
                    });
                }
                delete query['${this.Param}'];
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
            if (!_.isArray(query["${this.Param}"])) {
                query["${this.Param}"] = [query["${this.Param}"]];
            }
            for (let item of query["${this.Param}"]) {
                let buildQs = {
                    $or: []
                };
                for (let field of paramsSearchFields["${this.Param}"]) {
                    let buildResult = {
                        [field] : queryBuild.numberQuery(item, field)
                    };
                    buildQs.$or.push(buildResult);
                }
                query.$and.push({
                    ...buildQs
                });
            }
            delete query['${this.Param}'];
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
            if (!_.isArray(query["${this.Param}"])) {
                query["${this.Param}"] = [query["${this.Param}"]];
            }
            for (let item of query["${this.Param}"]) {
                let buildQs = {
                    $or: []
                };
                for (let field of paramsSearchFields["${this.Param}"]) {
                    let buildResult = ${this.NormalizeParamName}SearchFunc[field](item, field);
                    buildQs.$or.push(buildResult);
                }
                query.$and.push({
                    ...buildQs
                });
            }
            delete query['${this.Param}'];
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
            if (!_.isArray(query["${this.Param}"])) {
                query["${this.Param}"] = [query["${this.Param}"]];
            }
            
            for (let item of query["${this.Param}"]) {
                let buildQs = {
                    $or : []
                };
                for (let field of paramsSearchFields["${this.Param}"]) {
                    let buildResult =queryBuild.referenceQuery(item , field);
                    buildQs.$or.push(buildResult);
                }
                query.$and.push({
                    ...buildQs
                });
            }
            delete query['${this.Param}'];
        };
        `;
        return `${codeStr}//#endregion\r\n`;
    }
}

module.exports = {
    StringParameter: StringParameter,
    TokenParameter: TokenParameter,
    NumberParameter: NumberParameter,
    DateParameter: DateParameter,
    ReferenceParameter: ReferenceParameter
};