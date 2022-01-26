const {
    Element
} = require('../FHIRDataTypesSchema/Element');
const {
    Extension
} = require('../FHIRDataTypesSchema/Extension');
const {
    Narrative
} = require('../FHIRDataTypesSchema/Narrative');
const {
    Annotation
} = require('../FHIRDataTypesSchema/Annotation');
const {
    Attachment
} = require('../FHIRDataTypesSchema/Attachment');
const {
    Identifier
} = require('../FHIRDataTypesSchema/Identifier');
const {
    CodeableConcept
} = require('../FHIRDataTypesSchema/CodeableConcept');
const {
    Coding
} = require('../FHIRDataTypesSchema/Coding');
const {
    Quantity
} = require('../FHIRDataTypesSchema/Quantity');
const {
    Duration
} = require('../FHIRDataTypesSchema/Duration');
const {
    Distance
} = require('../FHIRDataTypesSchema/Distance');
const {
    Count
} = require('../FHIRDataTypesSchema/Count');
const {
    Money
} = require('../FHIRDataTypesSchema/Money');
const {
    Age
} = require('../FHIRDataTypesSchema/Age');
const {
    Range
} = require('../FHIRDataTypesSchema/Range');
const {
    Period
} = require('../FHIRDataTypesSchema/Period');
const {
    Ratio
} = require('../FHIRDataTypesSchema/Ratio');
const {
    Reference
} = require('../FHIRDataTypesSchema/Reference');
const {
    SampledData
} = require('../FHIRDataTypesSchema/SampledData');
const {
    Signature
} = require('../FHIRDataTypesSchema/Signature');
const {
    HumanName
} = require('../FHIRDataTypesSchema/HumanName');
const {
    Address
} = require('../FHIRDataTypesSchema/Address');
const {
    ContactPoint
} = require('../FHIRDataTypesSchema/ContactPoint');
const {
    Timing
} = require('../FHIRDataTypesSchema/Timing');
const {
    Timing_Repeat
} = require('../FHIRDataTypesSchema/Timing_Repeat');
const {
    Meta
} = require('../FHIRDataTypesSchema/Meta');
const {
    ContactDetail
} = require('../FHIRDataTypesSchema/ContactDetail');
const {
    Contributor
} = require('../FHIRDataTypesSchema/Contributor');
const {
    DataRequirement
} = require('../FHIRDataTypesSchema/DataRequirement');
const {
    DataRequirement_CodeFilter
} = require('../FHIRDataTypesSchema/DataRequirement_CodeFilter');
const {
    DataRequirement_DateFilter
} = require('../FHIRDataTypesSchema/DataRequirement_DateFilter');
const {
    DataRequirement_Sort
} = require('../FHIRDataTypesSchema/DataRequirement_Sort');
const {
    ParameterDefinition
} = require('../FHIRDataTypesSchema/ParameterDefinition');
const {
    RelatedArtifact
} = require('../FHIRDataTypesSchema/RelatedArtifact');
const {
    TriggerDefinition
} = require('../FHIRDataTypesSchema/TriggerDefinition');
const {
    UsageContext
} = require('../FHIRDataTypesSchema/UsageContext');
const {
    Dosage
} = require('../FHIRDataTypesSchema/Dosage');
const {
    Dosage_DoseAndRate
} = require('../FHIRDataTypesSchema/Dosage_DoseAndRate');
const {
    Population
} = require('../FHIRDataTypesSchema/Population');
const {
    ProductShelfLife
} = require('../FHIRDataTypesSchema/ProductShelfLife');
const {
    ProdCharacteristic
} = require('../FHIRDataTypesSchema/ProdCharacteristic');
const {
    MarketingStatus
} = require('../FHIRDataTypesSchema/MarketingStatus');
const {
    SubstanceAmount
} = require('../FHIRDataTypesSchema/SubstanceAmount');
const {
    SubstanceAmount_ReferenceRange
} = require('../FHIRDataTypesSchema/SubstanceAmount_ReferenceRange');
const {
    Expression
} = require('../FHIRDataTypesSchema/Expression');
const {
    ElementDefinition
} = require('../FHIRDataTypesSchema/ElementDefinition');
const {
    ElementDefinition_Slicing
} = require('../FHIRDataTypesSchema/ElementDefinition_Slicing');
const {
    ElementDefinition_Discriminator
} = require('../FHIRDataTypesSchema/ElementDefinition_Discriminator');
const {
    ElementDefinition_Base
} = require('../FHIRDataTypesSchema/ElementDefinition_Base');
const {
    ElementDefinition_Type
} = require('../FHIRDataTypesSchema/ElementDefinition_Type');
const {
    ElementDefinition_Example
} = require('../FHIRDataTypesSchema/ElementDefinition_Example');
const {
    ElementDefinition_Constraint
} = require('../FHIRDataTypesSchema/ElementDefinition_Constraint');
const {
    ElementDefinition_Binding
} = require('../FHIRDataTypesSchema/ElementDefinition_Binding');
const {
    ElementDefinition_Mapping
} = require('../FHIRDataTypesSchema/ElementDefinition_Mapping');
const {
    Account_Coverage
} = require('../FHIRDataTypesSchema/Account_Coverage');
const {
    Account_Guarantor
} = require('../FHIRDataTypesSchema/Account_Guarantor');
const {
    ActivityDefinition_Participant
} = require('../FHIRDataTypesSchema/ActivityDefinition_Participant');
const {
    ActivityDefinition_DynamicValue
} = require('../FHIRDataTypesSchema/ActivityDefinition_DynamicValue');
const {
    AdverseEvent_SuspectEntity
} = require('../FHIRDataTypesSchema/AdverseEvent_SuspectEntity');
const {
    AdverseEvent_Causality
} = require('../FHIRDataTypesSchema/AdverseEvent_Causality');
const {
    AllergyIntolerance_Reaction
} = require('../FHIRDataTypesSchema/AllergyIntolerance_Reaction');
const {
    Appointment_Participant
} = require('../FHIRDataTypesSchema/Appointment_Participant');
const {
    AuditEvent_Agent
} = require('../FHIRDataTypesSchema/AuditEvent_Agent');
const {
    AuditEvent_Network
} = require('../FHIRDataTypesSchema/AuditEvent_Network');
const {
    AuditEvent_Source
} = require('../FHIRDataTypesSchema/AuditEvent_Source');
const {
    AuditEvent_Entity
} = require('../FHIRDataTypesSchema/AuditEvent_Entity');
const {
    AuditEvent_Detail
} = require('../FHIRDataTypesSchema/AuditEvent_Detail');
const {
    BiologicallyDerivedProduct_Collection
} = require('../FHIRDataTypesSchema/BiologicallyDerivedProduct_Collection');
const {
    BiologicallyDerivedProduct_Processing
} = require('../FHIRDataTypesSchema/BiologicallyDerivedProduct_Processing');
const {
    BiologicallyDerivedProduct_Manipulation
} = require('../FHIRDataTypesSchema/BiologicallyDerivedProduct_Manipulation');
const {
    BiologicallyDerivedProduct_Storage
} = require('../FHIRDataTypesSchema/BiologicallyDerivedProduct_Storage');
const {
    Bundle_Link
} = require('../FHIRDataTypesSchema/Bundle_Link');
const {
    Bundle_Entry
} = require('../FHIRDataTypesSchema/Bundle_Entry');
const {
    Bundle_Search
} = require('../FHIRDataTypesSchema/Bundle_Search');
const {
    Bundle_Request
} = require('../FHIRDataTypesSchema/Bundle_Request');
const {
    Bundle_Response
} = require('../FHIRDataTypesSchema/Bundle_Response');
const {
    CapabilityStatement_Software
} = require('../FHIRDataTypesSchema/CapabilityStatement_Software');
const {
    CapabilityStatement_Implementation
} = require('../FHIRDataTypesSchema/CapabilityStatement_Implementation');
const {
    CapabilityStatement_Rest
} = require('../FHIRDataTypesSchema/CapabilityStatement_Rest');
const {
    CapabilityStatement_Security
} = require('../FHIRDataTypesSchema/CapabilityStatement_Security');
const {
    CapabilityStatement_Resource
} = require('../FHIRDataTypesSchema/CapabilityStatement_Resource');
const {
    CapabilityStatement_Interaction
} = require('../FHIRDataTypesSchema/CapabilityStatement_Interaction');
const {
    CapabilityStatement_SearchParam
} = require('../FHIRDataTypesSchema/CapabilityStatement_SearchParam');
const {
    CapabilityStatement_Operation
} = require('../FHIRDataTypesSchema/CapabilityStatement_Operation');
const {
    CapabilityStatement_Interaction1
} = require('../FHIRDataTypesSchema/CapabilityStatement_Interaction1');
const {
    CapabilityStatement_Messaging
} = require('../FHIRDataTypesSchema/CapabilityStatement_Messaging');
const {
    CapabilityStatement_Endpoint
} = require('../FHIRDataTypesSchema/CapabilityStatement_Endpoint');
const {
    CapabilityStatement_SupportedMessage
} = require('../FHIRDataTypesSchema/CapabilityStatement_SupportedMessage');
const {
    CapabilityStatement_Document
} = require('../FHIRDataTypesSchema/CapabilityStatement_Document');
const {
    CarePlan_Activity
} = require('../FHIRDataTypesSchema/CarePlan_Activity');
const {
    CarePlan_Detail
} = require('../FHIRDataTypesSchema/CarePlan_Detail');
const {
    CareTeam_Participant
} = require('../FHIRDataTypesSchema/CareTeam_Participant');
const {
    CatalogEntry_RelatedEntry
} = require('../FHIRDataTypesSchema/CatalogEntry_RelatedEntry');
const {
    ChargeItem_Performer
} = require('../FHIRDataTypesSchema/ChargeItem_Performer');
const {
    ChargeItemDefinition_Applicability
} = require('../FHIRDataTypesSchema/ChargeItemDefinition_Applicability');
const {
    ChargeItemDefinition_PropertyGroup
} = require('../FHIRDataTypesSchema/ChargeItemDefinition_PropertyGroup');
const {
    ChargeItemDefinition_PriceComponent
} = require('../FHIRDataTypesSchema/ChargeItemDefinition_PriceComponent');
const {
    Claim_Related
} = require('../FHIRDataTypesSchema/Claim_Related');
const {
    Claim_Payee
} = require('../FHIRDataTypesSchema/Claim_Payee');
const {
    Claim_CareTeam
} = require('../FHIRDataTypesSchema/Claim_CareTeam');
const {
    Claim_SupportingInfo
} = require('../FHIRDataTypesSchema/Claim_SupportingInfo');
const {
    Claim_Diagnosis
} = require('../FHIRDataTypesSchema/Claim_Diagnosis');
const {
    Claim_Procedure
} = require('../FHIRDataTypesSchema/Claim_Procedure');
const {
    Claim_Insurance
} = require('../FHIRDataTypesSchema/Claim_Insurance');
const {
    Claim_Accident
} = require('../FHIRDataTypesSchema/Claim_Accident');
const {
    Claim_Item
} = require('../FHIRDataTypesSchema/Claim_Item');
const {
    Claim_Detail
} = require('../FHIRDataTypesSchema/Claim_Detail');
const {
    Claim_SubDetail
} = require('../FHIRDataTypesSchema/Claim_SubDetail');
const {
    ClaimResponse_Item
} = require('../FHIRDataTypesSchema/ClaimResponse_Item');
const {
    ClaimResponse_Adjudication
} = require('../FHIRDataTypesSchema/ClaimResponse_Adjudication');
const {
    ClaimResponse_Detail
} = require('../FHIRDataTypesSchema/ClaimResponse_Detail');
const {
    ClaimResponse_SubDetail
} = require('../FHIRDataTypesSchema/ClaimResponse_SubDetail');
const {
    ClaimResponse_AddItem
} = require('../FHIRDataTypesSchema/ClaimResponse_AddItem');
const {
    ClaimResponse_Detail1
} = require('../FHIRDataTypesSchema/ClaimResponse_Detail1');
const {
    ClaimResponse_SubDetail1
} = require('../FHIRDataTypesSchema/ClaimResponse_SubDetail1');
const {
    ClaimResponse_Total
} = require('../FHIRDataTypesSchema/ClaimResponse_Total');
const {
    ClaimResponse_Payment
} = require('../FHIRDataTypesSchema/ClaimResponse_Payment');
const {
    ClaimResponse_ProcessNote
} = require('../FHIRDataTypesSchema/ClaimResponse_ProcessNote');
const {
    ClaimResponse_Insurance
} = require('../FHIRDataTypesSchema/ClaimResponse_Insurance');
const {
    ClaimResponse_Error
} = require('../FHIRDataTypesSchema/ClaimResponse_Error');
const {
    ClinicalImpression_Investigation
} = require('../FHIRDataTypesSchema/ClinicalImpression_Investigation');
const {
    ClinicalImpression_Finding
} = require('../FHIRDataTypesSchema/ClinicalImpression_Finding');
const {
    CodeSystem_Filter
} = require('../FHIRDataTypesSchema/CodeSystem_Filter');
const {
    CodeSystem_Property
} = require('../FHIRDataTypesSchema/CodeSystem_Property');
const {
    CodeSystem_Concept
} = require('../FHIRDataTypesSchema/CodeSystem_Concept');
const {
    CodeSystem_Designation
} = require('../FHIRDataTypesSchema/CodeSystem_Designation');
const {
    CodeSystem_Property1
} = require('../FHIRDataTypesSchema/CodeSystem_Property1');
const {
    Communication_Payload
} = require('../FHIRDataTypesSchema/Communication_Payload');
const {
    CommunicationRequest_Payload
} = require('../FHIRDataTypesSchema/CommunicationRequest_Payload');
const {
    CompartmentDefinition_Resource
} = require('../FHIRDataTypesSchema/CompartmentDefinition_Resource');
const {
    Composition_Attester
} = require('../FHIRDataTypesSchema/Composition_Attester');
const {
    Composition_RelatesTo
} = require('../FHIRDataTypesSchema/Composition_RelatesTo');
const {
    Composition_Event
} = require('../FHIRDataTypesSchema/Composition_Event');
const {
    Composition_Section
} = require('../FHIRDataTypesSchema/Composition_Section');
const {
    ConceptMap_Group
} = require('../FHIRDataTypesSchema/ConceptMap_Group');
const {
    ConceptMap_Element
} = require('../FHIRDataTypesSchema/ConceptMap_Element');
const {
    ConceptMap_Target
} = require('../FHIRDataTypesSchema/ConceptMap_Target');
const {
    ConceptMap_DependsOn
} = require('../FHIRDataTypesSchema/ConceptMap_DependsOn');
const {
    ConceptMap_Unmapped
} = require('../FHIRDataTypesSchema/ConceptMap_Unmapped');
const {
    Condition_Stage
} = require('../FHIRDataTypesSchema/Condition_Stage');
const {
    Condition_Evidence
} = require('../FHIRDataTypesSchema/Condition_Evidence');
const {
    Consent_Policy
} = require('../FHIRDataTypesSchema/Consent_Policy');
const {
    Consent_Verification
} = require('../FHIRDataTypesSchema/Consent_Verification');
const {
    Consent_Provision
} = require('../FHIRDataTypesSchema/Consent_Provision');
const {
    Consent_Actor
} = require('../FHIRDataTypesSchema/Consent_Actor');
const {
    Consent_Data
} = require('../FHIRDataTypesSchema/Consent_Data');
const {
    Contract_ContentDefinition
} = require('../FHIRDataTypesSchema/Contract_ContentDefinition');
const {
    Contract_Term
} = require('../FHIRDataTypesSchema/Contract_Term');
const {
    Contract_SecurityLabel
} = require('../FHIRDataTypesSchema/Contract_SecurityLabel');
const {
    Contract_Offer
} = require('../FHIRDataTypesSchema/Contract_Offer');
const {
    Contract_Party
} = require('../FHIRDataTypesSchema/Contract_Party');
const {
    Contract_Answer
} = require('../FHIRDataTypesSchema/Contract_Answer');
const {
    Contract_Asset
} = require('../FHIRDataTypesSchema/Contract_Asset');
const {
    Contract_Context
} = require('../FHIRDataTypesSchema/Contract_Context');
const {
    Contract_ValuedItem
} = require('../FHIRDataTypesSchema/Contract_ValuedItem');
const {
    Contract_Action
} = require('../FHIRDataTypesSchema/Contract_Action');
const {
    Contract_Subject
} = require('../FHIRDataTypesSchema/Contract_Subject');
const {
    Contract_Signer
} = require('../FHIRDataTypesSchema/Contract_Signer');
const {
    Contract_Friendly
} = require('../FHIRDataTypesSchema/Contract_Friendly');
const {
    Contract_Legal
} = require('../FHIRDataTypesSchema/Contract_Legal');
const {
    Contract_Rule
} = require('../FHIRDataTypesSchema/Contract_Rule');
const {
    Coverage_Class
} = require('../FHIRDataTypesSchema/Coverage_Class');
const {
    Coverage_CostToBeneficiary
} = require('../FHIRDataTypesSchema/Coverage_CostToBeneficiary');
const {
    Coverage_Exception
} = require('../FHIRDataTypesSchema/Coverage_Exception');
const {
    CoverageEligibilityRequest_SupportingInfo
} = require('../FHIRDataTypesSchema/CoverageEligibilityRequest_SupportingInfo');
const {
    CoverageEligibilityRequest_Insurance
} = require('../FHIRDataTypesSchema/CoverageEligibilityRequest_Insurance');
const {
    CoverageEligibilityRequest_Item
} = require('../FHIRDataTypesSchema/CoverageEligibilityRequest_Item');
const {
    CoverageEligibilityRequest_Diagnosis
} = require('../FHIRDataTypesSchema/CoverageEligibilityRequest_Diagnosis');
const {
    CoverageEligibilityResponse_Insurance
} = require('../FHIRDataTypesSchema/CoverageEligibilityResponse_Insurance');
const {
    CoverageEligibilityResponse_Item
} = require('../FHIRDataTypesSchema/CoverageEligibilityResponse_Item');
const {
    CoverageEligibilityResponse_Benefit
} = require('../FHIRDataTypesSchema/CoverageEligibilityResponse_Benefit');
const {
    CoverageEligibilityResponse_Error
} = require('../FHIRDataTypesSchema/CoverageEligibilityResponse_Error');
const {
    DetectedIssue_Evidence
} = require('../FHIRDataTypesSchema/DetectedIssue_Evidence');
const {
    DetectedIssue_Mitigation
} = require('../FHIRDataTypesSchema/DetectedIssue_Mitigation');
const {
    Device_UdiCarrier
} = require('../FHIRDataTypesSchema/Device_UdiCarrier');
const {
    Device_DeviceName
} = require('../FHIRDataTypesSchema/Device_DeviceName');
const {
    Device_Specialization
} = require('../FHIRDataTypesSchema/Device_Specialization');
const {
    Device_Version
} = require('../FHIRDataTypesSchema/Device_Version');
const {
    Device_Property
} = require('../FHIRDataTypesSchema/Device_Property');
const {
    DeviceDefinition_UdiDeviceIdentifier
} = require('../FHIRDataTypesSchema/DeviceDefinition_UdiDeviceIdentifier');
const {
    DeviceDefinition_DeviceName
} = require('../FHIRDataTypesSchema/DeviceDefinition_DeviceName');
const {
    DeviceDefinition_Specialization
} = require('../FHIRDataTypesSchema/DeviceDefinition_Specialization');
const {
    DeviceDefinition_Capability
} = require('../FHIRDataTypesSchema/DeviceDefinition_Capability');
const {
    DeviceDefinition_Property
} = require('../FHIRDataTypesSchema/DeviceDefinition_Property');
const {
    DeviceDefinition_Material
} = require('../FHIRDataTypesSchema/DeviceDefinition_Material');
const {
    DeviceMetric_Calibration
} = require('../FHIRDataTypesSchema/DeviceMetric_Calibration');
const {
    DeviceRequest_Parameter
} = require('../FHIRDataTypesSchema/DeviceRequest_Parameter');
const {
    DiagnosticReport_Media
} = require('../FHIRDataTypesSchema/DiagnosticReport_Media');
const {
    DocumentManifest_Related
} = require('../FHIRDataTypesSchema/DocumentManifest_Related');
const {
    DocumentReference_RelatesTo
} = require('../FHIRDataTypesSchema/DocumentReference_RelatesTo');
const {
    DocumentReference_Content
} = require('../FHIRDataTypesSchema/DocumentReference_Content');
const {
    DocumentReference_Context
} = require('../FHIRDataTypesSchema/DocumentReference_Context');
const {
    EffectEvidenceSynthesis_SampleSize
} = require('../FHIRDataTypesSchema/EffectEvidenceSynthesis_SampleSize');
const {
    EffectEvidenceSynthesis_ResultsByExposure
} = require('../FHIRDataTypesSchema/EffectEvidenceSynthesis_ResultsByExposure');
const {
    EffectEvidenceSynthesis_EffectEstimate
} = require('../FHIRDataTypesSchema/EffectEvidenceSynthesis_EffectEstimate');
const {
    EffectEvidenceSynthesis_PrecisionEstimate
} = require('../FHIRDataTypesSchema/EffectEvidenceSynthesis_PrecisionEstimate');
const {
    EffectEvidenceSynthesis_Certainty
} = require('../FHIRDataTypesSchema/EffectEvidenceSynthesis_Certainty');
const {
    EffectEvidenceSynthesis_CertaintySubcomponent
} = require('../FHIRDataTypesSchema/EffectEvidenceSynthesis_CertaintySubcomponent');
const {
    Encounter_StatusHistory
} = require('../FHIRDataTypesSchema/Encounter_StatusHistory');
const {
    Encounter_ClassHistory
} = require('../FHIRDataTypesSchema/Encounter_ClassHistory');
const {
    Encounter_Participant
} = require('../FHIRDataTypesSchema/Encounter_Participant');
const {
    Encounter_Diagnosis
} = require('../FHIRDataTypesSchema/Encounter_Diagnosis');
const {
    Encounter_Hospitalization
} = require('../FHIRDataTypesSchema/Encounter_Hospitalization');
const {
    Encounter_Location
} = require('../FHIRDataTypesSchema/Encounter_Location');
const {
    EpisodeOfCare_StatusHistory
} = require('../FHIRDataTypesSchema/EpisodeOfCare_StatusHistory');
const {
    EpisodeOfCare_Diagnosis
} = require('../FHIRDataTypesSchema/EpisodeOfCare_Diagnosis');
const {
    EvidenceVariable_Characteristic
} = require('../FHIRDataTypesSchema/EvidenceVariable_Characteristic');
const {
    ExampleScenario_Actor
} = require('../FHIRDataTypesSchema/ExampleScenario_Actor');
const {
    ExampleScenario_Instance
} = require('../FHIRDataTypesSchema/ExampleScenario_Instance');
const {
    ExampleScenario_Version
} = require('../FHIRDataTypesSchema/ExampleScenario_Version');
const {
    ExampleScenario_ContainedInstance
} = require('../FHIRDataTypesSchema/ExampleScenario_ContainedInstance');
const {
    ExampleScenario_Process
} = require('../FHIRDataTypesSchema/ExampleScenario_Process');
const {
    ExampleScenario_Step
} = require('../FHIRDataTypesSchema/ExampleScenario_Step');
const {
    ExampleScenario_Operation
} = require('../FHIRDataTypesSchema/ExampleScenario_Operation');
const {
    ExampleScenario_Alternative
} = require('../FHIRDataTypesSchema/ExampleScenario_Alternative');
const {
    ExplanationOfBenefit_Related
} = require('../FHIRDataTypesSchema/ExplanationOfBenefit_Related');
const {
    ExplanationOfBenefit_Payee
} = require('../FHIRDataTypesSchema/ExplanationOfBenefit_Payee');
const {
    ExplanationOfBenefit_CareTeam
} = require('../FHIRDataTypesSchema/ExplanationOfBenefit_CareTeam');
const {
    ExplanationOfBenefit_SupportingInfo
} = require('../FHIRDataTypesSchema/ExplanationOfBenefit_SupportingInfo');
const {
    ExplanationOfBenefit_Diagnosis
} = require('../FHIRDataTypesSchema/ExplanationOfBenefit_Diagnosis');
const {
    ExplanationOfBenefit_Procedure
} = require('../FHIRDataTypesSchema/ExplanationOfBenefit_Procedure');
const {
    ExplanationOfBenefit_Insurance
} = require('../FHIRDataTypesSchema/ExplanationOfBenefit_Insurance');
const {
    ExplanationOfBenefit_Accident
} = require('../FHIRDataTypesSchema/ExplanationOfBenefit_Accident');
const {
    ExplanationOfBenefit_Item
} = require('../FHIRDataTypesSchema/ExplanationOfBenefit_Item');
const {
    ExplanationOfBenefit_Adjudication
} = require('../FHIRDataTypesSchema/ExplanationOfBenefit_Adjudication');
const {
    ExplanationOfBenefit_Detail
} = require('../FHIRDataTypesSchema/ExplanationOfBenefit_Detail');
const {
    ExplanationOfBenefit_SubDetail
} = require('../FHIRDataTypesSchema/ExplanationOfBenefit_SubDetail');
const {
    ExplanationOfBenefit_AddItem
} = require('../FHIRDataTypesSchema/ExplanationOfBenefit_AddItem');
const {
    ExplanationOfBenefit_Detail1
} = require('../FHIRDataTypesSchema/ExplanationOfBenefit_Detail1');
const {
    ExplanationOfBenefit_SubDetail1
} = require('../FHIRDataTypesSchema/ExplanationOfBenefit_SubDetail1');
const {
    ExplanationOfBenefit_Total
} = require('../FHIRDataTypesSchema/ExplanationOfBenefit_Total');
const {
    ExplanationOfBenefit_Payment
} = require('../FHIRDataTypesSchema/ExplanationOfBenefit_Payment');
const {
    ExplanationOfBenefit_ProcessNote
} = require('../FHIRDataTypesSchema/ExplanationOfBenefit_ProcessNote');
const {
    ExplanationOfBenefit_BenefitBalance
} = require('../FHIRDataTypesSchema/ExplanationOfBenefit_BenefitBalance');
const {
    ExplanationOfBenefit_Financial
} = require('../FHIRDataTypesSchema/ExplanationOfBenefit_Financial');
const {
    FamilyMemberHistory_Condition
} = require('../FHIRDataTypesSchema/FamilyMemberHistory_Condition');
const {
    Goal_Target
} = require('../FHIRDataTypesSchema/Goal_Target');
const {
    GraphDefinition_Link
} = require('../FHIRDataTypesSchema/GraphDefinition_Link');
const {
    GraphDefinition_Target
} = require('../FHIRDataTypesSchema/GraphDefinition_Target');
const {
    GraphDefinition_Compartment
} = require('../FHIRDataTypesSchema/GraphDefinition_Compartment');
const {
    Group_Characteristic
} = require('../FHIRDataTypesSchema/Group_Characteristic');
const {
    Group_Member
} = require('../FHIRDataTypesSchema/Group_Member');
const {
    HealthcareService_Eligibility
} = require('../FHIRDataTypesSchema/HealthcareService_Eligibility');
const {
    HealthcareService_AvailableTime
} = require('../FHIRDataTypesSchema/HealthcareService_AvailableTime');
const {
    HealthcareService_NotAvailable
} = require('../FHIRDataTypesSchema/HealthcareService_NotAvailable');
const {
    ImagingStudy_Series
} = require('../FHIRDataTypesSchema/ImagingStudy_Series');
const {
    ImagingStudy_Performer
} = require('../FHIRDataTypesSchema/ImagingStudy_Performer');
const {
    ImagingStudy_Instance
} = require('../FHIRDataTypesSchema/ImagingStudy_Instance');
const {
    Immunization_Performer
} = require('../FHIRDataTypesSchema/Immunization_Performer');
const {
    Immunization_Education
} = require('../FHIRDataTypesSchema/Immunization_Education');
const {
    Immunization_Reaction
} = require('../FHIRDataTypesSchema/Immunization_Reaction');
const {
    Immunization_ProtocolApplied
} = require('../FHIRDataTypesSchema/Immunization_ProtocolApplied');
const {
    ImmunizationRecommendation_Recommendation
} = require('../FHIRDataTypesSchema/ImmunizationRecommendation_Recommendation');
const {
    ImmunizationRecommendation_DateCriterion
} = require('../FHIRDataTypesSchema/ImmunizationRecommendation_DateCriterion');
const {
    ImplementationGuide_DependsOn
} = require('../FHIRDataTypesSchema/ImplementationGuide_DependsOn');
const {
    ImplementationGuide_Global
} = require('../FHIRDataTypesSchema/ImplementationGuide_Global');
const {
    ImplementationGuide_Definition
} = require('../FHIRDataTypesSchema/ImplementationGuide_Definition');
const {
    ImplementationGuide_Grouping
} = require('../FHIRDataTypesSchema/ImplementationGuide_Grouping');
const {
    ImplementationGuide_Resource
} = require('../FHIRDataTypesSchema/ImplementationGuide_Resource');
const {
    ImplementationGuide_Page
} = require('../FHIRDataTypesSchema/ImplementationGuide_Page');
const {
    ImplementationGuide_Parameter
} = require('../FHIRDataTypesSchema/ImplementationGuide_Parameter');
const {
    ImplementationGuide_Template
} = require('../FHIRDataTypesSchema/ImplementationGuide_Template');
const {
    ImplementationGuide_Manifest
} = require('../FHIRDataTypesSchema/ImplementationGuide_Manifest');
const {
    ImplementationGuide_Resource1
} = require('../FHIRDataTypesSchema/ImplementationGuide_Resource1');
const {
    ImplementationGuide_Page1
} = require('../FHIRDataTypesSchema/ImplementationGuide_Page1');
const {
    InsurancePlan_Contact
} = require('../FHIRDataTypesSchema/InsurancePlan_Contact');
const {
    InsurancePlan_Coverage
} = require('../FHIRDataTypesSchema/InsurancePlan_Coverage');
const {
    InsurancePlan_Benefit
} = require('../FHIRDataTypesSchema/InsurancePlan_Benefit');
const {
    InsurancePlan_Limit
} = require('../FHIRDataTypesSchema/InsurancePlan_Limit');
const {
    InsurancePlan_Plan
} = require('../FHIRDataTypesSchema/InsurancePlan_Plan');
const {
    InsurancePlan_GeneralCost
} = require('../FHIRDataTypesSchema/InsurancePlan_GeneralCost');
const {
    InsurancePlan_SpecificCost
} = require('../FHIRDataTypesSchema/InsurancePlan_SpecificCost');
const {
    InsurancePlan_Benefit1
} = require('../FHIRDataTypesSchema/InsurancePlan_Benefit1');
const {
    InsurancePlan_Cost
} = require('../FHIRDataTypesSchema/InsurancePlan_Cost');
const {
    Invoice_Participant
} = require('../FHIRDataTypesSchema/Invoice_Participant');
const {
    Invoice_LineItem
} = require('../FHIRDataTypesSchema/Invoice_LineItem');
const {
    Invoice_PriceComponent
} = require('../FHIRDataTypesSchema/Invoice_PriceComponent');
const {
    Linkage_Item
} = require('../FHIRDataTypesSchema/Linkage_Item');
const {
    List_Entry
} = require('../FHIRDataTypesSchema/List_Entry');
const {
    Location_Position
} = require('../FHIRDataTypesSchema/Location_Position');
const {
    Location_HoursOfOperation
} = require('../FHIRDataTypesSchema/Location_HoursOfOperation');
const {
    Measure_Group
} = require('../FHIRDataTypesSchema/Measure_Group');
const {
    Measure_Population
} = require('../FHIRDataTypesSchema/Measure_Population');
const {
    Measure_Stratifier
} = require('../FHIRDataTypesSchema/Measure_Stratifier');
const {
    Measure_Component
} = require('../FHIRDataTypesSchema/Measure_Component');
const {
    Measure_SupplementalData
} = require('../FHIRDataTypesSchema/Measure_SupplementalData');
const {
    MeasureReport_Group
} = require('../FHIRDataTypesSchema/MeasureReport_Group');
const {
    MeasureReport_Population
} = require('../FHIRDataTypesSchema/MeasureReport_Population');
const {
    MeasureReport_Stratifier
} = require('../FHIRDataTypesSchema/MeasureReport_Stratifier');
const {
    MeasureReport_Stratum
} = require('../FHIRDataTypesSchema/MeasureReport_Stratum');
const {
    MeasureReport_Component
} = require('../FHIRDataTypesSchema/MeasureReport_Component');
const {
    MeasureReport_Population1
} = require('../FHIRDataTypesSchema/MeasureReport_Population1');
const {
    Medication_Ingredient
} = require('../FHIRDataTypesSchema/Medication_Ingredient');
const {
    Medication_Batch
} = require('../FHIRDataTypesSchema/Medication_Batch');
const {
    MedicationAdministration_Performer
} = require('../FHIRDataTypesSchema/MedicationAdministration_Performer');
const {
    MedicationAdministration_Dosage
} = require('../FHIRDataTypesSchema/MedicationAdministration_Dosage');
const {
    MedicationDispense_Performer
} = require('../FHIRDataTypesSchema/MedicationDispense_Performer');
const {
    MedicationDispense_Substitution
} = require('../FHIRDataTypesSchema/MedicationDispense_Substitution');
const {
    MedicationKnowledge_RelatedMedicationKnowledge
} = require('../FHIRDataTypesSchema/MedicationKnowledge_RelatedMedicationKnowledge');
const {
    MedicationKnowledge_Monograph
} = require('../FHIRDataTypesSchema/MedicationKnowledge_Monograph');
const {
    MedicationKnowledge_Ingredient
} = require('../FHIRDataTypesSchema/MedicationKnowledge_Ingredient');
const {
    MedicationKnowledge_Cost
} = require('../FHIRDataTypesSchema/MedicationKnowledge_Cost');
const {
    MedicationKnowledge_MonitoringProgram
} = require('../FHIRDataTypesSchema/MedicationKnowledge_MonitoringProgram');
const {
    MedicationKnowledge_AdministrationGuidelines
} = require('../FHIRDataTypesSchema/MedicationKnowledge_AdministrationGuidelines');
const {
    MedicationKnowledge_Dosage
} = require('../FHIRDataTypesSchema/MedicationKnowledge_Dosage');
const {
    MedicationKnowledge_PatientCharacteristics
} = require('../FHIRDataTypesSchema/MedicationKnowledge_PatientCharacteristics');
const {
    MedicationKnowledge_MedicineClassification
} = require('../FHIRDataTypesSchema/MedicationKnowledge_MedicineClassification');
const {
    MedicationKnowledge_Packaging
} = require('../FHIRDataTypesSchema/MedicationKnowledge_Packaging');
const {
    MedicationKnowledge_DrugCharacteristic
} = require('../FHIRDataTypesSchema/MedicationKnowledge_DrugCharacteristic');
const {
    MedicationKnowledge_Regulatory
} = require('../FHIRDataTypesSchema/MedicationKnowledge_Regulatory');
const {
    MedicationKnowledge_Substitution
} = require('../FHIRDataTypesSchema/MedicationKnowledge_Substitution');
const {
    MedicationKnowledge_Schedule
} = require('../FHIRDataTypesSchema/MedicationKnowledge_Schedule');
const {
    MedicationKnowledge_MaxDispense
} = require('../FHIRDataTypesSchema/MedicationKnowledge_MaxDispense');
const {
    MedicationKnowledge_Kinetics
} = require('../FHIRDataTypesSchema/MedicationKnowledge_Kinetics');
const {
    MedicationRequest_DispenseRequest
} = require('../FHIRDataTypesSchema/MedicationRequest_DispenseRequest');
const {
    MedicationRequest_InitialFill
} = require('../FHIRDataTypesSchema/MedicationRequest_InitialFill');
const {
    MedicationRequest_Substitution
} = require('../FHIRDataTypesSchema/MedicationRequest_Substitution');
const {
    MedicinalProduct_Name
} = require('../FHIRDataTypesSchema/MedicinalProduct_Name');
const {
    MedicinalProduct_NamePart
} = require('../FHIRDataTypesSchema/MedicinalProduct_NamePart');
const {
    MedicinalProduct_CountryLanguage
} = require('../FHIRDataTypesSchema/MedicinalProduct_CountryLanguage');
const {
    MedicinalProduct_ManufacturingBusinessOperation
} = require('../FHIRDataTypesSchema/MedicinalProduct_ManufacturingBusinessOperation');
const {
    MedicinalProduct_SpecialDesignation
} = require('../FHIRDataTypesSchema/MedicinalProduct_SpecialDesignation');
const {
    MedicinalProductAuthorization_JurisdictionalAuthorization
} = require('../FHIRDataTypesSchema/MedicinalProductAuthorization_JurisdictionalAuthorization');
const {
    MedicinalProductAuthorization_Procedure
} = require('../FHIRDataTypesSchema/MedicinalProductAuthorization_Procedure');
const {
    MedicinalProductContraindication_OtherTherapy
} = require('../FHIRDataTypesSchema/MedicinalProductContraindication_OtherTherapy');
const {
    MedicinalProductIndication_OtherTherapy
} = require('../FHIRDataTypesSchema/MedicinalProductIndication_OtherTherapy');
const {
    MedicinalProductIngredient_SpecifiedSubstance
} = require('../FHIRDataTypesSchema/MedicinalProductIngredient_SpecifiedSubstance');
const {
    MedicinalProductIngredient_Strength
} = require('../FHIRDataTypesSchema/MedicinalProductIngredient_Strength');
const {
    MedicinalProductIngredient_ReferenceStrength
} = require('../FHIRDataTypesSchema/MedicinalProductIngredient_ReferenceStrength');
const {
    MedicinalProductIngredient_Substance
} = require('../FHIRDataTypesSchema/MedicinalProductIngredient_Substance');
const {
    MedicinalProductInteraction_Interactant
} = require('../FHIRDataTypesSchema/MedicinalProductInteraction_Interactant');
const {
    MedicinalProductPackaged_BatchIdentifier
} = require('../FHIRDataTypesSchema/MedicinalProductPackaged_BatchIdentifier');
const {
    MedicinalProductPackaged_PackageItem
} = require('../FHIRDataTypesSchema/MedicinalProductPackaged_PackageItem');
const {
    MedicinalProductPharmaceutical_Characteristics
} = require('../FHIRDataTypesSchema/MedicinalProductPharmaceutical_Characteristics');
const {
    MedicinalProductPharmaceutical_RouteOfAdministration
} = require('../FHIRDataTypesSchema/MedicinalProductPharmaceutical_RouteOfAdministration');
const {
    MedicinalProductPharmaceutical_TargetSpecies
} = require('../FHIRDataTypesSchema/MedicinalProductPharmaceutical_TargetSpecies');
const {
    MedicinalProductPharmaceutical_WithdrawalPeriod
} = require('../FHIRDataTypesSchema/MedicinalProductPharmaceutical_WithdrawalPeriod');
const {
    MessageDefinition_Focus
} = require('../FHIRDataTypesSchema/MessageDefinition_Focus');
const {
    MessageDefinition_AllowedResponse
} = require('../FHIRDataTypesSchema/MessageDefinition_AllowedResponse');
const {
    MessageHeader_Destination
} = require('../FHIRDataTypesSchema/MessageHeader_Destination');
const {
    MessageHeader_Source
} = require('../FHIRDataTypesSchema/MessageHeader_Source');
const {
    MessageHeader_Response
} = require('../FHIRDataTypesSchema/MessageHeader_Response');
const {
    MolecularSequence_ReferenceSeq
} = require('../FHIRDataTypesSchema/MolecularSequence_ReferenceSeq');
const {
    MolecularSequence_Variant
} = require('../FHIRDataTypesSchema/MolecularSequence_Variant');
const {
    MolecularSequence_Quality
} = require('../FHIRDataTypesSchema/MolecularSequence_Quality');
const {
    MolecularSequence_Roc
} = require('../FHIRDataTypesSchema/MolecularSequence_Roc');
const {
    MolecularSequence_Repository
} = require('../FHIRDataTypesSchema/MolecularSequence_Repository');
const {
    MolecularSequence_StructureVariant
} = require('../FHIRDataTypesSchema/MolecularSequence_StructureVariant');
const {
    MolecularSequence_Outer
} = require('../FHIRDataTypesSchema/MolecularSequence_Outer');
const {
    MolecularSequence_Inner
} = require('../FHIRDataTypesSchema/MolecularSequence_Inner');
const {
    NamingSystem_UniqueId
} = require('../FHIRDataTypesSchema/NamingSystem_UniqueId');
const {
    NutritionOrder_OralDiet
} = require('../FHIRDataTypesSchema/NutritionOrder_OralDiet');
const {
    NutritionOrder_Nutrient
} = require('../FHIRDataTypesSchema/NutritionOrder_Nutrient');
const {
    NutritionOrder_Texture
} = require('../FHIRDataTypesSchema/NutritionOrder_Texture');
const {
    NutritionOrder_Supplement
} = require('../FHIRDataTypesSchema/NutritionOrder_Supplement');
const {
    NutritionOrder_EnteralFormula
} = require('../FHIRDataTypesSchema/NutritionOrder_EnteralFormula');
const {
    NutritionOrder_Administration
} = require('../FHIRDataTypesSchema/NutritionOrder_Administration');
const {
    Observation_ReferenceRange
} = require('../FHIRDataTypesSchema/Observation_ReferenceRange');
const {
    Observation_Component
} = require('../FHIRDataTypesSchema/Observation_Component');
const {
    ObservationDefinition_QuantitativeDetails
} = require('../FHIRDataTypesSchema/ObservationDefinition_QuantitativeDetails');
const {
    ObservationDefinition_QualifiedInterval
} = require('../FHIRDataTypesSchema/ObservationDefinition_QualifiedInterval');
const {
    OperationDefinition_Parameter
} = require('../FHIRDataTypesSchema/OperationDefinition_Parameter');
const {
    OperationDefinition_Binding
} = require('../FHIRDataTypesSchema/OperationDefinition_Binding');
const {
    OperationDefinition_ReferencedFrom
} = require('../FHIRDataTypesSchema/OperationDefinition_ReferencedFrom');
const {
    OperationDefinition_Overload
} = require('../FHIRDataTypesSchema/OperationDefinition_Overload');
const {
    OperationOutcome_Issue
} = require('../FHIRDataTypesSchema/OperationOutcome_Issue');
const {
    Organization_Contact
} = require('../FHIRDataTypesSchema/Organization_Contact');
const {
    Parameters_Parameter
} = require('../FHIRDataTypesSchema/Parameters_Parameter');
const {
    Patient_Contact
} = require('../FHIRDataTypesSchema/Patient_Contact');
const {
    Patient_Communication
} = require('../FHIRDataTypesSchema/Patient_Communication');
const {
    Patient_Link
} = require('../FHIRDataTypesSchema/Patient_Link');
const {
    PaymentReconciliation_Detail
} = require('../FHIRDataTypesSchema/PaymentReconciliation_Detail');
const {
    PaymentReconciliation_ProcessNote
} = require('../FHIRDataTypesSchema/PaymentReconciliation_ProcessNote');
const {
    Person_Link
} = require('../FHIRDataTypesSchema/Person_Link');
const {
    PlanDefinition_Goal
} = require('../FHIRDataTypesSchema/PlanDefinition_Goal');
const {
    PlanDefinition_Target
} = require('../FHIRDataTypesSchema/PlanDefinition_Target');
const {
    PlanDefinition_Action
} = require('../FHIRDataTypesSchema/PlanDefinition_Action');
const {
    PlanDefinition_Condition
} = require('../FHIRDataTypesSchema/PlanDefinition_Condition');
const {
    PlanDefinition_RelatedAction
} = require('../FHIRDataTypesSchema/PlanDefinition_RelatedAction');
const {
    PlanDefinition_Participant
} = require('../FHIRDataTypesSchema/PlanDefinition_Participant');
const {
    PlanDefinition_DynamicValue
} = require('../FHIRDataTypesSchema/PlanDefinition_DynamicValue');
const {
    Practitioner_Qualification
} = require('../FHIRDataTypesSchema/Practitioner_Qualification');
const {
    PractitionerRole_AvailableTime
} = require('../FHIRDataTypesSchema/PractitionerRole_AvailableTime');
const {
    PractitionerRole_NotAvailable
} = require('../FHIRDataTypesSchema/PractitionerRole_NotAvailable');
const {
    Procedure_Performer
} = require('../FHIRDataTypesSchema/Procedure_Performer');
const {
    Procedure_FocalDevice
} = require('../FHIRDataTypesSchema/Procedure_FocalDevice');
const {
    Provenance_Agent
} = require('../FHIRDataTypesSchema/Provenance_Agent');
const {
    Provenance_Entity
} = require('../FHIRDataTypesSchema/Provenance_Entity');
const {
    Questionnaire_Item
} = require('../FHIRDataTypesSchema/Questionnaire_Item');
const {
    Questionnaire_EnableWhen
} = require('../FHIRDataTypesSchema/Questionnaire_EnableWhen');
const {
    Questionnaire_AnswerOption
} = require('../FHIRDataTypesSchema/Questionnaire_AnswerOption');
const {
    Questionnaire_Initial
} = require('../FHIRDataTypesSchema/Questionnaire_Initial');
const {
    QuestionnaireResponse_Item
} = require('../FHIRDataTypesSchema/QuestionnaireResponse_Item');
const {
    QuestionnaireResponse_Answer
} = require('../FHIRDataTypesSchema/QuestionnaireResponse_Answer');
const {
    RelatedPerson_Communication
} = require('../FHIRDataTypesSchema/RelatedPerson_Communication');
const {
    RequestGroup_Action
} = require('../FHIRDataTypesSchema/RequestGroup_Action');
const {
    RequestGroup_Condition
} = require('../FHIRDataTypesSchema/RequestGroup_Condition');
const {
    RequestGroup_RelatedAction
} = require('../FHIRDataTypesSchema/RequestGroup_RelatedAction');
const {
    ResearchElementDefinition_Characteristic
} = require('../FHIRDataTypesSchema/ResearchElementDefinition_Characteristic');
const {
    ResearchStudy_Arm
} = require('../FHIRDataTypesSchema/ResearchStudy_Arm');
const {
    ResearchStudy_Objective
} = require('../FHIRDataTypesSchema/ResearchStudy_Objective');
const {
    RiskAssessment_Prediction
} = require('../FHIRDataTypesSchema/RiskAssessment_Prediction');
const {
    RiskEvidenceSynthesis_SampleSize
} = require('../FHIRDataTypesSchema/RiskEvidenceSynthesis_SampleSize');
const {
    RiskEvidenceSynthesis_RiskEstimate
} = require('../FHIRDataTypesSchema/RiskEvidenceSynthesis_RiskEstimate');
const {
    RiskEvidenceSynthesis_PrecisionEstimate
} = require('../FHIRDataTypesSchema/RiskEvidenceSynthesis_PrecisionEstimate');
const {
    RiskEvidenceSynthesis_Certainty
} = require('../FHIRDataTypesSchema/RiskEvidenceSynthesis_Certainty');
const {
    RiskEvidenceSynthesis_CertaintySubcomponent
} = require('../FHIRDataTypesSchema/RiskEvidenceSynthesis_CertaintySubcomponent');
const {
    SearchParameter_Component
} = require('../FHIRDataTypesSchema/SearchParameter_Component');
const {
    Specimen_Collection
} = require('../FHIRDataTypesSchema/Specimen_Collection');
const {
    Specimen_Processing
} = require('../FHIRDataTypesSchema/Specimen_Processing');
const {
    Specimen_Container
} = require('../FHIRDataTypesSchema/Specimen_Container');
const {
    SpecimenDefinition_TypeTested
} = require('../FHIRDataTypesSchema/SpecimenDefinition_TypeTested');
const {
    SpecimenDefinition_Container
} = require('../FHIRDataTypesSchema/SpecimenDefinition_Container');
const {
    SpecimenDefinition_Additive
} = require('../FHIRDataTypesSchema/SpecimenDefinition_Additive');
const {
    SpecimenDefinition_Handling
} = require('../FHIRDataTypesSchema/SpecimenDefinition_Handling');
const {
    StructureDefinition_Mapping
} = require('../FHIRDataTypesSchema/StructureDefinition_Mapping');
const {
    StructureDefinition_Context
} = require('../FHIRDataTypesSchema/StructureDefinition_Context');
const {
    StructureDefinition_Snapshot
} = require('../FHIRDataTypesSchema/StructureDefinition_Snapshot');
const {
    StructureDefinition_Differential
} = require('../FHIRDataTypesSchema/StructureDefinition_Differential');
const {
    StructureMap_Structure
} = require('../FHIRDataTypesSchema/StructureMap_Structure');
const {
    StructureMap_Group
} = require('../FHIRDataTypesSchema/StructureMap_Group');
const {
    StructureMap_Input
} = require('../FHIRDataTypesSchema/StructureMap_Input');
const {
    StructureMap_Rule
} = require('../FHIRDataTypesSchema/StructureMap_Rule');
const {
    StructureMap_Source
} = require('../FHIRDataTypesSchema/StructureMap_Source');
const {
    StructureMap_Target
} = require('../FHIRDataTypesSchema/StructureMap_Target');
const {
    StructureMap_Parameter
} = require('../FHIRDataTypesSchema/StructureMap_Parameter');
const {
    StructureMap_Dependent
} = require('../FHIRDataTypesSchema/StructureMap_Dependent');
const {
    Subscription_Channel
} = require('../FHIRDataTypesSchema/Subscription_Channel');
const {
    Substance_Instance
} = require('../FHIRDataTypesSchema/Substance_Instance');
const {
    Substance_Ingredient
} = require('../FHIRDataTypesSchema/Substance_Ingredient');
const {
    SubstanceNucleicAcid_Subunit
} = require('../FHIRDataTypesSchema/SubstanceNucleicAcid_Subunit');
const {
    SubstanceNucleicAcid_Linkage
} = require('../FHIRDataTypesSchema/SubstanceNucleicAcid_Linkage');
const {
    SubstanceNucleicAcid_Sugar
} = require('../FHIRDataTypesSchema/SubstanceNucleicAcid_Sugar');
const {
    SubstancePolymer_MonomerSet
} = require('../FHIRDataTypesSchema/SubstancePolymer_MonomerSet');
const {
    SubstancePolymer_StartingMaterial
} = require('../FHIRDataTypesSchema/SubstancePolymer_StartingMaterial');
const {
    SubstancePolymer_Repeat
} = require('../FHIRDataTypesSchema/SubstancePolymer_Repeat');
const {
    SubstancePolymer_RepeatUnit
} = require('../FHIRDataTypesSchema/SubstancePolymer_RepeatUnit');
const {
    SubstancePolymer_DegreeOfPolymerisation
} = require('../FHIRDataTypesSchema/SubstancePolymer_DegreeOfPolymerisation');
const {
    SubstancePolymer_StructuralRepresentation
} = require('../FHIRDataTypesSchema/SubstancePolymer_StructuralRepresentation');
const {
    SubstanceProtein_Subunit
} = require('../FHIRDataTypesSchema/SubstanceProtein_Subunit');
const {
    SubstanceReferenceInformation_Gene
} = require('../FHIRDataTypesSchema/SubstanceReferenceInformation_Gene');
const {
    SubstanceReferenceInformation_GeneElement
} = require('../FHIRDataTypesSchema/SubstanceReferenceInformation_GeneElement');
const {
    SubstanceReferenceInformation_Classification
} = require('../FHIRDataTypesSchema/SubstanceReferenceInformation_Classification');
const {
    SubstanceReferenceInformation_Target
} = require('../FHIRDataTypesSchema/SubstanceReferenceInformation_Target');
const {
    SubstanceSourceMaterial_FractionDescription
} = require('../FHIRDataTypesSchema/SubstanceSourceMaterial_FractionDescription');
const {
    SubstanceSourceMaterial_Organism
} = require('../FHIRDataTypesSchema/SubstanceSourceMaterial_Organism');
const {
    SubstanceSourceMaterial_Author
} = require('../FHIRDataTypesSchema/SubstanceSourceMaterial_Author');
const {
    SubstanceSourceMaterial_Hybrid
} = require('../FHIRDataTypesSchema/SubstanceSourceMaterial_Hybrid');
const {
    SubstanceSourceMaterial_OrganismGeneral
} = require('../FHIRDataTypesSchema/SubstanceSourceMaterial_OrganismGeneral');
const {
    SubstanceSourceMaterial_PartDescription
} = require('../FHIRDataTypesSchema/SubstanceSourceMaterial_PartDescription');
const {
    SubstanceSpecification_Moiety
} = require('../FHIRDataTypesSchema/SubstanceSpecification_Moiety');
const {
    SubstanceSpecification_Property
} = require('../FHIRDataTypesSchema/SubstanceSpecification_Property');
const {
    SubstanceSpecification_Structure
} = require('../FHIRDataTypesSchema/SubstanceSpecification_Structure');
const {
    SubstanceSpecification_Isotope
} = require('../FHIRDataTypesSchema/SubstanceSpecification_Isotope');
const {
    SubstanceSpecification_MolecularWeight
} = require('../FHIRDataTypesSchema/SubstanceSpecification_MolecularWeight');
const {
    SubstanceSpecification_Representation
} = require('../FHIRDataTypesSchema/SubstanceSpecification_Representation');
const {
    SubstanceSpecification_Code
} = require('../FHIRDataTypesSchema/SubstanceSpecification_Code');
const {
    SubstanceSpecification_Name
} = require('../FHIRDataTypesSchema/SubstanceSpecification_Name');
const {
    SubstanceSpecification_Official
} = require('../FHIRDataTypesSchema/SubstanceSpecification_Official');
const {
    SubstanceSpecification_Relationship
} = require('../FHIRDataTypesSchema/SubstanceSpecification_Relationship');
const {
    SupplyDelivery_SuppliedItem
} = require('../FHIRDataTypesSchema/SupplyDelivery_SuppliedItem');
const {
    SupplyRequest_Parameter
} = require('../FHIRDataTypesSchema/SupplyRequest_Parameter');
const {
    Task_Restriction
} = require('../FHIRDataTypesSchema/Task_Restriction');
const {
    Task_Input
} = require('../FHIRDataTypesSchema/Task_Input');
const {
    Task_Output
} = require('../FHIRDataTypesSchema/Task_Output');
const {
    TerminologyCapabilities_Software
} = require('../FHIRDataTypesSchema/TerminologyCapabilities_Software');
const {
    TerminologyCapabilities_Implementation
} = require('../FHIRDataTypesSchema/TerminologyCapabilities_Implementation');
const {
    TerminologyCapabilities_CodeSystem
} = require('../FHIRDataTypesSchema/TerminologyCapabilities_CodeSystem');
const {
    TerminologyCapabilities_Version
} = require('../FHIRDataTypesSchema/TerminologyCapabilities_Version');
const {
    TerminologyCapabilities_Filter
} = require('../FHIRDataTypesSchema/TerminologyCapabilities_Filter');
const {
    TerminologyCapabilities_Expansion
} = require('../FHIRDataTypesSchema/TerminologyCapabilities_Expansion');
const {
    TerminologyCapabilities_Parameter
} = require('../FHIRDataTypesSchema/TerminologyCapabilities_Parameter');
const {
    TerminologyCapabilities_ValidateCode
} = require('../FHIRDataTypesSchema/TerminologyCapabilities_ValidateCode');
const {
    TerminologyCapabilities_Translation
} = require('../FHIRDataTypesSchema/TerminologyCapabilities_Translation');
const {
    TerminologyCapabilities_Closure
} = require('../FHIRDataTypesSchema/TerminologyCapabilities_Closure');
const {
    TestReport_Participant
} = require('../FHIRDataTypesSchema/TestReport_Participant');
const {
    TestReport_Setup
} = require('../FHIRDataTypesSchema/TestReport_Setup');
const {
    TestReport_Action
} = require('../FHIRDataTypesSchema/TestReport_Action');
const {
    TestReport_Operation
} = require('../FHIRDataTypesSchema/TestReport_Operation');
const {
    TestReport_Assert
} = require('../FHIRDataTypesSchema/TestReport_Assert');
const {
    TestReport_Test
} = require('../FHIRDataTypesSchema/TestReport_Test');
const {
    TestReport_Action1
} = require('../FHIRDataTypesSchema/TestReport_Action1');
const {
    TestReport_Teardown
} = require('../FHIRDataTypesSchema/TestReport_Teardown');
const {
    TestReport_Action2
} = require('../FHIRDataTypesSchema/TestReport_Action2');
const {
    TestScript_Origin
} = require('../FHIRDataTypesSchema/TestScript_Origin');
const {
    TestScript_Destination
} = require('../FHIRDataTypesSchema/TestScript_Destination');
const {
    TestScript_Metadata
} = require('../FHIRDataTypesSchema/TestScript_Metadata');
const {
    TestScript_Link
} = require('../FHIRDataTypesSchema/TestScript_Link');
const {
    TestScript_Capability
} = require('../FHIRDataTypesSchema/TestScript_Capability');
const {
    TestScript_Fixture
} = require('../FHIRDataTypesSchema/TestScript_Fixture');
const {
    TestScript_Variable
} = require('../FHIRDataTypesSchema/TestScript_Variable');
const {
    TestScript_Setup
} = require('../FHIRDataTypesSchema/TestScript_Setup');
const {
    TestScript_Action
} = require('../FHIRDataTypesSchema/TestScript_Action');
const {
    TestScript_Operation
} = require('../FHIRDataTypesSchema/TestScript_Operation');
const {
    TestScript_RequestHeader
} = require('../FHIRDataTypesSchema/TestScript_RequestHeader');
const {
    TestScript_Assert
} = require('../FHIRDataTypesSchema/TestScript_Assert');
const {
    TestScript_Test
} = require('../FHIRDataTypesSchema/TestScript_Test');
const {
    TestScript_Action1
} = require('../FHIRDataTypesSchema/TestScript_Action1');
const {
    TestScript_Teardown
} = require('../FHIRDataTypesSchema/TestScript_Teardown');
const {
    TestScript_Action2
} = require('../FHIRDataTypesSchema/TestScript_Action2');
const {
    ValueSet_Compose
} = require('../FHIRDataTypesSchema/ValueSet_Compose');
const {
    ValueSet_Include
} = require('../FHIRDataTypesSchema/ValueSet_Include');
const {
    ValueSet_Concept
} = require('../FHIRDataTypesSchema/ValueSet_Concept');
const {
    ValueSet_Designation
} = require('../FHIRDataTypesSchema/ValueSet_Designation');
const {
    ValueSet_Filter
} = require('../FHIRDataTypesSchema/ValueSet_Filter');
const {
    ValueSet_Expansion
} = require('../FHIRDataTypesSchema/ValueSet_Expansion');
const {
    ValueSet_Parameter
} = require('../FHIRDataTypesSchema/ValueSet_Parameter');
const {
    ValueSet_Contains
} = require('../FHIRDataTypesSchema/ValueSet_Contains');
const {
    VerificationResult_PrimarySource
} = require('../FHIRDataTypesSchema/VerificationResult_PrimarySource');
const {
    VerificationResult_Attestation
} = require('../FHIRDataTypesSchema/VerificationResult_Attestation');
const {
    VerificationResult_Validator
} = require('../FHIRDataTypesSchema/VerificationResult_Validator');
const {
    VisionPrescription_LensSpecification
} = require('../FHIRDataTypesSchema/VisionPrescription_LensSpecification');
const {
    VisionPrescription_Prism
} = require('../FHIRDataTypesSchema/VisionPrescription_Prism');
module.exports = {
    Element: Element,
    Extension: Extension,
    Narrative: Narrative,
    Annotation: Annotation,
    Attachment: Attachment,
    Identifier: Identifier,
    CodeableConcept: CodeableConcept,
    Coding: Coding,
    Quantity: Quantity,
    Duration: Duration,
    Distance: Distance,
    Count: Count,
    Money: Money,
    Age: Age,
    Range: Range,
    Period: Period,
    Ratio: Ratio,
    Reference: Reference,
    SampledData: SampledData,
    Signature: Signature,
    HumanName: HumanName,
    Address: Address,
    ContactPoint: ContactPoint,
    Timing: Timing,
    Timing_Repeat: Timing_Repeat,
    Meta: Meta,
    ContactDetail: ContactDetail,
    Contributor: Contributor,
    DataRequirement: DataRequirement,
    DataRequirement_CodeFilter: DataRequirement_CodeFilter,
    DataRequirement_DateFilter: DataRequirement_DateFilter,
    DataRequirement_Sort: DataRequirement_Sort,
    ParameterDefinition: ParameterDefinition,
    RelatedArtifact: RelatedArtifact,
    TriggerDefinition: TriggerDefinition,
    UsageContext: UsageContext,
    Dosage: Dosage,
    Dosage_DoseAndRate: Dosage_DoseAndRate,
    Population: Population,
    ProductShelfLife: ProductShelfLife,
    ProdCharacteristic: ProdCharacteristic,
    MarketingStatus: MarketingStatus,
    SubstanceAmount: SubstanceAmount,
    SubstanceAmount_ReferenceRange: SubstanceAmount_ReferenceRange,
    Expression: Expression,
    ElementDefinition: ElementDefinition,
    ElementDefinition_Slicing: ElementDefinition_Slicing,
    ElementDefinition_Discriminator: ElementDefinition_Discriminator,
    ElementDefinition_Base: ElementDefinition_Base,
    ElementDefinition_Type: ElementDefinition_Type,
    ElementDefinition_Example: ElementDefinition_Example,
    ElementDefinition_Constraint: ElementDefinition_Constraint,
    ElementDefinition_Binding: ElementDefinition_Binding,
    ElementDefinition_Mapping: ElementDefinition_Mapping,
    Account_Coverage: Account_Coverage,
    Account_Guarantor: Account_Guarantor,
    ActivityDefinition_Participant: ActivityDefinition_Participant,
    ActivityDefinition_DynamicValue: ActivityDefinition_DynamicValue,
    AdverseEvent_SuspectEntity: AdverseEvent_SuspectEntity,
    AdverseEvent_Causality: AdverseEvent_Causality,
    AllergyIntolerance_Reaction: AllergyIntolerance_Reaction,
    Appointment_Participant: Appointment_Participant,
    AuditEvent_Agent: AuditEvent_Agent,
    AuditEvent_Network: AuditEvent_Network,
    AuditEvent_Source: AuditEvent_Source,
    AuditEvent_Entity: AuditEvent_Entity,
    AuditEvent_Detail: AuditEvent_Detail,
    BiologicallyDerivedProduct_Collection: BiologicallyDerivedProduct_Collection,
    BiologicallyDerivedProduct_Processing: BiologicallyDerivedProduct_Processing,
    BiologicallyDerivedProduct_Manipulation: BiologicallyDerivedProduct_Manipulation,
    BiologicallyDerivedProduct_Storage: BiologicallyDerivedProduct_Storage,
    Bundle_Link: Bundle_Link,
    Bundle_Entry: Bundle_Entry,
    Bundle_Search: Bundle_Search,
    Bundle_Request: Bundle_Request,
    Bundle_Response: Bundle_Response,
    CapabilityStatement_Software: CapabilityStatement_Software,
    CapabilityStatement_Implementation: CapabilityStatement_Implementation,
    CapabilityStatement_Rest: CapabilityStatement_Rest,
    CapabilityStatement_Security: CapabilityStatement_Security,
    CapabilityStatement_Resource: CapabilityStatement_Resource,
    CapabilityStatement_Interaction: CapabilityStatement_Interaction,
    CapabilityStatement_SearchParam: CapabilityStatement_SearchParam,
    CapabilityStatement_Operation: CapabilityStatement_Operation,
    CapabilityStatement_Interaction1: CapabilityStatement_Interaction1,
    CapabilityStatement_Messaging: CapabilityStatement_Messaging,
    CapabilityStatement_Endpoint: CapabilityStatement_Endpoint,
    CapabilityStatement_SupportedMessage: CapabilityStatement_SupportedMessage,
    CapabilityStatement_Document: CapabilityStatement_Document,
    CarePlan_Activity: CarePlan_Activity,
    CarePlan_Detail: CarePlan_Detail,
    CareTeam_Participant: CareTeam_Participant,
    CatalogEntry_RelatedEntry: CatalogEntry_RelatedEntry,
    ChargeItem_Performer: ChargeItem_Performer,
    ChargeItemDefinition_Applicability: ChargeItemDefinition_Applicability,
    ChargeItemDefinition_PropertyGroup: ChargeItemDefinition_PropertyGroup,
    ChargeItemDefinition_PriceComponent: ChargeItemDefinition_PriceComponent,
    Claim_Related: Claim_Related,
    Claim_Payee: Claim_Payee,
    Claim_CareTeam: Claim_CareTeam,
    Claim_SupportingInfo: Claim_SupportingInfo,
    Claim_Diagnosis: Claim_Diagnosis,
    Claim_Procedure: Claim_Procedure,
    Claim_Insurance: Claim_Insurance,
    Claim_Accident: Claim_Accident,
    Claim_Item: Claim_Item,
    Claim_Detail: Claim_Detail,
    Claim_SubDetail: Claim_SubDetail,
    ClaimResponse_Item: ClaimResponse_Item,
    ClaimResponse_Adjudication: ClaimResponse_Adjudication,
    ClaimResponse_Detail: ClaimResponse_Detail,
    ClaimResponse_SubDetail: ClaimResponse_SubDetail,
    ClaimResponse_AddItem: ClaimResponse_AddItem,
    ClaimResponse_Detail1: ClaimResponse_Detail1,
    ClaimResponse_SubDetail1: ClaimResponse_SubDetail1,
    ClaimResponse_Total: ClaimResponse_Total,
    ClaimResponse_Payment: ClaimResponse_Payment,
    ClaimResponse_ProcessNote: ClaimResponse_ProcessNote,
    ClaimResponse_Insurance: ClaimResponse_Insurance,
    ClaimResponse_Error: ClaimResponse_Error,
    ClinicalImpression_Investigation: ClinicalImpression_Investigation,
    ClinicalImpression_Finding: ClinicalImpression_Finding,
    CodeSystem_Filter: CodeSystem_Filter,
    CodeSystem_Property: CodeSystem_Property,
    CodeSystem_Concept: CodeSystem_Concept,
    CodeSystem_Designation: CodeSystem_Designation,
    CodeSystem_Property1: CodeSystem_Property1,
    Communication_Payload: Communication_Payload,
    CommunicationRequest_Payload: CommunicationRequest_Payload,
    CompartmentDefinition_Resource: CompartmentDefinition_Resource,
    Composition_Attester: Composition_Attester,
    Composition_RelatesTo: Composition_RelatesTo,
    Composition_Event: Composition_Event,
    Composition_Section: Composition_Section,
    ConceptMap_Group: ConceptMap_Group,
    ConceptMap_Element: ConceptMap_Element,
    ConceptMap_Target: ConceptMap_Target,
    ConceptMap_DependsOn: ConceptMap_DependsOn,
    ConceptMap_Unmapped: ConceptMap_Unmapped,
    Condition_Stage: Condition_Stage,
    Condition_Evidence: Condition_Evidence,
    Consent_Policy: Consent_Policy,
    Consent_Verification: Consent_Verification,
    Consent_Provision: Consent_Provision,
    Consent_Actor: Consent_Actor,
    Consent_Data: Consent_Data,
    Contract_ContentDefinition: Contract_ContentDefinition,
    Contract_Term: Contract_Term,
    Contract_SecurityLabel: Contract_SecurityLabel,
    Contract_Offer: Contract_Offer,
    Contract_Party: Contract_Party,
    Contract_Answer: Contract_Answer,
    Contract_Asset: Contract_Asset,
    Contract_Context: Contract_Context,
    Contract_ValuedItem: Contract_ValuedItem,
    Contract_Action: Contract_Action,
    Contract_Subject: Contract_Subject,
    Contract_Signer: Contract_Signer,
    Contract_Friendly: Contract_Friendly,
    Contract_Legal: Contract_Legal,
    Contract_Rule: Contract_Rule,
    Coverage_Class: Coverage_Class,
    Coverage_CostToBeneficiary: Coverage_CostToBeneficiary,
    Coverage_Exception: Coverage_Exception,
    CoverageEligibilityRequest_SupportingInfo: CoverageEligibilityRequest_SupportingInfo,
    CoverageEligibilityRequest_Insurance: CoverageEligibilityRequest_Insurance,
    CoverageEligibilityRequest_Item: CoverageEligibilityRequest_Item,
    CoverageEligibilityRequest_Diagnosis: CoverageEligibilityRequest_Diagnosis,
    CoverageEligibilityResponse_Insurance: CoverageEligibilityResponse_Insurance,
    CoverageEligibilityResponse_Item: CoverageEligibilityResponse_Item,
    CoverageEligibilityResponse_Benefit: CoverageEligibilityResponse_Benefit,
    CoverageEligibilityResponse_Error: CoverageEligibilityResponse_Error,
    DetectedIssue_Evidence: DetectedIssue_Evidence,
    DetectedIssue_Mitigation: DetectedIssue_Mitigation,
    Device_UdiCarrier: Device_UdiCarrier,
    Device_DeviceName: Device_DeviceName,
    Device_Specialization: Device_Specialization,
    Device_Version: Device_Version,
    Device_Property: Device_Property,
    DeviceDefinition_UdiDeviceIdentifier: DeviceDefinition_UdiDeviceIdentifier,
    DeviceDefinition_DeviceName: DeviceDefinition_DeviceName,
    DeviceDefinition_Specialization: DeviceDefinition_Specialization,
    DeviceDefinition_Capability: DeviceDefinition_Capability,
    DeviceDefinition_Property: DeviceDefinition_Property,
    DeviceDefinition_Material: DeviceDefinition_Material,
    DeviceMetric_Calibration: DeviceMetric_Calibration,
    DeviceRequest_Parameter: DeviceRequest_Parameter,
    DiagnosticReport_Media: DiagnosticReport_Media,
    DocumentManifest_Related: DocumentManifest_Related,
    DocumentReference_RelatesTo: DocumentReference_RelatesTo,
    DocumentReference_Content: DocumentReference_Content,
    DocumentReference_Context: DocumentReference_Context,
    EffectEvidenceSynthesis_SampleSize: EffectEvidenceSynthesis_SampleSize,
    EffectEvidenceSynthesis_ResultsByExposure: EffectEvidenceSynthesis_ResultsByExposure,
    EffectEvidenceSynthesis_EffectEstimate: EffectEvidenceSynthesis_EffectEstimate,
    EffectEvidenceSynthesis_PrecisionEstimate: EffectEvidenceSynthesis_PrecisionEstimate,
    EffectEvidenceSynthesis_Certainty: EffectEvidenceSynthesis_Certainty,
    EffectEvidenceSynthesis_CertaintySubcomponent: EffectEvidenceSynthesis_CertaintySubcomponent,
    Encounter_StatusHistory: Encounter_StatusHistory,
    Encounter_ClassHistory: Encounter_ClassHistory,
    Encounter_Participant: Encounter_Participant,
    Encounter_Diagnosis: Encounter_Diagnosis,
    Encounter_Hospitalization: Encounter_Hospitalization,
    Encounter_Location: Encounter_Location,
    EpisodeOfCare_StatusHistory: EpisodeOfCare_StatusHistory,
    EpisodeOfCare_Diagnosis: EpisodeOfCare_Diagnosis,
    EvidenceVariable_Characteristic: EvidenceVariable_Characteristic,
    ExampleScenario_Actor: ExampleScenario_Actor,
    ExampleScenario_Instance: ExampleScenario_Instance,
    ExampleScenario_Version: ExampleScenario_Version,
    ExampleScenario_ContainedInstance: ExampleScenario_ContainedInstance,
    ExampleScenario_Process: ExampleScenario_Process,
    ExampleScenario_Step: ExampleScenario_Step,
    ExampleScenario_Operation: ExampleScenario_Operation,
    ExampleScenario_Alternative: ExampleScenario_Alternative,
    ExplanationOfBenefit_Related: ExplanationOfBenefit_Related,
    ExplanationOfBenefit_Payee: ExplanationOfBenefit_Payee,
    ExplanationOfBenefit_CareTeam: ExplanationOfBenefit_CareTeam,
    ExplanationOfBenefit_SupportingInfo: ExplanationOfBenefit_SupportingInfo,
    ExplanationOfBenefit_Diagnosis: ExplanationOfBenefit_Diagnosis,
    ExplanationOfBenefit_Procedure: ExplanationOfBenefit_Procedure,
    ExplanationOfBenefit_Insurance: ExplanationOfBenefit_Insurance,
    ExplanationOfBenefit_Accident: ExplanationOfBenefit_Accident,
    ExplanationOfBenefit_Item: ExplanationOfBenefit_Item,
    ExplanationOfBenefit_Adjudication: ExplanationOfBenefit_Adjudication,
    ExplanationOfBenefit_Detail: ExplanationOfBenefit_Detail,
    ExplanationOfBenefit_SubDetail: ExplanationOfBenefit_SubDetail,
    ExplanationOfBenefit_AddItem: ExplanationOfBenefit_AddItem,
    ExplanationOfBenefit_Detail1: ExplanationOfBenefit_Detail1,
    ExplanationOfBenefit_SubDetail1: ExplanationOfBenefit_SubDetail1,
    ExplanationOfBenefit_Total: ExplanationOfBenefit_Total,
    ExplanationOfBenefit_Payment: ExplanationOfBenefit_Payment,
    ExplanationOfBenefit_ProcessNote: ExplanationOfBenefit_ProcessNote,
    ExplanationOfBenefit_BenefitBalance: ExplanationOfBenefit_BenefitBalance,
    ExplanationOfBenefit_Financial: ExplanationOfBenefit_Financial,
    FamilyMemberHistory_Condition: FamilyMemberHistory_Condition,
    Goal_Target: Goal_Target,
    GraphDefinition_Link: GraphDefinition_Link,
    GraphDefinition_Target: GraphDefinition_Target,
    GraphDefinition_Compartment: GraphDefinition_Compartment,
    Group_Characteristic: Group_Characteristic,
    Group_Member: Group_Member,
    HealthcareService_Eligibility: HealthcareService_Eligibility,
    HealthcareService_AvailableTime: HealthcareService_AvailableTime,
    HealthcareService_NotAvailable: HealthcareService_NotAvailable,
    ImagingStudy_Series: ImagingStudy_Series,
    ImagingStudy_Performer: ImagingStudy_Performer,
    ImagingStudy_Instance: ImagingStudy_Instance,
    Immunization_Performer: Immunization_Performer,
    Immunization_Education: Immunization_Education,
    Immunization_Reaction: Immunization_Reaction,
    Immunization_ProtocolApplied: Immunization_ProtocolApplied,
    ImmunizationRecommendation_Recommendation: ImmunizationRecommendation_Recommendation,
    ImmunizationRecommendation_DateCriterion: ImmunizationRecommendation_DateCriterion,
    ImplementationGuide_DependsOn: ImplementationGuide_DependsOn,
    ImplementationGuide_Global: ImplementationGuide_Global,
    ImplementationGuide_Definition: ImplementationGuide_Definition,
    ImplementationGuide_Grouping: ImplementationGuide_Grouping,
    ImplementationGuide_Resource: ImplementationGuide_Resource,
    ImplementationGuide_Page: ImplementationGuide_Page,
    ImplementationGuide_Parameter: ImplementationGuide_Parameter,
    ImplementationGuide_Template: ImplementationGuide_Template,
    ImplementationGuide_Manifest: ImplementationGuide_Manifest,
    ImplementationGuide_Resource1: ImplementationGuide_Resource1,
    ImplementationGuide_Page1: ImplementationGuide_Page1,
    InsurancePlan_Contact: InsurancePlan_Contact,
    InsurancePlan_Coverage: InsurancePlan_Coverage,
    InsurancePlan_Benefit: InsurancePlan_Benefit,
    InsurancePlan_Limit: InsurancePlan_Limit,
    InsurancePlan_Plan: InsurancePlan_Plan,
    InsurancePlan_GeneralCost: InsurancePlan_GeneralCost,
    InsurancePlan_SpecificCost: InsurancePlan_SpecificCost,
    InsurancePlan_Benefit1: InsurancePlan_Benefit1,
    InsurancePlan_Cost: InsurancePlan_Cost,
    Invoice_Participant: Invoice_Participant,
    Invoice_LineItem: Invoice_LineItem,
    Invoice_PriceComponent: Invoice_PriceComponent,
    Linkage_Item: Linkage_Item,
    List_Entry: List_Entry,
    Location_Position: Location_Position,
    Location_HoursOfOperation: Location_HoursOfOperation,
    Measure_Group: Measure_Group,
    Measure_Population: Measure_Population,
    Measure_Stratifier: Measure_Stratifier,
    Measure_Component: Measure_Component,
    Measure_SupplementalData: Measure_SupplementalData,
    MeasureReport_Group: MeasureReport_Group,
    MeasureReport_Population: MeasureReport_Population,
    MeasureReport_Stratifier: MeasureReport_Stratifier,
    MeasureReport_Stratum: MeasureReport_Stratum,
    MeasureReport_Component: MeasureReport_Component,
    MeasureReport_Population1: MeasureReport_Population1,
    Medication_Ingredient: Medication_Ingredient,
    Medication_Batch: Medication_Batch,
    MedicationAdministration_Performer: MedicationAdministration_Performer,
    MedicationAdministration_Dosage: MedicationAdministration_Dosage,
    MedicationDispense_Performer: MedicationDispense_Performer,
    MedicationDispense_Substitution: MedicationDispense_Substitution,
    MedicationKnowledge_RelatedMedicationKnowledge: MedicationKnowledge_RelatedMedicationKnowledge,
    MedicationKnowledge_Monograph: MedicationKnowledge_Monograph,
    MedicationKnowledge_Ingredient: MedicationKnowledge_Ingredient,
    MedicationKnowledge_Cost: MedicationKnowledge_Cost,
    MedicationKnowledge_MonitoringProgram: MedicationKnowledge_MonitoringProgram,
    MedicationKnowledge_AdministrationGuidelines: MedicationKnowledge_AdministrationGuidelines,
    MedicationKnowledge_Dosage: MedicationKnowledge_Dosage,
    MedicationKnowledge_PatientCharacteristics: MedicationKnowledge_PatientCharacteristics,
    MedicationKnowledge_MedicineClassification: MedicationKnowledge_MedicineClassification,
    MedicationKnowledge_Packaging: MedicationKnowledge_Packaging,
    MedicationKnowledge_DrugCharacteristic: MedicationKnowledge_DrugCharacteristic,
    MedicationKnowledge_Regulatory: MedicationKnowledge_Regulatory,
    MedicationKnowledge_Substitution: MedicationKnowledge_Substitution,
    MedicationKnowledge_Schedule: MedicationKnowledge_Schedule,
    MedicationKnowledge_MaxDispense: MedicationKnowledge_MaxDispense,
    MedicationKnowledge_Kinetics: MedicationKnowledge_Kinetics,
    MedicationRequest_DispenseRequest: MedicationRequest_DispenseRequest,
    MedicationRequest_InitialFill: MedicationRequest_InitialFill,
    MedicationRequest_Substitution: MedicationRequest_Substitution,
    MedicinalProduct_Name: MedicinalProduct_Name,
    MedicinalProduct_NamePart: MedicinalProduct_NamePart,
    MedicinalProduct_CountryLanguage: MedicinalProduct_CountryLanguage,
    MedicinalProduct_ManufacturingBusinessOperation: MedicinalProduct_ManufacturingBusinessOperation,
    MedicinalProduct_SpecialDesignation: MedicinalProduct_SpecialDesignation,
    MedicinalProductAuthorization_JurisdictionalAuthorization: MedicinalProductAuthorization_JurisdictionalAuthorization,
    MedicinalProductAuthorization_Procedure: MedicinalProductAuthorization_Procedure,
    MedicinalProductContraindication_OtherTherapy: MedicinalProductContraindication_OtherTherapy,
    MedicinalProductIndication_OtherTherapy: MedicinalProductIndication_OtherTherapy,
    MedicinalProductIngredient_SpecifiedSubstance: MedicinalProductIngredient_SpecifiedSubstance,
    MedicinalProductIngredient_Strength: MedicinalProductIngredient_Strength,
    MedicinalProductIngredient_ReferenceStrength: MedicinalProductIngredient_ReferenceStrength,
    MedicinalProductIngredient_Substance: MedicinalProductIngredient_Substance,
    MedicinalProductInteraction_Interactant: MedicinalProductInteraction_Interactant,
    MedicinalProductPackaged_BatchIdentifier: MedicinalProductPackaged_BatchIdentifier,
    MedicinalProductPackaged_PackageItem: MedicinalProductPackaged_PackageItem,
    MedicinalProductPharmaceutical_Characteristics: MedicinalProductPharmaceutical_Characteristics,
    MedicinalProductPharmaceutical_RouteOfAdministration: MedicinalProductPharmaceutical_RouteOfAdministration,
    MedicinalProductPharmaceutical_TargetSpecies: MedicinalProductPharmaceutical_TargetSpecies,
    MedicinalProductPharmaceutical_WithdrawalPeriod: MedicinalProductPharmaceutical_WithdrawalPeriod,
    MessageDefinition_Focus: MessageDefinition_Focus,
    MessageDefinition_AllowedResponse: MessageDefinition_AllowedResponse,
    MessageHeader_Destination: MessageHeader_Destination,
    MessageHeader_Source: MessageHeader_Source,
    MessageHeader_Response: MessageHeader_Response,
    MolecularSequence_ReferenceSeq: MolecularSequence_ReferenceSeq,
    MolecularSequence_Variant: MolecularSequence_Variant,
    MolecularSequence_Quality: MolecularSequence_Quality,
    MolecularSequence_Roc: MolecularSequence_Roc,
    MolecularSequence_Repository: MolecularSequence_Repository,
    MolecularSequence_StructureVariant: MolecularSequence_StructureVariant,
    MolecularSequence_Outer: MolecularSequence_Outer,
    MolecularSequence_Inner: MolecularSequence_Inner,
    NamingSystem_UniqueId: NamingSystem_UniqueId,
    NutritionOrder_OralDiet: NutritionOrder_OralDiet,
    NutritionOrder_Nutrient: NutritionOrder_Nutrient,
    NutritionOrder_Texture: NutritionOrder_Texture,
    NutritionOrder_Supplement: NutritionOrder_Supplement,
    NutritionOrder_EnteralFormula: NutritionOrder_EnteralFormula,
    NutritionOrder_Administration: NutritionOrder_Administration,
    Observation_ReferenceRange: Observation_ReferenceRange,
    Observation_Component: Observation_Component,
    ObservationDefinition_QuantitativeDetails: ObservationDefinition_QuantitativeDetails,
    ObservationDefinition_QualifiedInterval: ObservationDefinition_QualifiedInterval,
    OperationDefinition_Parameter: OperationDefinition_Parameter,
    OperationDefinition_Binding: OperationDefinition_Binding,
    OperationDefinition_ReferencedFrom: OperationDefinition_ReferencedFrom,
    OperationDefinition_Overload: OperationDefinition_Overload,
    OperationOutcome_Issue: OperationOutcome_Issue,
    Organization_Contact: Organization_Contact,
    Parameters_Parameter: Parameters_Parameter,
    Patient_Contact: Patient_Contact,
    Patient_Communication: Patient_Communication,
    Patient_Link: Patient_Link,
    PaymentReconciliation_Detail: PaymentReconciliation_Detail,
    PaymentReconciliation_ProcessNote: PaymentReconciliation_ProcessNote,
    Person_Link: Person_Link,
    PlanDefinition_Goal: PlanDefinition_Goal,
    PlanDefinition_Target: PlanDefinition_Target,
    PlanDefinition_Action: PlanDefinition_Action,
    PlanDefinition_Condition: PlanDefinition_Condition,
    PlanDefinition_RelatedAction: PlanDefinition_RelatedAction,
    PlanDefinition_Participant: PlanDefinition_Participant,
    PlanDefinition_DynamicValue: PlanDefinition_DynamicValue,
    Practitioner_Qualification: Practitioner_Qualification,
    PractitionerRole_AvailableTime: PractitionerRole_AvailableTime,
    PractitionerRole_NotAvailable: PractitionerRole_NotAvailable,
    Procedure_Performer: Procedure_Performer,
    Procedure_FocalDevice: Procedure_FocalDevice,
    Provenance_Agent: Provenance_Agent,
    Provenance_Entity: Provenance_Entity,
    Questionnaire_Item: Questionnaire_Item,
    Questionnaire_EnableWhen: Questionnaire_EnableWhen,
    Questionnaire_AnswerOption: Questionnaire_AnswerOption,
    Questionnaire_Initial: Questionnaire_Initial,
    QuestionnaireResponse_Item: QuestionnaireResponse_Item,
    QuestionnaireResponse_Answer: QuestionnaireResponse_Answer,
    RelatedPerson_Communication: RelatedPerson_Communication,
    RequestGroup_Action: RequestGroup_Action,
    RequestGroup_Condition: RequestGroup_Condition,
    RequestGroup_RelatedAction: RequestGroup_RelatedAction,
    ResearchElementDefinition_Characteristic: ResearchElementDefinition_Characteristic,
    ResearchStudy_Arm: ResearchStudy_Arm,
    ResearchStudy_Objective: ResearchStudy_Objective,
    RiskAssessment_Prediction: RiskAssessment_Prediction,
    RiskEvidenceSynthesis_SampleSize: RiskEvidenceSynthesis_SampleSize,
    RiskEvidenceSynthesis_RiskEstimate: RiskEvidenceSynthesis_RiskEstimate,
    RiskEvidenceSynthesis_PrecisionEstimate: RiskEvidenceSynthesis_PrecisionEstimate,
    RiskEvidenceSynthesis_Certainty: RiskEvidenceSynthesis_Certainty,
    RiskEvidenceSynthesis_CertaintySubcomponent: RiskEvidenceSynthesis_CertaintySubcomponent,
    SearchParameter_Component: SearchParameter_Component,
    Specimen_Collection: Specimen_Collection,
    Specimen_Processing: Specimen_Processing,
    Specimen_Container: Specimen_Container,
    SpecimenDefinition_TypeTested: SpecimenDefinition_TypeTested,
    SpecimenDefinition_Container: SpecimenDefinition_Container,
    SpecimenDefinition_Additive: SpecimenDefinition_Additive,
    SpecimenDefinition_Handling: SpecimenDefinition_Handling,
    StructureDefinition_Mapping: StructureDefinition_Mapping,
    StructureDefinition_Context: StructureDefinition_Context,
    StructureDefinition_Snapshot: StructureDefinition_Snapshot,
    StructureDefinition_Differential: StructureDefinition_Differential,
    StructureMap_Structure: StructureMap_Structure,
    StructureMap_Group: StructureMap_Group,
    StructureMap_Input: StructureMap_Input,
    StructureMap_Rule: StructureMap_Rule,
    StructureMap_Source: StructureMap_Source,
    StructureMap_Target: StructureMap_Target,
    StructureMap_Parameter: StructureMap_Parameter,
    StructureMap_Dependent: StructureMap_Dependent,
    Subscription_Channel: Subscription_Channel,
    Substance_Instance: Substance_Instance,
    Substance_Ingredient: Substance_Ingredient,
    SubstanceNucleicAcid_Subunit: SubstanceNucleicAcid_Subunit,
    SubstanceNucleicAcid_Linkage: SubstanceNucleicAcid_Linkage,
    SubstanceNucleicAcid_Sugar: SubstanceNucleicAcid_Sugar,
    SubstancePolymer_MonomerSet: SubstancePolymer_MonomerSet,
    SubstancePolymer_StartingMaterial: SubstancePolymer_StartingMaterial,
    SubstancePolymer_Repeat: SubstancePolymer_Repeat,
    SubstancePolymer_RepeatUnit: SubstancePolymer_RepeatUnit,
    SubstancePolymer_DegreeOfPolymerisation: SubstancePolymer_DegreeOfPolymerisation,
    SubstancePolymer_StructuralRepresentation: SubstancePolymer_StructuralRepresentation,
    SubstanceProtein_Subunit: SubstanceProtein_Subunit,
    SubstanceReferenceInformation_Gene: SubstanceReferenceInformation_Gene,
    SubstanceReferenceInformation_GeneElement: SubstanceReferenceInformation_GeneElement,
    SubstanceReferenceInformation_Classification: SubstanceReferenceInformation_Classification,
    SubstanceReferenceInformation_Target: SubstanceReferenceInformation_Target,
    SubstanceSourceMaterial_FractionDescription: SubstanceSourceMaterial_FractionDescription,
    SubstanceSourceMaterial_Organism: SubstanceSourceMaterial_Organism,
    SubstanceSourceMaterial_Author: SubstanceSourceMaterial_Author,
    SubstanceSourceMaterial_Hybrid: SubstanceSourceMaterial_Hybrid,
    SubstanceSourceMaterial_OrganismGeneral: SubstanceSourceMaterial_OrganismGeneral,
    SubstanceSourceMaterial_PartDescription: SubstanceSourceMaterial_PartDescription,
    SubstanceSpecification_Moiety: SubstanceSpecification_Moiety,
    SubstanceSpecification_Property: SubstanceSpecification_Property,
    SubstanceSpecification_Structure: SubstanceSpecification_Structure,
    SubstanceSpecification_Isotope: SubstanceSpecification_Isotope,
    SubstanceSpecification_MolecularWeight: SubstanceSpecification_MolecularWeight,
    SubstanceSpecification_Representation: SubstanceSpecification_Representation,
    SubstanceSpecification_Code: SubstanceSpecification_Code,
    SubstanceSpecification_Name: SubstanceSpecification_Name,
    SubstanceSpecification_Official: SubstanceSpecification_Official,
    SubstanceSpecification_Relationship: SubstanceSpecification_Relationship,
    SupplyDelivery_SuppliedItem: SupplyDelivery_SuppliedItem,
    SupplyRequest_Parameter: SupplyRequest_Parameter,
    Task_Restriction: Task_Restriction,
    Task_Input: Task_Input,
    Task_Output: Task_Output,
    TerminologyCapabilities_Software: TerminologyCapabilities_Software,
    TerminologyCapabilities_Implementation: TerminologyCapabilities_Implementation,
    TerminologyCapabilities_CodeSystem: TerminologyCapabilities_CodeSystem,
    TerminologyCapabilities_Version: TerminologyCapabilities_Version,
    TerminologyCapabilities_Filter: TerminologyCapabilities_Filter,
    TerminologyCapabilities_Expansion: TerminologyCapabilities_Expansion,
    TerminologyCapabilities_Parameter: TerminologyCapabilities_Parameter,
    TerminologyCapabilities_ValidateCode: TerminologyCapabilities_ValidateCode,
    TerminologyCapabilities_Translation: TerminologyCapabilities_Translation,
    TerminologyCapabilities_Closure: TerminologyCapabilities_Closure,
    TestReport_Participant: TestReport_Participant,
    TestReport_Setup: TestReport_Setup,
    TestReport_Action: TestReport_Action,
    TestReport_Operation: TestReport_Operation,
    TestReport_Assert: TestReport_Assert,
    TestReport_Test: TestReport_Test,
    TestReport_Action1: TestReport_Action1,
    TestReport_Teardown: TestReport_Teardown,
    TestReport_Action2: TestReport_Action2,
    TestScript_Origin: TestScript_Origin,
    TestScript_Destination: TestScript_Destination,
    TestScript_Metadata: TestScript_Metadata,
    TestScript_Link: TestScript_Link,
    TestScript_Capability: TestScript_Capability,
    TestScript_Fixture: TestScript_Fixture,
    TestScript_Variable: TestScript_Variable,
    TestScript_Setup: TestScript_Setup,
    TestScript_Action: TestScript_Action,
    TestScript_Operation: TestScript_Operation,
    TestScript_RequestHeader: TestScript_RequestHeader,
    TestScript_Assert: TestScript_Assert,
    TestScript_Test: TestScript_Test,
    TestScript_Action1: TestScript_Action1,
    TestScript_Teardown: TestScript_Teardown,
    TestScript_Action2: TestScript_Action2,
    ValueSet_Compose: ValueSet_Compose,
    ValueSet_Include: ValueSet_Include,
    ValueSet_Concept: ValueSet_Concept,
    ValueSet_Designation: ValueSet_Designation,
    ValueSet_Filter: ValueSet_Filter,
    ValueSet_Expansion: ValueSet_Expansion,
    ValueSet_Parameter: ValueSet_Parameter,
    ValueSet_Contains: ValueSet_Contains,
    VerificationResult_PrimarySource: VerificationResult_PrimarySource,
    VerificationResult_Attestation: VerificationResult_Attestation,
    VerificationResult_Validator: VerificationResult_Validator,
    VisionPrescription_LensSpecification: VisionPrescription_LensSpecification,
    VisionPrescription_Prism: VisionPrescription_Prism
};