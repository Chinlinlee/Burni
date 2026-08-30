const moment = require('moment');
const _ = require('lodash');
const mongoose = require('mongoose');
const {
    Meta
} = require('../FHIRDataTypesSchemaExport/FHIRDataTypesSchemaExport');
const uri = require('../FHIRDataTypesSchema/uri');
const code = require('../FHIRDataTypesSchema/code');
const {
    Narrative
} = require('../FHIRDataTypesSchemaExport/FHIRDataTypesSchemaExport');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/FHIRDataTypesSchemaExport');
const string = require('../FHIRDataTypesSchema/string');
const boolean = require('../FHIRDataTypesSchema/boolean');
const dateTime = require('../FHIRDataTypesSchema/dateTime');
const {
    ContactDetail
} = require('../FHIRDataTypesSchemaExport/FHIRDataTypesSchemaExport');
const markdown = require('../FHIRDataTypesSchema/markdown');
const {
    UsageContext
} = require('../FHIRDataTypesSchemaExport/FHIRDataTypesSchemaExport');
const {
    CodeableConcept
} = require('../FHIRDataTypesSchemaExport/FHIRDataTypesSchemaExport');
const id = require('../FHIRDataTypesSchema/id');
const {
    ImplementationGuide_DependsOn
} = require('../FHIRDataTypesSchemaExport/FHIRDataTypesSchemaExport');
const {
    ImplementationGuide_Global
} = require('../FHIRDataTypesSchemaExport/FHIRDataTypesSchemaExport');
const {
    ImplementationGuide_Definition
} = require('../FHIRDataTypesSchemaExport/FHIRDataTypesSchemaExport');
const {
    ImplementationGuide_Manifest
} = require('../FHIRDataTypesSchemaExport/FHIRDataTypesSchemaExport');

