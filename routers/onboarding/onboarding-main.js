const express = require("express");
const mongoose = require("mongoose");
const OnboardingApplication = require("../../database/Models/OnboardingApplication");
const EmploymentApplication = require("../../database/Models/EmploymentApplication");
const I9Form = require("../../database/Models/I9Form");
const W4Form = require("../../database/Models/W4Form");
const W9Form = require("../../database/Models/W9Form");
const EmergencyContact = require("../../database/Models/EmergencyContact");
const DirectDeposit = require("../../database/Models/DirectDeposit");
const MisconductStatement = require("../../database/Models/MisconductStatement");
const CodeOfEthics = require("../../database/Models/CodeOfEthics");
const ServiceDeliveryPolicy = require("../../database/Models/ServiceDeliveryPolicy");
const NonCompeteAgreement = require("../../database/Models/NonCompeteAgreement");
const BackgroundCheck = require("../../database/Models/BackgroundCheck");
const TBSymptomScreen = require("../../database/Models/TBSymptomScreen");
const OrientationChecklist = require("../../database/Models/OrientationChecklist");
const JobDescriptionAcknowledgment = require("../../database/Models/JobDescriptionAcknowledgment");
const User = require("../../database/Models/Users");

const router = express.Router();

// Helper function to map schema enum values back to frontend format for W4
function mapFilingStatusToFrontend(status) {
  const mapping = {
    'single_or_married_filing_separately': 'single',
    'married_filing_jointly_or_qualifying_surviving_spouse': 'married',
    'head_of_household': 'headOfHousehold'
  };
  return mapping[status] || status;
}

// Helper function to map schema enum values back to frontend format for W9
function mapTaxClassificationToFrontend(classification) {
  const mapping = {
    'individual_sole_proprietor': 'individual',
    'c_corporation': 'c-corporation',
    's_corporation': 's-corporation',
    'partnership': 'partnership',
    'trust_estate': 'trust-estate',
    'llc': 'llc',
    'other': 'other'
  };
  return mapping[classification] || classification;
}

// Helper function to map schema enum values back to frontend format for I9
function mapCitizenshipStatusToFrontend(status) {
  const mapping = {
    'us_citizen': 'citizen',
    'non_citizen_national': 'national',
    'lawful_permanent_resident': 'alien',
    'authorized_alien': 'authorized'
  };
  return mapping[status] || status;
}

