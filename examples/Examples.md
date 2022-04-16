# Examples Using Postman
Use patient from [here](https://www.hl7.org/fhir/patient-example.json.html)

POST (create)
![](https://i.imgur.com/EDsuuNA.png)

PUT (update)

create new resource with id
![](https://i.imgur.com/lqLdSlF.png)
update `active` and `name`
![](https://i.imgur.com/6jNqKbw.png)

GET
<details>
    <summary>
        GET patient resource return bundle(Click here to show)
    </summary>

`http://localhost:8088/fhir/Patient/`
```json=
    {
    "resourceType": "Bundle",
    "type": "searchset",
    "total": 2,
    "link": [
        {
            "relation": "self",
            "url": "http://localhost:8088/fhir/Patient?_offset=0&_count=100"
        }
    ],
    "entry": [
        {
            "fullUrl": "http://localhost:8088/fhir/Patient/b4bbadb0-8192-4524-bde0-9962d8ab179b",
            "resource": {
                "resourceType": "Patient",
                "id": "b4bbadb0-8192-4524-bde0-9962d8ab179b",
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
                            "start": "2001-05-06T00:00:00.000Z"
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
                            "end": "2002-01-01T00:00:00.000Z"
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
                            "end": "2014-01-01T00:00:00.000Z"
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
                        "line": [
                            "534 Erewhon St"
                        ],
                        "city": "PleasantVille",
                        "district": "Rainbow",
                        "state": "Vic",
                        "postalCode": "3999",
                        "period": {
                            "start": "1974-12-25T00:00:00.000Z"
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
                                "start": "1974-12-25T00:00:00.000Z"
                            }
                        },
                        "gender": "female",
                        "period": {
                            "start": "2012-01-01T00:00:00.000Z"
                        }
                    }
                ],
                "managingOrganization": {
                    "reference": "Organization/1"
                }
            }
        },
        {
            "fullUrl": "http://localhost:8088/fhir/Patient/123456",
            "resource": {
                "resourceType": "Patient",
                "id": "123456",
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
                            "start": "2001-05-06T00:00:00.000Z"
                        },
                        "assigner": {
                            "display": "Acme Healthcare"
                        }
                    }
                ],
                "active": false,
                "name": [
                    {
                        "use": "official",
                        "family": "Chalmers",
                        "given": [
                            "hahahaha",
                            "hahahaha"
                        ]
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
                            "end": "2014-01-01T00:00:00.000Z"
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
                        "line": [
                            "534 Erewhon St"
                        ],
                        "city": "PleasantVille",
                        "district": "Rainbow",
                        "state": "Vic",
                        "postalCode": "3999",
                        "period": {
                            "start": "1974-12-25T00:00:00.000Z"
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
                                "start": "1974-12-25T00:00:00.000Z"
                            }
                        },
                        "gender": "female",
                        "period": {
                            "start": "2012-01-01T00:00:00.000Z"
                        }
                    }
                ],
                "managingOrganization": {
                    "reference": "Organization/1"
                }
            }
        }
    ]
}
```
    
</details>

<details>
    <summary>
        GET patient by id (Click here to show)
    </summary>

`http://localhost:8088/fhir/Patient/123456`
```json=
{
    "resourceType": "Patient",
    "id": "123456",
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
                "start": "2001-05-06T00:00:00.000Z"
            },
            "assigner": {
                "display": "Acme Healthcare"
            }
        }
    ],
    "active": false,
    "name": [
        {
            "use": "official",
            "family": "Chalmers",
            "given": [
                "hahahaha",
                "hahahaha"
            ]
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
                "end": "2014-01-01T00:00:00.000Z"
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
            "line": [
                "534 Erewhon St"
            ],
            "city": "PleasantVille",
            "district": "Rainbow",
            "state": "Vic",
            "postalCode": "3999",
            "period": {
                "start": "1974-12-25T00:00:00.000Z"
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
                    "start": "1974-12-25T00:00:00.000Z"
                }
            },
            "gender": "female",
            "period": {
                "start": "2012-01-01T00:00:00.000Z"
            }
        }
    ],
    "managingOrganization": {
        "reference": "Organization/1"
    }
}
```

</details>

DELETE `http://localhost:8088/fhir/Patient/123456`
![](https://i.imgur.com/PGXRya4.png)

Then GET by id
![](https://i.imgur.com/M9V5xaF.png)
