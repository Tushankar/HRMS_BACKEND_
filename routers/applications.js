const express = require("express");
const OnboardingApplication = require("../database/Models/OnboardingApplication");
const PersonalInformation = require("../database/Models/PersonalInformation");
const ProfessionalExperience = require("../database/Models/ProfessionalExperience");
const Education = require("../database/Models/Education");
const References = require("../database/Models/References");
const LegalDisclosures = require("../database/Models/LegalDisclosures");
const PositionType = require("../database/Models/PositionType");
const EmploymentApplication = require("../database/Models/EmploymentApplication");
const OrientationPresentation = require("../database/Models/OrientationPresentation");
const I9Form = require("../database/Models/I9Form");
const W4Form = require("../database/Models/W4Form");
const W9Form = require("../database/Models/W9Form");
const EmergencyContact = require("../database/Models/EmergencyContact");
const DirectDeposit = require("../database/Models/DirectDeposit");
const MisconductStatement = require("../database/Models/MisconductStatement");
const CodeOfEthics = require("../database/Models/CodeOfEthics");
const ServiceDeliveryPolicy = require("../database/Models/ServiceDeliveryPolicy");
const NonCompeteAgreement = require("../database/Models/NonCompeteAgreement");
const BackgroundCheck = require("../database/Models/BackgroundCheck");
const TBSymptomScreen = require("../database/Models/TBSymptomScreen");
const DrivingLicense = require("../database/Models/DrivingLicense");
const OrientationChecklist = require("../database/Models/OrientationChecklist");
const WorkExperience = require("../database/Models/WorkExperience");
const PCATrainingQuestions = require("../database/Models/PCATrainingQuestions");

const router = express.Router();

// Save employment type
router.post("/:applicationId/employment-type", async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { employmentType } = req.body;

    if (!["W-2", "1099"].includes(employmentType)) {
      return res.status(400).json({ message: "Invalid employment type" });
    }

    const application = await OnboardingApplication.findById(applicationId);
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    application.employmentType = employmentType;
    await application.save();

    res.status(200).json({
      message: "Employment type saved successfully",
      employmentType: application.employmentType,
    });
  } catch (error) {
    console.error("Error saving employment type:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
});

// Get forms status for sidebar
router.get("/:applicationId/forms-status", async (req, res) => {
  try {
    const { applicationId } = req.params;

    const application = await OnboardingApplication.findById(applicationId);
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    // Get all forms data similar to get-application but only status
    const [
      personalInformation,
      professionalExperience,
      education,
      references,
      legalDisclosures,
      positionType,
      employmentApp,
      orientationPresentation,
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
      drivingLicense,
      orientationChecklist,
      workExperience,
      pcaTrainingQuestions,
    ] = await Promise.all([
      PersonalInformation.findOne({ applicationId }),
      ProfessionalExperience.findOne({ applicationId }),
      Education.findOne({ applicationId }),
      References.findOne({ applicationId }),
      LegalDisclosures.findOne({ applicationId }),
      PositionType.findOne({ applicationId }),
      EmploymentApplication.findOne({ applicationId }),
      OrientationPresentation.findOne({ applicationId }),
      I9Form.findOne({ applicationId }),
      W4Form.findOne({ applicationId }),
      W9Form.findOne({ applicationId }),
      EmergencyContact.findOne({ applicationId }),
      DirectDeposit.findOne({ applicationId }),
      MisconductStatement.findOne({ applicationId }),
      CodeOfEthics.findOne({ applicationId }),
      ServiceDeliveryPolicy.findOne({ applicationId }),
      NonCompeteAgreement.findOne({ applicationId }),
      BackgroundCheck.findOne({ applicationId }),
      TBSymptomScreen.findOne({ applicationId }),
      DrivingLicense.findOne({ applicationId }),
      OrientationChecklist.findOne({ applicationId }),
      WorkExperience.findOne({ applicationId }),
      PCATrainingQuestions.findOne({ applicationId }),
    ]);

    const formsStatus = {
      employmentType: application.employmentType,
      personalInformation: personalInformation
        ? { status: personalInformation.status, _id: personalInformation._id }
        : null,
      professionalExperience: professionalExperience
        ? {
            status: professionalExperience.status,
            _id: professionalExperience._id,
          }
        : null,
      workExperience: workExperience
        ? { status: workExperience.status, _id: workExperience._id }
        : null,
      education: education
        ? { status: education.status, _id: education._id }
        : null,
      references: references
        ? { status: references.status, _id: references._id }
        : null,
      legalDisclosures: legalDisclosures
        ? { status: legalDisclosures.status, _id: legalDisclosures._id }
        : null,
      positionType: positionType
        ? { status: positionType.status, _id: positionType._id }
        : null,
      employmentApplication: employmentApp
        ? { status: employmentApp.status, _id: employmentApp._id }
        : null,
      orientationPresentation: orientationPresentation
        ? {
            status: orientationPresentation.status,
            _id: orientationPresentation._id,
          }
        : null,
      i9Form: i9Form ? { status: i9Form.status, _id: i9Form._id } : null,
      w4Form: w4Form ? { status: w4Form.status, _id: w4Form._id } : null,
      w9Form: w9Form ? { status: w9Form.status, _id: w9Form._id } : null,
      emergencyContact: emergencyContact
        ? { status: emergencyContact.status, _id: emergencyContact._id }
        : null,
      directDeposit: directDeposit
        ? { status: directDeposit.status, _id: directDeposit._id }
        : null,
      misconductStatement: misconductStatement
        ? { status: misconductStatement.status, _id: misconductStatement._id }
        : null,
      codeOfEthics: codeOfEthics
        ? { status: codeOfEthics.status, _id: codeOfEthics._id }
        : null,
      serviceDeliveryPolicy: serviceDeliveryPolicy
        ? {
            status: serviceDeliveryPolicy.status,
            _id: serviceDeliveryPolicy._id,
          }
        : null,
      nonCompeteAgreement: nonCompeteAgreement
        ? { status: nonCompeteAgreement.status, _id: nonCompeteAgreement._id }
        : null,
      backgroundCheck: backgroundCheck
        ? { status: backgroundCheck.status, _id: backgroundCheck._id }
        : null,
      tbSymptomScreen: tbSymptomScreen
        ? { status: tbSymptomScreen.status, _id: tbSymptomScreen._id }
        : null,
      drivingLicense: drivingLicense
        ? { status: drivingLicense.status, _id: drivingLicense._id }
        : null,
      orientationChecklist: orientationChecklist
        ? { status: orientationChecklist.status, _id: orientationChecklist._id }
        : null,
      pcaTrainingQuestions: pcaTrainingQuestions
        ? { status: pcaTrainingQuestions.status, _id: pcaTrainingQuestions._id }
        : null,
    };

    res.status(200).json({
      message: "Forms status retrieved successfully",
      forms: formsStatus,
    });
  } catch (error) {
    console.error("Error getting forms status:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
});

module.exports = router;
