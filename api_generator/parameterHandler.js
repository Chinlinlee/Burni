const _ = require('lodash');
const { capitalizeFirstLetter } = require('normalize-text');

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
        }
    }
    return searchFields;
}

class StringParameter {
    Param;
    Field;
    ResourceDef;

    constructor(param, field, resourceDef) {
        this.Param = param;
        this.Field = field;
        this.ResourceDef = resourceDef;
    }

    handleAddress() {
        return `
        paramsSearch["${this.Param}"] = (query) => {
            if (!_.isArray(query["${this.Param}"])) {
                query["${this.Param}"] = [query["${this.Param}"]]
            }
            for (let item of query["${this.Param}"]) {
                let buildQs = {
                    $or : []
                };
                for (let field of paramsSearchFields["address"]) {
                    let buildResult = queryBuild.tokenQuery(item , "value" , field);
                    buildQs.$or = [...buildQs.$or , ...buildResult.$or];
                }
                query.$and.push({
                    ...buildQs
                });
            }
            delete query["${this.Param}"];
        } 
        `;
    }

    handleName() {
        let typeOfField = _.get(this.ResourceDef, `${this.Field}.type`);
        if (typeOfField == "string") {
            return `
            paramsSearch["name"] = (query) => {
                if (!_.isArray(query["name"])) {
                    query["name"] = [query["name"]]
                }
                for (let item of query["name"]) {
                    let buildQs = {
                        $or: []
                    };
                    for (let field of paramsSearchFields["name"]) {
                        let buildResult = {
                            [field] : queryBuild.stringQuery(item, field)
                        }
                        buildQs.$or.push(buildResult);
                    }
                    query.$and.push({
                        ...buildQs
                    });
                }
                delete query['name'];
            } 
            `;
        } else {
            return `
            paramsSearch["name"] = (query) => {
                if (!_.isArray(query["name"])) {
                    query["name"] = [query["name"]]
                }
                for (let item of query["name"]) {
                    let buildResult = queryBuild.nameQuery(item , "name");
                    query.$and.push(buildResult);
                }
                delete query['name'];
            }
            `;
        }
    }

    handleCommon() {
        return `
        paramsSearch["${this.Param}"] = (query) => {
            if (!_.isArray(query["${this.Param}"])) {
                query["${this.Param}"] = [query["${this.Param}"]]
            }
            for (let item of query["${this.Param}"]) {
                let buildQs = {
                    $or: []
                };
                for (let field of paramsSearchFields["${this.Param}"]) {
                    let buildResult = {
                        [field] : queryBuild.stringQuery(item, field)
                    }
                    buildQs.$or.push(buildResult);
                }
                query.$and.push({
                    ...buildQs
                });
            }
            delete query['${this.Param}'];
        } 
        `;
    }

    getCodeString() {
        if (this.Param.includes('address')) {
            return `${this.handleAddress()}\r\n`;
        } else if (this.Param == "name") {
            return `${this.handleName()}\r\n`;
        } else {
            return `${this.handleCommon()}\r\n`;
        }
    }
}

class TokenParameter {
    Param;
    Field;
    ResourceDef;
    ParamsSearchFieldTxt = "";
    TokenDataTypes = [
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
    constructor(param, field, resourceDef, paramsSearchFieldTxt= "") {
        this.Param = param;
        this.Field = field;
        this.ResourceDef = resourceDef;
        this.ParamsSearchFieldTxt = paramsSearchFieldTxt;
    }

    fixedParamsSearchFieldTxt() {
        let searchField = this.Field.substr(0, this.Field.indexOf("."));
        this.ParamsSearchFieldTxt = `paramsSearchFields["${this.Param}"]= [${JSON.stringify(searchField)}];`;
    }

    handlePhone() {
        fixedParamsSearchFieldTxt();
        return `
        paramsSearch["phone"] = (query) => {
            if (!_.isArray(query["phone"])) {
                query["phone"] = [query["phone"]]
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
        }
        `;
    }

    handleEmail() {
        fixedParamsSearchFieldTxt();
        return `
        paramsSearch["email"] = (query) => {
            if (!_.isArray(query["email"])) {
                query["email"] = [query["email"]]
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
        }
        `;
    }

    handleIdentifier() {
        return `
        paramsSearch["identifier"] = (query) => {
            if (!_.isArray(query["identifier"])) {
                query["identifier"] = [query["identifier"]]
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
        }
        `;
    }

    handleCommon() {
        let typeOfField = _.get(this.ResourceDef, `${this.Field}.type`);
        let hitToken = this.TokenDataTypes.find(v => v.dataType == typeOfField);
        if (hitToken) {
            let isCodeableConcept = hitToken.dataType == "CodeableConcept";
            return `
            paramsSearch["${this.Param}"] = (query) => {
                if (!_.isArray(query["${this.Param}"])) {
                    query["${this.Param}"] = [query["${this.Param}"]]
                }
                for (let item of query["${this.Param}"]) {
                    let buildQs = {
                        $or : []
                    };
                    for (let field of paramsSearchFields["${this.Param}"]) {
                        let buildResult =queryBuild.tokenQuery(item , "${hitToken.code}" , field, "", ${isCodeableConcept});
                        buildQs.$or = [...buildQs.$or , ...buildResult.$or];
                    }
                    query.$and.push({
                        ...buildQs
                    });
                }
                delete query['${this.Param}'];
            }
            `;
        } else {
            return `
            paramsSearch["${this.Param}"] = (query) => {
                if (!_.isArray(query["${this.Param}"])) {
                    query["${this.Param}"] = [query["${this.Param}"]]
                }
                for (let item of query["${this.Param}"]) {
                    let buildQs = {
                        $or : []
                    };
                    for (let field of paramsSearchFields["${this.Param}"]) {
                        let buildResult =queryBuild.tokenQuery(item , "" , field, "", false);
                        buildQs.$or = [...buildQs.$or , ...buildResult.$or];
                    }
                    query.$and.push({
                        ...buildQs
                    });
                }
                delete query['${this.Param}'];
            }
            `;
        }
    }
    getCodeString() {
        if (this.Param == "phone") {
            return `${this.ParamsSearchFieldTxt}${this.handlePhone()}\r\n`;
        } else if (this.Param == "email") {
            return `${this.ParamsSearchFieldTxt}${this.handleEmail()}\r\n`;
        } else if (this.Param == "identifier") {
            return `${this.ParamsSearchFieldTxt}${this.handleIdentifier()}\r\n`;
        } else {
            return `${this.ParamsSearchFieldTxt}${this.handleCommon()}\r\n`;
        }
    }
}

class NumberParameter {
    Param;
    Field;