// Get or create onboarding application
router.get("/get-application/:employeeId", async (req, res) => {
  try {
    const { employeeId } = req.params;

    // Check if employee exists - handle both ObjectId and email
    let employee;
    try {
      // First try to find by ObjectId
      if (mongoose.Types.ObjectId.isValid(employeeId)) {
        employee = await User.findById(employeeId);
      }
      
      // If not found or not a valid ObjectId, try to find by email
      if (!employee) {
        employee = await User.findOne({ email: employeeId });
      }
      
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
    } catch (error) {
      console.error("Error finding employee:", error);
      return res.status(500).json({ message: "Error finding employee", error: error.message });
    }

    // Use the actual employee ObjectId for the application lookup
    const actualEmployeeId = employee._id;

    // Find existing application or create new one
    let application = await OnboardingApplication.findOne({ employeeId: actualEmployeeId });
    
    if (!application) {
      application = new OnboardingApplication({
        employeeId: actualEmployeeId,
        applicationStatus: "draft",
        completionPercentage: 0,
        formsCompleted: []
      });
      await application.save();
    }

    // Get all related forms
    const [
      employmentApp,
      i9Form,
      w4Form,
      w9Form,
      emergencyContact,
      directDeposit,
      misconductStatement,
      codeOfEthics,
      serviceDeliveryPolicy,
      nonCompeteAgreement,
      backgroundCheck,
      tbSymptomScreen,
      orientationChecklist,
      jobDescriptionPCA,
      jobDescriptionCNA,
      jobDescriptionLPN,
      jobDescriptionRN
    ] = await Promise.all([
      EmploymentApplication.findOne({ applicationId: application._id }),
      I9Form.findOne({ applicationId: application._id }),
      W4Form.findOne({ applicationId: application._id }),
      W9Form.findOne({ applicationId: application._id }),
      EmergencyContact.findOne({ applicationId: application._id }),
      DirectDeposit.findOne({ applicationId: application._id }),
      MisconductStatement.findOne({ applicationId: application._id }),
      CodeOfEthics.findOne({ applicationId: application._id }),
      ServiceDeliveryPolicy.findOne({ applicationId: application._id }),
      NonCompeteAgreement.findOne({ applicationId: application._id }),
      BackgroundCheck.findOne({ applicationId: application._id }),
      TBSymptomScreen.findOne({ applicationId: application._id }),
      OrientationChecklist.findOne({ applicationId: application._id }),
      JobDescriptionAcknowledgment.findOne({ applicationId: application._id, jobDescriptionType: "PCA" }),
      JobDescriptionAcknowledgment.findOne({ applicationId: application._id, jobDescriptionType: "CNA" }),
      JobDescriptionAcknowledgment.findOne({ applicationId: application._id, jobDescriptionType: "LPN" }),
      JobDescriptionAcknowledgment.findOne({ applicationId: application._id, jobDescriptionType: "RN" })
    ]);

    // Transform I9 form from nested to flat structure for frontend compatibility
    let i9FormFlattened = null;
    if (i9Form) {
      i9FormFlattened = {
        _id: i9Form._id,
        applicationId: i9Form.applicationId,
        employeeId: i9Form.employeeId,
        // Section 1 fields (flattened from section1)
        lastName: i9Form.section1?.lastName || "",
        firstName: i9Form.section1?.firstName || "",
        middleInitial: i9Form.section1?.middleInitial || "",
        otherLastNames: i9Form.section1?.otherLastNames || "",
        address: i9Form.section1?.address || "",
        aptNumber: i9Form.section1?.aptNumber || "",
        cityOrTown: i9Form.section1?.cityOrTown || "",
        state: i9Form.section1?.state || "",
        zipCode: i9Form.section1?.zipCode || "",
        dateOfBirth: i9Form.section1?.dateOfBirth || "",
        socialSecurityNumber: i9Form.section1?.socialSecurityNumber || "",
        employeeEmail: i9Form.section1?.employeeEmail || "",
        employeePhone: i9Form.section1?.employeePhone || "",
        citizenshipStatus: mapCitizenshipStatusToFrontend(i9Form.section1?.citizenshipStatus) || "",
        uscisNumber: i9Form.section1?.uscisNumber || "",
        formI94Number: i9Form.section1?.formI94Number || "",
        foreignPassportNumber: i9Form.section1?.foreignPassportNumber || "",
        countryOfIssuance: i9Form.section1?.countryOfIssuance || "",
        expirationDate: i9Form.section1?.expirationDate || "",
        employeeSignature: i9Form.section1?.employeeSignature || "",
        employeeSignatureDate: i9Form.section1?.employeeSignatureDate || "",
        // Preparer/Translator fields (flattened from section1.preparerTranslator)
        preparerUsed: i9Form.section1?.preparerTranslator?.preparerUsed || false,
        preparerLastName: i9Form.section1?.preparerTranslator?.preparerLastName || "",
        preparerFirstName: i9Form.section1?.preparerTranslator?.preparerFirstName || "",
        preparerAddress: i9Form.section1?.preparerTranslator?.preparerAddress || "",
        preparerSignature: i9Form.section1?.preparerTranslator?.preparerSignature || "",
        preparerDate: i9Form.section1?.preparerTranslator?.preparerDate || "",
        // Section 2 fields (flattened from section2)
        employmentStartDate: i9Form.section2?.employmentStartDate || "",
        documentTitle1: i9Form.section2?.documentTitle1 || "",
        issuingAuthority1: i9Form.section2?.issuingAuthority1 || "",
        documentNumber1: i9Form.section2?.documentNumber1 || "",
        expirationDate1: i9Form.section2?.expirationDate1 || "",
        documentTitle2: i9Form.section2?.documentTitle2 || "",
        issuingAuthority2: i9Form.section2?.issuingAuthority2 || "",
        documentNumber2: i9Form.section2?.documentNumber2 || "",
        expirationDate2: i9Form.section2?.expirationDate2 || "",
        documentTitle3: i9Form.section2?.documentTitle3 || "",
        issuingAuthority3: i9Form.section2?.issuingAuthority3 || "",
        documentNumber3: i9Form.section2?.documentNumber3 || "",
        expirationDate3: i9Form.section2?.expirationDate3 || "",
        additionalInfo: i9Form.section2?.additionalInfo || "",
        employerSignature: i9Form.section2?.employerSignature || "",
        employerSignatureDate: i9Form.section2?.employerSignatureDate || "",
        employerName: i9Form.section2?.employerName || "",
        employerTitle: i9Form.section2?.employerTitle || "",
        employerBusinessName: i9Form.section2?.employerBusinessName || "",
        employerBusinessAddress: i9Form.section2?.employerBusinessAddress || "",
        // Metadata
        status: i9Form.status,
        createdAt: i9Form.createdAt,
        updatedAt: i9Form.updatedAt
      };
    }

    // Transform W4 form from nested to flat structure for frontend compatibility
    let w4FormFlattened = null;
    if (w4Form) {
      w4FormFlattened = {
        _id: w4Form._id,
        applicationId: w4Form.applicationId,
        employeeId: w4Form.employeeId,
        // Personal Information (Step 1)
        firstName: w4Form.personalInfo?.firstName || "",
        middleInitial: w4Form.personalInfo?.middleInitial || "",
        lastName: w4Form.personalInfo?.lastName || "",
        address: w4Form.personalInfo?.address || "",
        cityStateZip: w4Form.personalInfo?.cityStateZip || "",
        socialSecurityNumber: w4Form.personalInfo?.socialSecurityNumber || "",
        filingStatus: mapFilingStatusToFrontend(w4Form.personalInfo?.filingStatus) || "",
        // Multiple Jobs Option (Step 2)
        multipleJobsOption: w4Form.multipleJobsOption || "",
        // Dependents (Step 3)
        qualifyingChildren: w4Form.dependents?.qualifyingChildren || "",
        otherDependents: w4Form.dependents?.otherDependents || "",
        totalCredits: w4Form.dependents?.totalCredits || "",
        // Other Adjustments (Step 4)
        otherIncome: w4Form.otherAdjustments?.otherIncome || "",
        deductions: w4Form.otherAdjustments?.deductions || "",
        extraWithholding: w4Form.otherAdjustments?.extraWithholding || "",
        // Employee Signature (Step 5)
        employeeSignature: w4Form.employeeSignature || "",
        signatureDate: w4Form.signatureDate || "",
        exempt: w4Form.exempt || false,
        // Employer Information
        employerName: w4Form.employerInfo?.employerName || "",
        employerAddress: w4Form.employerInfo?.employerAddress || "",
        firstDateOfEmployment: w4Form.employerInfo?.firstDateOfEmployment || "",
        employerEIN: w4Form.employerInfo?.employerEIN || "",
        // Metadata
        createdAt: w4Form.createdAt,
        updatedAt: w4Form.updatedAt,
        status: w4Form.status
      };
    }

    // Transform W9 form for frontend compatibility
    let w9FormFlattened = null;
    if (w9Form) {
      w9FormFlattened = {
        ...w9Form.toObject(),
        taxClassification: mapTaxClassificationToFrontend(w9Form.taxClassification)
      };
    }

    // Transform Misconduct Statement from nested to flat structure for frontend compatibility
    let misconductStatementFlattened = null;
    if (misconductStatement) {
      misconductStatementFlattened = {
        _id: misconductStatement._id,
        applicationId: misconductStatement.applicationId,
        employeeId: misconductStatement.employeeId,
        // Staff Information (flattened from staffInfo)
        staffTitle: misconductStatement.staffInfo?.staffTitle || '',
        employeeName: misconductStatement.staffInfo?.employeeName || '',
        employmentPosition: misconductStatement.staffInfo?.employmentPosition || '',
        // Acknowledgment fields
        understandsCodeOfConduct: misconductStatement.acknowledgment?.understandsCodeOfConduct || false,
        noMisconductHistory: misconductStatement.acknowledgment?.noMisconductHistory || false,
        formReadAndUnderstood: misconductStatement.acknowledgment?.formReadAndUnderstood || false,
        // Employee signature (flattened from employeeSignature)
        signature: misconductStatement.employeeSignature?.signature || '',
        date: misconductStatement.employeeSignature?.date || null,
        // Verifier/Witness (flattened from verifier)
        witnessName: misconductStatement.verifier?.printedName || '',
        witnessSignature: misconductStatement.verifier?.signature || '',
        witnessDate: misconductStatement.verifier?.date || null,
        witnessStatement: misconductStatement.verifier?.statement || '',
        // Notary information (flattened from notaryInfo)
        notaryDate: misconductStatement.notaryInfo?.day?.toString() || '',
        notaryMonth: misconductStatement.notaryInfo?.month || '',
        notaryYear: misconductStatement.notaryInfo?.year?.toString() || '',
        notarySignature: misconductStatement.notaryInfo?.notarySignature || '',
        notarySeal: misconductStatement.notaryInfo?.notarySeal || '',
        // Metadata
        createdAt: misconductStatement.createdAt,
        updatedAt: misconductStatement.updatedAt,
        status: misconductStatement.status
      };
    }

    // Transform Code of Ethics data for frontend compatibility
    let codeOfEthicsFlattened = codeOfEthics;
    if (codeOfEthics) {
      codeOfEthicsFlattened = {
        ...codeOfEthics.toObject(),
        signature: codeOfEthics.employeeSignature || '',
        date: codeOfEthics.signatureDate || null
      };
    }

    // Transform Service Delivery Policy data for frontend compatibility
    let serviceDeliveryPolicyFlattened = serviceDeliveryPolicy;
    if (serviceDeliveryPolicy) {
      serviceDeliveryPolicyFlattened = {
        ...serviceDeliveryPolicy.toObject(),
        employeeDate: serviceDeliveryPolicy.employeeSignatureDate || null,
        agencySignature: serviceDeliveryPolicy.supervisorSignature || '',
        agencyDate: serviceDeliveryPolicy.supervisorSignatureDate || null
      };
    }

    // Transform Non-Compete Agreement data for frontend compatibility
    let nonCompeteAgreementFlattened = nonCompeteAgreement;
    if (nonCompeteAgreement) {
      nonCompeteAgreementFlattened = {
        ...nonCompeteAgreement.toObject(),
        // Map effective date back to frontend fields
        agreementDate: nonCompeteAgreement.effectiveDate?.day && nonCompeteAgreement.effectiveDate?.month && nonCompeteAgreement.effectiveDate?.year 
          ? new Date(nonCompeteAgreement.effectiveDate.year, 
                     ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'].indexOf(nonCompeteAgreement.effectiveDate.month),
                     nonCompeteAgreement.effectiveDate.day)
          : null,
        agreementMonth: nonCompeteAgreement.effectiveDate?.month || '',
        agreementYear: nonCompeteAgreement.effectiveDate?.year?.toString() || '',
        // Map employee info
        employeeName: nonCompeteAgreement.employeeInfo?.employeeName || '',
        employeeAddress: nonCompeteAgreement.employeeInfo?.address || '',
        jobTitle: nonCompeteAgreement.employeeInfo?.position || '',
        // Map company representative
        companyRepName: nonCompeteAgreement.companyRepresentative?.name || '',
        companyRepSignature: nonCompeteAgreement.companyRepresentative?.signature || ''
      };
    }

    // Transform Orientation Checklist data for frontend compatibility
    let orientationChecklistFlattened = orientationChecklist;
    if (orientationChecklist) {
      orientationChecklistFlattened = {
        // Map database checkbox fields back to frontend field names
        policies: orientationChecklist.readPoliciesAndScope || false,
        duties: orientationChecklist.understandDuties || false,
        emergencies: orientationChecklist.reportEmergencies || false,
        tbExposure: orientationChecklist.reportTBExposure || false,
        clientRights: orientationChecklist.understandClientRights || false,
        complaints: orientationChecklist.readProcedures || false,
        documentation: orientationChecklist.understandDocumentation || false,
        handbook: orientationChecklist.receivedHandbook || false,
        // Signature fields
        employeeSignature: orientationChecklist.employeeSignature || '',
        employeeDate: orientationChecklist.employeeSignatureDate || null,
        agencySignature: orientationChecklist.agencySignature || '',
        agencyDate: orientationChecklist.agencySignatureDate || null,
        status: orientationChecklist.status || 'draft'
      };
    }

    // Transform Employment Application data for frontend compatibility
    let employmentAppFlattened = employmentApp;
    if (employmentApp) {
      // Employment application model already matches frontend structure
      employmentAppFlattened = {
        _id: employmentApp._id,
        applicationId: employmentApp.applicationId,
        employeeId: employmentApp.employeeId,
        applicantInfo: employmentApp.applicantInfo || {},
        education: employmentApp.education || {},
        employment: employmentApp.employment || [],
        references: employmentApp.references || [],
        militaryService: employmentApp.militaryService || {},
        legalQuestions: employmentApp.legalQuestions || {},
        signature: employmentApp.signature || '',
        signatureDate: employmentApp.signatureDate || null,
        date: employmentApp.date || null,
        status: employmentApp.status || 'draft',
        createdAt: employmentApp.createdAt,
        updatedAt: employmentApp.updatedAt
      };
    }

    const response = {
      application,
      forms: {
        employmentApplication: employmentAppFlattened,
        i9Form: i9FormFlattened,
        w4Form: w4FormFlattened,
        w9Form: w9FormFlattened,
        emergencyContact,
        directDeposit,
        misconductStatement: misconductStatementFlattened,
        codeOfEthics: codeOfEthicsFlattened,
        serviceDeliveryPolicy: serviceDeliveryPolicyFlattened,
        nonCompeteAgreement: nonCompeteAgreementFlattened,
        backgroundCheck,
        tbSymptomScreen,
        orientationChecklist: orientationChecklistFlattened,
        jobDescriptionPCA,
        jobDescriptionCNA,
        jobDescriptionLPN,
        jobDescriptionRN
      }
    };

    res.status(200).json({
      message: "Onboarding application retrieved successfully",
      data: response
    });

  } catch (error) {
    console.error("Error getting onboarding application:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

// Get all onboarding applications (HR view)
router.get("/get-all-applications", async (req, res) => {
  try {
    const applications = await OnboardingApplication.find()
      .populate("employeeId", "userName email phoneNumber position")
      .populate("reviewedBy", "userName")
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: "All onboarding applications retrieved successfully",
      applications
    });

  } catch (error) {
    console.error("Error getting all applications:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

// Update application status
router.put("/update-status/:applicationId", async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { status, reviewComments, reviewedBy } = req.body;

    const application = await OnboardingApplication.findById(applicationId);
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    application.applicationStatus = status;
    if (reviewComments) application.reviewComments = reviewComments;
    
    // Only set reviewedBy if it's a valid ObjectId, otherwise skip it
    if (reviewedBy && mongoose.Types.ObjectId.isValid(reviewedBy)) {
      application.reviewedBy = reviewedBy;
    }
    
    if (status === "submitted") {
      application.submittedAt = new Date();
    }
    
    if (["approved", "rejected"].includes(status)) {
      application.reviewedAt = new Date();
    }

    await application.save();

    res.status(200).json({
      message: "Application status updated successfully",
      application
    });

  } catch (error) {
    console.error("Error updating application status:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

// Submit application to HR
router.put("/submit-application/:applicationId", async (req, res) => {
  try {
    const { applicationId } = req.params;

    const application = await OnboardingApplication.findById(applicationId);
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    // Check if all required forms are completed
    const requiredForms = [
      { model: EmploymentApplication, name: "Employment Application" },
      { model: I9Form, name: "I-9 Form" },
      { model: W4Form, name: "W-4 Form" },
      { model: EmergencyContact, name: "Emergency Contact" },
      { model: MisconductStatement, name: "Staff Statement of Misconduct" },
      { model: CodeOfEthics, name: "Code of Ethics" },
      { model: BackgroundCheck, name: "Background Check Form" },
      { model: TBSymptomScreen, name: "TB Symptom Screen" }
    ];

    const incompleteforms = [];
    for (const form of requiredForms) {
      const formData = await form.model.findOne({ applicationId, status: "completed" });
      if (!formData) {
        incompleteforms.push(form.name);
      }
    }

    if (incompleteforms.length > 0) {
      return res.status(400).json({
        message: "Cannot submit application. The following forms are incomplete:",
        incompleteforms
      });
    }

    // Change all completed forms to submitted status
    await Promise.all([
      EmploymentApplication.updateMany({ applicationId, status: "completed" }, { status: "submitted" }),
      I9Form.updateMany({ applicationId, status: "completed" }, { status: "submitted" }),
      W4Form.updateMany({ applicationId, status: "completed" }, { status: "submitted" }),
      W9Form.updateMany({ applicationId, status: "completed" }, { status: "submitted" }),
      EmergencyContact.updateMany({ applicationId, status: "completed" }, { status: "submitted" }),
      DirectDeposit.updateMany({ applicationId, status: "completed" }, { status: "submitted" }),
      MisconductStatement.updateMany({ applicationId, status: "completed" }, { status: "submitted" }),
      CodeOfEthics.updateMany({ applicationId, status: "completed" }, { status: "submitted" }),
      ServiceDeliveryPolicy.updateMany({ applicationId, status: "completed" }, { status: "submitted" }),
      NonCompeteAgreement.updateMany({ applicationId, status: "completed" }, { status: "submitted" }),
      BackgroundCheck.updateMany({ applicationId, status: "completed" }, { status: "submitted" }),
      TBSymptomScreen.updateMany({ applicationId, status: "completed" }, { status: "submitted" }),
      OrientationChecklist.updateMany({ applicationId, status: "completed" }, { status: "submitted" }),
      JobDescriptionAcknowledgment.updateMany({ applicationId, status: "completed" }, { status: "submitted" })
    ]);

    application.applicationStatus = "submitted";
    application.submittedAt = new Date();
    application.completionPercentage = 100;

    await application.save();

    res.status(200).json({
      message: "Application submitted successfully to HR",
      application
    });

  } catch (error) {
    console.error("Error submitting application:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

// DEBUG ENDPOINT - Force all forms to completed status
router.post("/debug-fix-forms/:applicationId", async (req, res) => {
  try {
    const { applicationId } = req.params;
    console.log("Fixing form statuses for application:", applicationId);
    
    // Update all forms to completed status
    const updateResults = await Promise.all([
      EmploymentApplication.updateMany({ applicationId }, { status: "completed" }),
      I9Form.updateMany({ applicationId }, { status: "completed" }),
      W4Form.updateMany({ applicationId }, { status: "completed" }),
      W9Form.updateMany({ applicationId }, { status: "completed" }),
      EmergencyContact.updateMany({ applicationId }, { status: "completed" }),
      DirectDeposit.updateMany({ applicationId }, { status: "completed" }),
      MisconductStatement.updateMany({ applicationId }, { status: "completed" }),
      CodeOfEthics.updateMany({ applicationId }, { status: "completed" }),
      ServiceDeliveryPolicy.updateMany({ applicationId }, { status: "completed" }),
      NonCompeteAgreement.updateMany({ applicationId }, { status: "completed" }),
      BackgroundCheck.updateMany({ applicationId }, { status: "completed" }),
      TBSymptomScreen.updateMany({ applicationId }, { status: "completed" }),
      OrientationChecklist.updateMany({ applicationId }, { status: "completed" }),
      JobDescriptionAcknowledgment.updateMany({ applicationId }, { status: "completed" })
    ]);

    // Update application completion
    const application = await OnboardingApplication.findById(applicationId);
    if (application) {
      application.completedForms = [
        "Employment Application", "I-9 Form", "W-4 Form", "W-9 Form",
        "Emergency Contact", "Direct Deposit", "Staff Statement of Misconduct",
        "Code of Ethics", "Service Delivery Policy", "Non-Compete Agreement",
        "Background Check Form", "TB Symptom Screen", "Orientation Checklist",
        "Job Description Acknowledgment"
      ];
      application.completionPercentage = 100;
      await application.save();
    }

    res.status(200).json({
      message: "All forms forced to completed status",
      updateResults: updateResults.map(result => result.modifiedCount),
      application
    });

  } catch (error) {
    console.error("Error fixing forms:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

module.exports = router;