const {
    storeResourceRefBy,
    updateRefBy,
    deleteEmptyRefBy,
    checkResourceHaveReferenceByOthers
} = require("../common");
const {
    canonicalInstantFromUtcDate,
    serializeResourceTemporals
} = require("../../FHIR/temporal");
module.exports = function() {
    const ImplementationGuide = {
        meta: {
            type: Meta,
            default: void 0
        },
        implicitRules: uri,
        language: code,
        text: {
            type: Narrative,
            default: void 0
        },
        extension: {
            type: [Extension],
            default: void 0
        },
        modifierExtension: {
            type: [Extension],
            default: void 0
        },
        url: uri,
        version: string,
        name: string,
        title: string,
        status: {
            type: String,
            enum: ["draft", "active", "retired", "unknown"],
            default: void 0
        },
        experimental: boolean,
        date: dateTime,
        publisher: string,
        contact: {
            type: [ContactDetail],
            default: void 0
        },
        description: markdown,
        useContext: {
            type: [UsageContext],
            default: void 0
        },
        jurisdiction: {
            type: [CodeableConcept],
            default: void 0
        },
        copyright: markdown,
        packageId: id,
        license: {
            type: String,
            enum: ["not-open-source", "0BSD", "AAL", "Abstyles", "Adobe-2006", "Adobe-Glyph", "ADSL", "AFL-1.1", "AFL-1.2", "AFL-2.0", "AFL-2.1", "AFL-3.0", "Afmparse", "AGPL-1.0-only", "AGPL-1.0-or-later", "AGPL-3.0-only", "AGPL-3.0-or-later", "Aladdin", "AMDPLPA", "AML", "AMPAS", "ANTLR-PD", "Apache-1.0", "Apache-1.1", "Apache-2.0", "APAFML", "APL-1.0", "APSL-1.0", "APSL-1.1", "APSL-1.2", "APSL-2.0", "Artistic-1.0-cl8", "Artistic-1.0-Perl", "Artistic-1.0", "Artistic-2.0", "Bahyph", "Barr", "Beerware", "BitTorrent-1.0", "BitTorrent-1.1", "Borceux", "BSD-1-Clause", "BSD-2-Clause-FreeBSD", "BSD-2-Clause-NetBSD", "BSD-2-Clause-Patent", "BSD-2-Clause", "BSD-3-Clause-Attribution", "BSD-3-Clause-Clear", "BSD-3-Clause-LBNL", "BSD-3-Clause-No-Nuclear-License-2014", "BSD-3-Clause-No-Nuclear-License", "BSD-3-Clause-No-Nuclear-Warranty", "BSD-3-Clause", "BSD-4-Clause-UC", "BSD-4-Clause", "BSD-Protection", "BSD-Source-Code", "BSL-1.0", "bzip2-1.0.5", "bzip2-1.0.6", "Caldera", "CATOSL-1.1", "CC-BY-1.0", "CC-BY-2.0", "CC-BY-2.5", "CC-BY-3.0", "CC-BY-4.0", "CC-BY-NC-1.0", "CC-BY-NC-2.0", "CC-BY-NC-2.5", "CC-BY-NC-3.0", "CC-BY-NC-4.0", "CC-BY-NC-ND-1.0", "CC-BY-NC-ND-2.0", "CC-BY-NC-ND-2.5", "CC-BY-NC-ND-3.0", "CC-BY-NC-ND-4.0", "CC-BY-NC-SA-1.0", "CC-BY-NC-SA-2.0", "CC-BY-NC-SA-2.5", "CC-BY-NC-SA-3.0", "CC-BY-NC-SA-4.0", "CC-BY-ND-1.0", "CC-BY-ND-2.0", "CC-BY-ND-2.5", "CC-BY-ND-3.0", "CC-BY-ND-4.0", "CC-BY-SA-1.0", "CC-BY-SA-2.0", "CC-BY-SA-2.5", "CC-BY-SA-3.0", "CC-BY-SA-4.0", "CC0-1.0", "CDDL-1.0", "CDDL-1.1", "CDLA-Permissive-1.0", "CDLA-Sharing-1.0", "CECILL-1.0", "CECILL-1.1", "CECILL-2.0", "CECILL-2.1", "CECILL-B", "CECILL-C", "ClArtistic", "CNRI-Jython", "CNRI-Python-GPL-Compatible", "CNRI-Python", "Condor-1.1", "CPAL-1.0", "CPL-1.0", "CPOL-1.02", "Crossword", "CrystalStacker", "CUA-OPL-1.0", "Cube", "curl", "D-FSL-1.0", "diffmark", "DOC", "Dotseqn", "DSDP", "dvipdfm", "ECL-1.0", "ECL-2.0", "EFL-1.0", "EFL-2.0", "eGenix", "Entessa", "EPL-1.0", "EPL-2.0", "ErlPL-1.1", "EUDatagrid", "EUPL-1.0", "EUPL-1.1", "EUPL-1.2", "Eurosym", "Fair", "Frameworx-1.0", "FreeImage", "FSFAP", "FSFUL", "FSFULLR", "FTL", "GFDL-1.1-only", "GFDL-1.1-or-later", "GFDL-1.2-only", "GFDL-1.2-or-later", "GFDL-1.3-only", "GFDL-1.3-or-later", "Giftware", "GL2PS", "Glide", "Glulxe", "gnuplot", "GPL-1.0-only", "GPL-1.0-or-later", "GPL-2.0-only", "GPL-2.0-or-later", "GPL-3.0-only", "GPL-3.0-or-later", "gSOAP-1.3b", "HaskellReport", "HPND", "IBM-pibs", "ICU", "IJG", "ImageMagick", "iMatix", "Imlib2", "Info-ZIP", "Intel-ACPI", "Intel", "Interbase-1.0", "IPA", "IPL-1.0", "ISC", "JasPer-2.0", "JSON", "LAL-1.2", "LAL-1.3", "Latex2e", "Leptonica", "LGPL-2.0-only", "LGPL-2.0-or-later", "LGPL-2.1-only", "LGPL-2.1-or-later", "LGPL-3.0-only", "LGPL-3.0-or-later", "LGPLLR", "Libpng", "libtiff", "LiLiQ-P-1.1", "LiLiQ-R-1.1", "LiLiQ-Rplus-1.1", "Linux-OpenIB", "LPL-1.0", "LPL-1.02", "LPPL-1.0", "LPPL-1.1", "LPPL-1.2", "LPPL-1.3a", "LPPL-1.3c", "MakeIndex", "MirOS", "MIT-0", "MIT-advertising", "MIT-CMU", "MIT-enna", "MIT-feh", "MIT", "MITNFA", "Motosoto", "mpich2", "MPL-1.0", "MPL-1.1", "MPL-2.0-no-copyleft-exception", "MPL-2.0", "MS-PL", "MS-RL", "MTLL", "Multics", "Mup", "NASA-1.3", "Naumen", "NBPL-1.0", "NCSA", "Net-SNMP", "NetCDF", "Newsletr", "NGPL", "NLOD-1.0", "NLPL", "Nokia", "NOSL", "Noweb", "NPL-1.0", "NPL-1.1", "NPOSL-3.0", "NRL", "NTP", "OCCT-PL", "OCLC-2.0", "ODbL-1.0", "OFL-1.0", "OFL-1.1", "OGTSL", "OLDAP-1.1", "OLDAP-1.2", "OLDAP-1.3", "OLDAP-1.4", "OLDAP-2.0.1", "OLDAP-2.0", "OLDAP-2.1", "OLDAP-2.2.1", "OLDAP-2.2.2", "OLDAP-2.2", "OLDAP-2.3", "OLDAP-2.4", "OLDAP-2.5", "OLDAP-2.6", "OLDAP-2.7", "OLDAP-2.8", "OML", "OpenSSL", "OPL-1.0", "OSET-PL-2.1", "OSL-1.0", "OSL-1.1", "OSL-2.0", "OSL-2.1", "OSL-3.0", "PDDL-1.0", "PHP-3.0", "PHP-3.01", "Plexus", "PostgreSQL", "psfrag", "psutils", "Python-2.0", "Qhull", "QPL-1.0", "Rdisc", "RHeCos-1.1", "RPL-1.1", "RPL-1.5", "RPSL-1.0", "RSA-MD", "RSCPL", "Ruby", "SAX-PD", "Saxpath", "SCEA", "Sendmail", "SGI-B-1.0", "SGI-B-1.1", "SGI-B-2.0", "SimPL-2.0", "SISSL-1.2", "SISSL", "Sleepycat", "SMLNJ", "SMPPL", "SNIA", "Spencer-86", "Spencer-94", "Spencer-99", "SPL-1.0", "SugarCRM-1.1.3", "SWL", "TCL", "TCP-wrappers", "TMate", "TORQUE-1.1", "TOSL", "Unicode-DFS-2015", "Unicode-DFS-2016", "Unicode-TOU", "Unlicense", "UPL-1.0", "Vim", "VOSTROM", "VSL-1.0", "W3C-19980720", "W3C-20150513", "W3C", "Watcom-1.0", "Wsuipa", "WTFPL", "X11", "Xerox", "XFree86-1.1", "xinetd", "Xnet", "xpp", "XSkat", "YPL-1.0", "YPL-1.1", "Zed", "Zend-2.0", "Zimbra-1.3", "Zimbra-1.4", "zlib-acknowledgement", "Zlib", "ZPL-1.1", "ZPL-2.0", "ZPL-2.1"],
            default: void 0
        },
        fhirVersion: {
            type: [String],
            default: void 0
        },
        dependsOn: {
            type: [ImplementationGuide_DependsOn],
            default: void 0
        },
        global: {
            type: [ImplementationGuide_Global],
            default: void 0
        },
        definition: {
            type: ImplementationGuide_Definition,
            default: void 0
        },
        manifest: {
            type: ImplementationGuide_Manifest,
            default: void 0
        },
        resourceType: {
            type: String,
            required: true,
            enum: [
                "ImplementationGuide"
            ]
        }
    };

    ImplementationGuide.id = {
        ...id,
        index: true
    };
    ImplementationGuide.contained = {
        type: [Object],
        default: void 0
    };
    module.exports.schema = ImplementationGuide;
    let schemaConfig = {
        toObject: {
            getters: true
        },
        toJSON: {
            getters: true
        },
        versionKey: false
    };
    if (process.env.MONGODB_IS_SHARDING_MODE == "true") {
        schemaConfig["shardKey"] = {
            id: 1
        };
    }
    const ImplementationGuideSchema = new mongoose.Schema(ImplementationGuide, schemaConfig);


    ImplementationGuideSchema.methods.getFHIRField = function() {
        let result = this;
        delete result._doc._id;
        delete result._doc.__v;
        let myCollectionField = _.get(result, "_doc.myCollection");
        if (myCollectionField) {
            let tempCollectionField = _.cloneDeep(myCollectionField);
            _.set(result, "_doc.collection", tempCollectionField);
            delete result._doc.myCollection;
        }
        return serializeResourceTemporals(result.toObject());
    };

    ImplementationGuideSchema.pre('save', async function(next) {
        let mongodb = require('../index');
        if (process.env.ENABLE_CHECK_ALL_RESOURCE_ID == "true") {
            let storedID = await mongodb.FHIRStoredID.findOne({
                id: this.id
            });
            if (storedID.resourceType != "ImplementationGuide") {
                console.error('err', storedID);
                return next(new Error(`The id->${this.id} stored by resource ${storedID.resourceType}`));
            }
        }

        const docInHistory = await mongodb.ImplementationGuide_history.findOne({
                id: this.id
            })
            .sort({
                "meta.versionId": -1
            });

        const nextVersionId = docInHistory ?
            String(Number(_.get(docInHistory, "meta.versionId")) + 1) :
            "1";
        const currentMeta = this.meta && typeof this.meta.toObject === "function" ?
            this.meta.toObject() :
            (this.meta ? {
                ...this.meta
            } : {});
        currentMeta.versionId = nextVersionId;
        currentMeta.lastUpdated = canonicalInstantFromUtcDate(new Date());
        this.set("meta", currentMeta);

        return next();
    });

    ImplementationGuideSchema.post('save', async function(result) {
        let mongodb = require('../index');
        let item = result.toObject();
        delete item._id;
        let version = item.meta.versionId;
        let port = (process.env.FHIRSERVER_PORT == "80" || process.env.FHIRSERVER_PORT == "443") ? "" : `:${process.env.FHIRSERVER_PORT}`;
        if (version == "1") {
            _.set(item, "request", {
                "method": "POST",
                url: `http://${process.env.FHIRSERVER_HOST}${port}/${process.env.FHIRSERVER_APIPATH}/ImplementationGuide/${item.id}/_history/${version}`
            });
            _.set(item, "response", {
                status: "201"
            });
            let createdDocs = await mongodb['ImplementationGuide_history'].create(item);
        } else {
            _.set(item, "request", {
                "method": "PUT",
                url: `http://${process.env.FHIRSERVER_HOST}${port}/${process.env.FHIRSERVER_APIPATH}/ImplementationGuide/${item.id}/_history/${version}`
            });
            _.set(item, "response", {
                status: "200"
            });
            let createdDocs = await mongodb['ImplementationGuide_history'].create(item);
        }
        await mongodb.FHIRStoredID.findOneAndUpdate({
            id: result.id
        }, {
            id: result.id,
            resourceType: "ImplementationGuide"
        }, {
            upsert: true
        });

        await storeResourceRefBy(item);
    });

    ImplementationGuideSchema.pre('findOneAndUpdate', async function(next) {
        const docToUpdate = await this.model.findOne(this.getFilter());
        let version = Number(docToUpdate.meta.versionId);
        const currentMeta = docToUpdate.meta && typeof docToUpdate.meta.toObject === "function" ?
            docToUpdate.meta.toObject() :
            {
                ...docToUpdate.meta
            };
        currentMeta.versionId = String(version + 1);
        currentMeta.lastUpdated = canonicalInstantFromUtcDate(new Date());
        this._update.$set.meta = currentMeta;
        return next();
    });

    ImplementationGuideSchema.post('findOneAndUpdate', async function(result) {
        let mongodb = require('../index');
        let item;
        if (result.value) {
            item = _.cloneDeep(result.value).toObject();
        } else {
            item = _.cloneDeep(result).toObject();
        }
        let version = item.meta.versionId;
        delete item._id;
        let port = (process.env.FHIRSERVER_PORT == "80" || process.env.FHIRSERVER_PORT == "443") ? "" : `:${process.env.FHIRSERVER_PORT}`;

        _.set(item, "request", {
            "method": "PUT",
            url: `http://${process.env.FHIRSERVER_HOST}${port}/${process.env.FHIRSERVER_APIPATH}/ImplementationGuide/${item.id}/_history/${version}`
        });
        _.set(item, "response", {
            status: "200"
        });

        try {
            let history = await mongodb['ImplementationGuide_history'].create(item);
        } catch (e) {
            console.error(e);
        }

        await storeResourceRefBy(item);

        return result;
    });

    ImplementationGuideSchema.pre('findOneAndDelete', async function(next) {
        const docToDelete = await this.model.findOne(this.getFilter());
        if (!docToDelete) {
            next(`The id->${this.getFilter().id} not found in ImplementationGuide resource`);
        }
        let mongodb = require('../index');
        let item = docToDelete.toObject();
        delete item._id;

        if (process.env.ENABLE_CHECK_REF_DELETION === "true" && await checkResourceHaveReferenceByOthers(item)) {
            next(`The ${item.resourceType}:id->${item.id} is referenced by multiple resource, please do not delete resource that have association`);
        }

        item.meta.versionId = String(Number(item.meta.versionId) + 1);
        let version = item.meta.versionId;

        let port = (process.env.FHIRSERVER_PORT == "80" || process.env.FHIRSERVER_PORT == "443") ? "" : `:${process.env.FHIRSERVER_PORT}`;
        _.set(item, "request", {
            "method": "DELETE",
            url: `http://${process.env.FHIRSERVER_HOST}${port}/${process.env.FHIRSERVER_APIPATH}/ImplementationGuide/${item.id}/_history/${version}`
        });
        _.set(item, "response", {
            status: "200"
        });
        let createdDocs = await mongodb['ImplementationGuide_history'].create(item);
        next();
    });

    ImplementationGuideSchema.post('findOneAndDelete', async function(resource) {
        await updateRefBy(resource);
        await deleteEmptyRefBy();
    });

    const ImplementationGuideModel = mongoose.model("ImplementationGuide", ImplementationGuideSchema, "ImplementationGuide");
    return ImplementationGuideModel;
};