    constructor(param, field) {
        this.Param = param;
        this.Field = field;
    }

    getCodeString() {
        let txt = "";
        let searchFields = getSearchFields(this.Field);
        txt += `paramsSearchFields["${param}"]= ${JSON.stringify(searchFields)};`;
        txt += `
        paramsSearch["${this.Param}"] = (query) => {
            if (!_.isArray(query["${this.Param}"])) {
                query["${this.Param}"] = [query["${this.Param}"]]
            }
            for (let item of query["${this.Param}"]) {
                let buildQs = {
                    $or: []
                };
                for (let field of paramsSearchFields["${this.Param}"]) {
                    let buildResult = {
                        [field] : queryBuild.numberQuery(item, field)
                    }
                    buildQs.$or.push(buildResult);
                }
                query.$and.push({
                    ...buildQs
                });
            }
            delete query['${this.Param}'];
        } 
        `;
        return txt;
    }
    
}

class DateParameter {
    Param;
    Field;
    ResourceDef;
    NormalizeParamName;
    LookUpFunc = {
        "date": (field) => this.handleDate(field),
        "dateTime": (field)=> this.handleDateTime(field),
        "instant": (field)=> this.handleInstant(field),
        "Period" : (field)=> this.handlePeriod(field),
        "Timing" : (field)=> this.handleTiming(field)
    }
    constructor(param, field, resourceDef) {
        this.Param = param;
        this.Field = field;
        this.ResourceDef = resourceDef;
        this.NormalizeParamName = this.Param.replace(/-/gm, "_");
    }

    handleDate(field) {
        return `
        ${this.NormalizeParamName}SearchFunc["${field}"] = (value, field) => {
            return queryBuild.dateQuery(value , field);
        }
        `;
    }
    handleDateTime(field) {
        return `
        ${this.NormalizeParamName}SearchFunc["${field}"] = (value, field) => {
            return queryBuild.dateTimeQuery(value , field);
        }
        `;
    }
    handleInstant(field) {
        return `
        ${this.NormalizeParamName}SearchFunc["${field}"] = (value, field) => {
            return queryBuild.instantQuery(value , field);
        }
        `;
    }

    handlePeriod (field) {
        return `
        ${this.NormalizeParamName}SearchFunc["${field}"] = (value, field) => {
            return queryBuild.periodQuery(value , field);
        }
        `;
    }

    handleTiming(field) {
        return `
        ${this.NormalizeParamName}SearchFunc["${field}"] = (value, field) => {
            return queryBuild.timingQuery(value , field);
        }
        `;
    }

    getCodeString() {
        let searchFields = getSearchFields(this.Field);
        let paramsSearchFieldTxt = `paramsSearchFields["${this.Param}"]= ${JSON.stringify(searchFields)};\r\n`;
        let codeStr = paramsSearchFieldTxt;
        codeStr += `const ${this.NormalizeParamName}SearchFunc = {};`;
        for (let i = 0 ; i < searchFields.length; i++) { 
            let field = searchFields[i];
            let typeOfField = _.get(this.ResourceDef, `${field}.type`);
            try {
                codeStr += this.LookUpFunc[typeOfField](field);
            } catch(e) {
                console.error(e);
            }
        }
        codeStr += `
        paramsSearch["${this.Param}"] = (query) => {
            if (!_.isArray(query["${this.Param}"])) {
                query["${this.Param}"] = [query["${this.Param}"]]
            }
            for (let item of query["${this.Param}"]) {
                let buildQs = {
                    $or: []
                };
                for (let field of paramsSearchFields["${this.Param}"]) {
                    let buildResult = ${this.Param}SearchFunc[field](item, field);
                    buildQs.$or.push(buildResult);
                }
                query.$and.push({
                    ...buildQs
                });
            }
            delete query['${this.Param}'];
        } 
        `;
        return codeStr;
    }
}

class ReferenceParameter {
    Param;
    Field;

    constructor(param, field) {
        this.Param = param;
        this.Field = field;
    }

    getCodeString() {
        let txt = "";
        let searchFields = getSearchFields(this.Field);
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
        txt += `paramsSearchFields["${this.Param}"]= ${JSON.stringify(searchFields)};`;
        txt += `
        paramsSearch["${this.Param}"] = (query) => {
            if (!_.isArray(query["${this.Param}"])) {
                query["${this.Param}"] = [query["${this.Param}"]]
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
        }
        `;
        return txt;
    }
}

module.exports = {
    StringParameter: StringParameter,
    TokenParameter: TokenParameter,
    NumberParameter: NumberParameter,
    DateParameter: DateParameter,
    ReferenceParameter: ReferenceParameter
}