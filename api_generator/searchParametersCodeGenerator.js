const { capitalizeFirstLetter } = require('normalize-text');
const { StringParameter, TokenParameter, NumberParameter, DateParameter, ReferenceParameter } = require('./parameterHandler');

const genParamFunc = {
    "string": (param, field, schema = {}) => {
        let stringParameterHandler = new StringParameter(param, field, schema);
        return stringParameterHandler.getCodeString();
    },
    "token": (param, field, schema = {}) => {
        let tokenParameterHandler = new TokenParameter(param, field, schema);
        return `${tokenParameterHandler.getCodeString()}`;
    },
    "number": (param, field, schema = {}) => {
        let numberParameterHandler = new NumberParameter(param, field);
        return `${numberParameterHandler.getCodeString()}`;
    },
    "date": (param, field, schema = {}) => {
        let dateParameterHandler = new DateParameter(param, field, schema);
        return `${dateParameterHandler.getCodeString()}`;
    },
    "reference": (param, field, schema = {}) => {
        let referenceParameterHandler = new ReferenceParameter(param, field);
        return `${referenceParameterHandler.getCodeString()}`;
    }
};

module.exports = {
    genParamFunc: genParamFunc
};
