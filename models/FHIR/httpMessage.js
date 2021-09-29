
class issue {
    constructor(severity="error" ,code , diagnostics) {
        this.severity = severity;
        this.code = code;
        this.diagnostics = diagnostics;
    }
}
class OperationOutcome	{
    constructor(issues) {
        this.resourceType = "OperationOutcome";
        this.issue = issues;
    }
}


function getDeleteMessage (resource , id) {
    let message = new issue("information" , "informational" ,`delete ${resource}/${id} successfully` );
    let operation = new OperationOutcome([message]);
    return operation;
}
/**
 * @param err The error;
 * @param codeName FHIR OperationOutCome issue code
 */
 function getOperationOutCome (err , codeName="exception") {
    let errorMessage = new issue("error" , codeName , err.toString());
    let operation = new OperationOutcome([errorMessage]);
    return operation;
}
function getOperationOutComeWarn (warning , codeName="exception") {
    let errorMessage = new issue("warning" , codeName , warning.toString());
    let operation = new OperationOutcome([errorMessage]);
    return operation;
}
function getOperationOutComeInfo (Info , codeName="informational") {
    let errorMessage = new issue("information" , codeName , Info.toString());
    let operation = new OperationOutcome([errorMessage]);
    return operation;
}
const handleError = {
    "duplicate" : (err) => getOperationOutCome(err, "duplicate") ,
    "exception" :(err) => getOperationOutCome(err, "exception" ),
    "not-found" : (err) => getOperationOutCome(err, "not-found"),
    "processing" : (err) => getOperationOutCome(err, "processing") , 
    "code-invalid" : (err) => getOperationOutCome(err,"code-invalid") , 
    "informational" : (info)  => getOperationOutComeInfo(info, "informational") ,
    "not-supported" : (err) => getOperationOutCome(err,"not-supported"),
    "security": (err)  => getOperationOutCome(err, "security"),
    "expired": (err) => getOperationOutCome(err, "expired"),
    "forbidden": (err) => getOperationOutCome(err, "forbidden")
}


module.exports = {
    getDeleteMessage : getDeleteMessage , 
    handleError : handleError
}