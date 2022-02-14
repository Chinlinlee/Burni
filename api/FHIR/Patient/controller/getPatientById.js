/**
     * 
     * @api {get} /fhir/Patient/:id read Patient
     * @apiParam {string} id Resource ID in server
     * @apiName readPatient
     * @apiGroup Patient
     * @apiVersion  v2.1.0
     * @apiDescription read Patient resource by id.
     * 
     * example from: <a href="https://chinlinlee.github.io/Burni/assets/FHIR/fhir-resource-examples/patient-example.json">Patient example</a>
     * @apiExample {cURL} cURL
     * curl --location --request GET 'http://burni.example.com/fhir/Patient/b254dcb5-32e2-41d0-91fe-3442feaccfed'
     * @apiExample {javascript} javascript Axios
    const axios = require('axios');
    const config = {
        method: 'get',
        url: 'http://burni.example.com/fhir/Patient/b254dcb5-32e2-41d0-91fe-3442feaccfed'
    };

    axios(config)
    .then(function (response) {
        console.log(JSON.stringify(response.data));
    })
    .catch(function (error) {
        console.log(error);
    });
    * @apiSuccessExample {json} (200) Success-Response:
    {
    "resourceType": "Patient",
    "id": "b254dcb5-32e2-41d0-91fe-3442feaccfed",
    "identifier": [
        {
            "use": "usual",
            "type": {
                "coding": [
                    {
                        "system": "http://terminology.hl7.org/CodeSystem/v2-0203",
                        "code": "MR"
                    }
                ]
            },
            "system": "urn:oid:1.2.36.146.595.217.0.1",
            "value": "12345",
            "period": {
                "start": "2001-05-06T08:00:00+08:00"
            },
            "assigner": {
                "display": "Acme Healthcare"
            }
        }
    ],
    "active": true,
    "name": [
        {
            "use": "official",
            "family": "Chalmers",
            "given": [
                "Peter",
                "James"
            ]
        },
        {
            "use": "usual",
            "given": [
                "Jim"
            ]
        },
        {
            "use": "maiden",
            "family": "Windsor",
            "given": [
                "Peter",
                "James"
            ],
            "period": {
                "end": "2002-01-01T08:00:00+08:00"
            }
        }
    ],
    "telecom": [
        {
            "use": "home"
        },
        {
            "system": "phone",
            "value": "(03) 5555 6473",
            "use": "work",
            "rank": 1
        },
        {
            "system": "phone",
            "value": "(03) 3410 5613",
            "use": "mobile",
            "rank": 2
        },
        {
            "system": "phone",
            "value": "(03) 5555 8834",
            "use": "old",
            "period": {
                "end": "2014-01-01T08:00:00+08:00"
            }
        }
    ],
    "gender": "male",
    "birthDate": "1974-12-25",
    "deceasedBoolean": false,
    "address": [
        {
            "use": "home",
            "type": "both",
            "text": "534 Erewhon St PeasantVille, Rainbow, Vic  3999",
            "line": [
                "534 Erewhon St"
            ],
            "city": "PleasantVille",
            "district": "Rainbow",
            "state": "Vic",
            "postalCode": "3999",
            "period": {
                "start": "1974-12-25T08:00:00+08:00"
            }
        }
    ],
    "contact": [
        {
            "relationship": [
                {
                    "coding": [
                        {
                            "system": "http://terminology.hl7.org/CodeSystem/v2-0131",
                            "code": "N"
                        }
                    ]
                }
            ],
            "name": {
                "family": "du Marché",
                "given": [
                    "Bénédicte"
                ]
            },
            "telecom": [
                {
                    "system": "phone",
                    "value": "+33 (237) 998327"
                }
            ],
            "address": {
                "use": "home",
                "type": "both",
                "line": [
                    "534 Erewhon St"
                ],
                "city": "PleasantVille",
                "district": "Rainbow",
                "state": "Vic",
                "postalCode": "3999",
                "period": {
                    "start": "1974-12-25T08:00:00+08:00"
                }
            },
            "gender": "female",
            "period": {
                "start": "2012-01-01T08:00:00+08:00"
            }
        }
    ],
    "managingOrganization": {
        "reference": "Organization/1"
    },
    "meta": {
        "tag": [
            {
                "system": "http://terminology.hl7.org/CodeSystem/v3-ActReason",
                "code": "HTEST",
                "display": "test health data"
            }
        ],
        "versionId": "1",
        "lastUpdated": "2022-02-13T22:30:18.582+08:00"
    }
}
    * 
    */

const read = require('../../../FHIRApiService/read');

module.exports = async function(req, res) {
    return await read(req, res, "Patient");
};