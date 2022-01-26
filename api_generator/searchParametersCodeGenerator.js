const { StringParameter, TokenParameter, NumberParameter, DateParameter, ReferenceParameter } = require('./parameterHandler');

const genParamFunc = {
    "string": (param, field, schema = {}) => {
        let txt = "";
        let searchFields = field.split("|").map(
            v => v.substr(v.indexOf(".") + 1).trim()
        );
        for (let key in searchFields) {
            let searchField = searchFields[key];
            if (searchField.includes(" as ")) {
                searchField = searchField.replace(")", "");
                let [field, asType] = searchField.split(" as ");
                asType = capitalizeFirstLetter(asType);
                searchFields[key] = `${field}${asType}`;
            }
        }
        txt += `paramsSearchFields["${param}"]= ${JSON.stringify(searchFields)};`;
        let stringParameterHandler = new StringParameter(param, searchFields[0], schema);
        txt += stringParameterHandler.getCodeString();
        return txt;
    },
    "token": (param, field, schema = {}) => {
        let paramsSearchFieldTxt = "";
        let searchFields = field.split("|").map(
            v => v.substr(v.indexOf(".") + 1).trim()
        );
        for (let key in searchFields) {
            let searchField = searchFields[key];
            if (searchField.includes(" as ")) {
                searchField = searchField.replace(")", "");
                let [field, asType] = searchField.split(" as ");
                asType = capitalizeFirstLetter(asType);
                searchFields[key] = `${field}${asType}`;
            }
        }
        paramsSearchFieldTxt = `paramsSearchFields["${param}"]= ${JSON.stringify(searchFields)};`;
        let tokenParameterHandler = new TokenParameter(param, searchFields[0], schema, paramsSearchFieldTxt);
        return tokenParameterHandler.getCodeString();
    },
    "number": (param, field, schema = {}) => {
        let numberParameterHandler = new NumberParameter(param, field);
        return numberParameterHandler.getCodeString();
    },
    "date": (param, field, schema = {}) => {
        let dateParameterHandler = new DateParameter(param, field, schema);
        return dateParameterHandler.getCodeString();
    },
    "reference": (param, field, schema = {}) => {
        let referenceParameterHandler = new ReferenceParameter(param, field);
        return referenceParameterHandler.getCodeString();
    }
}

module.exports = {
    genParamFunc: genParamFunc
}
