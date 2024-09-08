const uuid = require('uuid');
const moment = require('moment');
const _ = require('lodash');
const fs = require('fs');

const fhirUrl = "http://hl7.org/fhir/R4";

module.exports = async function(req, res) {
    const metaData = {
        "resourceType": "CapabilityStatement",
        "status": "active",
        "date": moment.utc().toDate(),
        "publisher": "Not provided",
        "kind": "instance",
        "software": {
            "name": "FHIR-Server Burni",
            "version": "1.0.0"
        },
        "implementation": {
            "description": "Burni FHIR R4 Server",
            "url": `http://localhost/fhir`
        },
        "fhirVersion": "4.0.1",
        "format": ["json"],
        "rest": [{
            "mode": "server",
            "resource": [{
                    "type": "Account",
                    "profile": "http://hl7.org/fhir/R4/account.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "ActivityDefinition",
                    "profile": "http://hl7.org/fhir/R4/activitydefinition.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "AdverseEvent",
                    "profile": "http://hl7.org/fhir/R4/adverseevent.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "AllergyIntolerance",
                    "profile": "http://hl7.org/fhir/R4/allergyintolerance.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "Appointment",
                    "profile": "http://hl7.org/fhir/R4/appointment.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "AppointmentResponse",
                    "profile": "http://hl7.org/fhir/R4/appointmentresponse.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "AuditEvent",
                    "profile": "http://hl7.org/fhir/R4/auditevent.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "Basic",
                    "profile": "http://hl7.org/fhir/R4/basic.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "Binary",
                    "profile": "http://hl7.org/fhir/R4/binary.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "BiologicallyDerivedProduct",
                    "profile": "http://hl7.org/fhir/R4/biologicallyderivedproduct.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "BodyStructure",
                    "profile": "http://hl7.org/fhir/R4/bodystructure.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "Bundle",
                    "profile": "http://hl7.org/fhir/R4/bundle.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "CapabilityStatement",
                    "profile": "http://hl7.org/fhir/R4/capabilitystatement.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "CarePlan",
                    "profile": "http://hl7.org/fhir/R4/careplan.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "CareTeam",
                    "profile": "http://hl7.org/fhir/R4/careteam.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "CatalogEntry",
                    "profile": "http://hl7.org/fhir/R4/catalogentry.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "ChargeItem",
                    "profile": "http://hl7.org/fhir/R4/chargeitem.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "ChargeItemDefinition",
                    "profile": "http://hl7.org/fhir/R4/chargeitemdefinition.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "Claim",
                    "profile": "http://hl7.org/fhir/R4/claim.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "ClaimResponse",
                    "profile": "http://hl7.org/fhir/R4/claimresponse.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "ClinicalImpression",
                    "profile": "http://hl7.org/fhir/R4/clinicalimpression.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "CodeSystem",
                    "profile": "http://hl7.org/fhir/R4/codesystem.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "Communication",
                    "profile": "http://hl7.org/fhir/R4/communication.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "CommunicationRequest",
                    "profile": "http://hl7.org/fhir/R4/communicationrequest.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "CompartmentDefinition",
                    "profile": "http://hl7.org/fhir/R4/compartmentdefinition.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "Composition",
                    "profile": "http://hl7.org/fhir/R4/composition.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "ConceptMap",
                    "profile": "http://hl7.org/fhir/R4/conceptmap.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "Condition",
                    "profile": "http://hl7.org/fhir/R4/condition.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "Consent",
                    "profile": "http://hl7.org/fhir/R4/consent.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "Contract",
                    "profile": "http://hl7.org/fhir/R4/contract.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "Coverage",
                    "profile": "http://hl7.org/fhir/R4/coverage.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "CoverageEligibilityRequest",
                    "profile": "http://hl7.org/fhir/R4/coverageeligibilityrequest.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "CoverageEligibilityResponse",
                    "profile": "http://hl7.org/fhir/R4/coverageeligibilityresponse.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "DetectedIssue",
                    "profile": "http://hl7.org/fhir/R4/detectedissue.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "Device",
                    "profile": "http://hl7.org/fhir/R4/device.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "DeviceDefinition",
                    "profile": "http://hl7.org/fhir/R4/devicedefinition.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "DeviceMetric",
                    "profile": "http://hl7.org/fhir/R4/devicemetric.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "DeviceRequest",
                    "profile": "http://hl7.org/fhir/R4/devicerequest.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "DeviceUseStatement",
                    "profile": "http://hl7.org/fhir/R4/deviceusestatement.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "DiagnosticReport",
                    "profile": "http://hl7.org/fhir/R4/diagnosticreport.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "DocumentManifest",
                    "profile": "http://hl7.org/fhir/R4/documentmanifest.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "DocumentReference",
                    "profile": "http://hl7.org/fhir/R4/documentreference.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "EffectEvidenceSynthesis",
                    "profile": "http://hl7.org/fhir/R4/effectevidencesynthesis.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "Encounter",
                    "profile": "http://hl7.org/fhir/R4/encounter.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "Endpoint",
                    "profile": "http://hl7.org/fhir/R4/endpoint.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "EnrollmentRequest",
                    "profile": "http://hl7.org/fhir/R4/enrollmentrequest.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "EnrollmentResponse",
                    "profile": "http://hl7.org/fhir/R4/enrollmentresponse.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "EpisodeOfCare",
                    "profile": "http://hl7.org/fhir/R4/episodeofcare.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "EventDefinition",
                    "profile": "http://hl7.org/fhir/R4/eventdefinition.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "Evidence",
                    "profile": "http://hl7.org/fhir/R4/evidence.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "EvidenceVariable",
                    "profile": "http://hl7.org/fhir/R4/evidencevariable.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "ExampleScenario",
                    "profile": "http://hl7.org/fhir/R4/examplescenario.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "ExplanationOfBenefit",
                    "profile": "http://hl7.org/fhir/R4/explanationofbenefit.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "FamilyMemberHistory",
                    "profile": "http://hl7.org/fhir/R4/familymemberhistory.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "Flag",
                    "profile": "http://hl7.org/fhir/R4/flag.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "Goal",
                    "profile": "http://hl7.org/fhir/R4/goal.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "GraphDefinition",
                    "profile": "http://hl7.org/fhir/R4/graphdefinition.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "Group",
                    "profile": "http://hl7.org/fhir/R4/group.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "GuidanceResponse",
                    "profile": "http://hl7.org/fhir/R4/guidanceresponse.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "HealthcareService",
                    "profile": "http://hl7.org/fhir/R4/healthcareservice.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "ImagingStudy",
                    "profile": "http://hl7.org/fhir/R4/imagingstudy.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "Immunization",
                    "profile": "http://hl7.org/fhir/R4/immunization.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "ImmunizationEvaluation",
                    "profile": "http://hl7.org/fhir/R4/immunizationevaluation.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "ImmunizationRecommendation",
                    "profile": "http://hl7.org/fhir/R4/immunizationrecommendation.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "ImplementationGuide",
                    "profile": "http://hl7.org/fhir/R4/implementationguide.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "InsurancePlan",
                    "profile": "http://hl7.org/fhir/R4/insuranceplan.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "Invoice",
                    "profile": "http://hl7.org/fhir/R4/invoice.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "Library",
                    "profile": "http://hl7.org/fhir/R4/library.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "Linkage",
                    "profile": "http://hl7.org/fhir/R4/linkage.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "List",
                    "profile": "http://hl7.org/fhir/R4/list.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "Location",
                    "profile": "http://hl7.org/fhir/R4/location.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "Measure",
                    "profile": "http://hl7.org/fhir/R4/measure.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "MeasureReport",
                    "profile": "http://hl7.org/fhir/R4/measurereport.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "Media",
                    "profile": "http://hl7.org/fhir/R4/media.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "Medication",
                    "profile": "http://hl7.org/fhir/R4/medication.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "MedicationAdministration",
                    "profile": "http://hl7.org/fhir/R4/medicationadministration.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "MedicationDispense",
                    "profile": "http://hl7.org/fhir/R4/medicationdispense.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "MedicationKnowledge",
                    "profile": "http://hl7.org/fhir/R4/medicationknowledge.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "MedicationRequest",
                    "profile": "http://hl7.org/fhir/R4/medicationrequest.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "MedicationStatement",
                    "profile": "http://hl7.org/fhir/R4/medicationstatement.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "MedicinalProduct",
                    "profile": "http://hl7.org/fhir/R4/medicinalproduct.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "MedicinalProductAuthorization",
                    "profile": "http://hl7.org/fhir/R4/medicinalproductauthorization.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "MedicinalProductContraindication",
                    "profile": "http://hl7.org/fhir/R4/medicinalproductcontraindication.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "MedicinalProductIndication",
                    "profile": "http://hl7.org/fhir/R4/medicinalproductindication.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "MedicinalProductIngredient",
                    "profile": "http://hl7.org/fhir/R4/medicinalproductingredient.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "MedicinalProductInteraction",
                    "profile": "http://hl7.org/fhir/R4/medicinalproductinteraction.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "MedicinalProductManufactured",
                    "profile": "http://hl7.org/fhir/R4/medicinalproductmanufactured.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "MedicinalProductPackaged",
                    "profile": "http://hl7.org/fhir/R4/medicinalproductpackaged.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "MedicinalProductPharmaceutical",
                    "profile": "http://hl7.org/fhir/R4/medicinalproductpharmaceutical.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "MedicinalProductUndesirableEffect",
                    "profile": "http://hl7.org/fhir/R4/medicinalproductundesirableeffect.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "MessageDefinition",
                    "profile": "http://hl7.org/fhir/R4/messagedefinition.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "MessageHeader",
                    "profile": "http://hl7.org/fhir/R4/messageheader.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "MolecularSequence",
                    "profile": "http://hl7.org/fhir/R4/molecularsequence.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "NamingSystem",
                    "profile": "http://hl7.org/fhir/R4/namingsystem.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "NutritionOrder",
                    "profile": "http://hl7.org/fhir/R4/nutritionorder.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "Observation",
                    "profile": "http://hl7.org/fhir/R4/observation.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "ObservationDefinition",
                    "profile": "http://hl7.org/fhir/R4/observationdefinition.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "OperationDefinition",
                    "profile": "http://hl7.org/fhir/R4/operationdefinition.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "OperationOutcome",
                    "profile": "http://hl7.org/fhir/R4/operationoutcome.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "Organization",
                    "profile": "http://hl7.org/fhir/R4/organization.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "OrganizationAffiliation",
                    "profile": "http://hl7.org/fhir/R4/organizationaffiliation.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "Parameters",
                    "profile": "http://hl7.org/fhir/R4/parameters.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "Patient",
                    "profile": "http://hl7.org/fhir/R4/patient.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "PaymentNotice",
                    "profile": "http://hl7.org/fhir/R4/paymentnotice.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "PaymentReconciliation",
                    "profile": "http://hl7.org/fhir/R4/paymentreconciliation.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "Person",
                    "profile": "http://hl7.org/fhir/R4/person.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "PlanDefinition",
                    "profile": "http://hl7.org/fhir/R4/plandefinition.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "Practitioner",
                    "profile": "http://hl7.org/fhir/R4/practitioner.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "PractitionerRole",
                    "profile": "http://hl7.org/fhir/R4/practitionerrole.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "Procedure",
                    "profile": "http://hl7.org/fhir/R4/procedure.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "Provenance",
                    "profile": "http://hl7.org/fhir/R4/provenance.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "Questionnaire",
                    "profile": "http://hl7.org/fhir/R4/questionnaire.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "QuestionnaireResponse",
                    "profile": "http://hl7.org/fhir/R4/questionnaireresponse.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "RelatedPerson",
                    "profile": "http://hl7.org/fhir/R4/relatedperson.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "RequestGroup",
                    "profile": "http://hl7.org/fhir/R4/requestgroup.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "ResearchDefinition",
                    "profile": "http://hl7.org/fhir/R4/researchdefinition.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "ResearchElementDefinition",
                    "profile": "http://hl7.org/fhir/R4/researchelementdefinition.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "ResearchStudy",
                    "profile": "http://hl7.org/fhir/R4/researchstudy.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "ResearchSubject",
                    "profile": "http://hl7.org/fhir/R4/researchsubject.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "RiskAssessment",
                    "profile": "http://hl7.org/fhir/R4/riskassessment.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "RiskEvidenceSynthesis",
                    "profile": "http://hl7.org/fhir/R4/riskevidencesynthesis.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "Schedule",
                    "profile": "http://hl7.org/fhir/R4/schedule.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "SearchParameter",
                    "profile": "http://hl7.org/fhir/R4/searchparameter.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "ServiceRequest",
                    "profile": "http://hl7.org/fhir/R4/servicerequest.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "Slot",
                    "profile": "http://hl7.org/fhir/R4/slot.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "Specimen",
                    "profile": "http://hl7.org/fhir/R4/specimen.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "SpecimenDefinition",
                    "profile": "http://hl7.org/fhir/R4/specimendefinition.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "StructureDefinition",
                    "profile": "http://hl7.org/fhir/R4/structuredefinition.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "StructureMap",
                    "profile": "http://hl7.org/fhir/R4/structuremap.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "Subscription",
                    "profile": "http://hl7.org/fhir/R4/subscription.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "Substance",
                    "profile": "http://hl7.org/fhir/R4/substance.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "SubstanceNucleicAcid",
                    "profile": "http://hl7.org/fhir/R4/substancenucleicacid.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "SubstancePolymer",
                    "profile": "http://hl7.org/fhir/R4/substancepolymer.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "SubstanceProtein",
                    "profile": "http://hl7.org/fhir/R4/substanceprotein.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "SubstanceReferenceInformation",
                    "profile": "http://hl7.org/fhir/R4/substancereferenceinformation.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "SubstanceSourceMaterial",
                    "profile": "http://hl7.org/fhir/R4/substancesourcematerial.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "SubstanceSpecification",
                    "profile": "http://hl7.org/fhir/R4/substancespecification.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "SupplyDelivery",
                    "profile": "http://hl7.org/fhir/R4/supplydelivery.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "SupplyRequest",
                    "profile": "http://hl7.org/fhir/R4/supplyrequest.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "Task",
                    "profile": "http://hl7.org/fhir/R4/task.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "TerminologyCapabilities",
                    "profile": "http://hl7.org/fhir/R4/terminologycapabilities.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "TestReport",
                    "profile": "http://hl7.org/fhir/R4/testreport.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "TestScript",
                    "profile": "http://hl7.org/fhir/R4/testscript.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "ValueSet",
                    "profile": "http://hl7.org/fhir/R4/valueset.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "VerificationResult",
                    "profile": "http://hl7.org/fhir/R4/verificationresult.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                },
                {
                    "type": "VisionPrescription",
                    "profile": "http://hl7.org/fhir/R4/visionprescription.html",
                    "interaction": [{
                            "code": "read"
                        },
                        {
                            "code": "vread"
                        },
                        {
                            "code": "update"
                        },
                        {
                            "code": "delete"
                        },
                        {
                            "code": "history-instance"
                        },
                        {
                            "code": "create"
                        },
                        {
                            "code": "search-type"
                        }
                    ],
                    "versioning": "versioned",
                    "updateCreate": true,
                    "conditionalDelete": "single",
                    "searchInclude": [],
                    "searchRevInclude": [],
                    "searchParam": [{
                        "name": "_id",
                        "type": "string"
                    }]
                }
            ]
        }]
    };
    res.json(metaData);
};