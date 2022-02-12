/**
 * 
 * @api {get} /fhir/Patient/:id read
 * @apiParam {string} id Resource ID in server
 * @apiName readPatient
 * @apiGroup Patient
 * @apiVersion  v2.1.0
 * 
 * @apiExample {cURL} cURL
 * curl --location --request GET 'http://burni.example.com/fhir/Patient/1'
 * @apiExample {javascript} javascript Axios
const axios = require('axios');
const config = {
    method: 'get',
    url: 'http://burni.example.com/fhir/Patient/1'
};

axios(config)
.then(function (response) {
    console.log(JSON.stringify(response.data));
})
.catch(function (error) {
    console.log(error);
});
* @apiSuccess {Patient} response-body <a href="https://www.hl7.org/fhir/patient.html#resource">Patient JSON Content</a>
* @apiSuccessExample {json} Success-Response:
* {
*   "resourceType": "Patient"
* }
* 
*/

const read = require('../../../FHIRApiService/read');

module.exports = async function(req, res) {
    return await read(req, res, "Patient");
};