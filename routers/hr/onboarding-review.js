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

// Helper function to get the correct model based on form type
const getFormModel = (formType) => {
  const models = {
    'employment-application': EmploymentApplication,
    'i9-form': I9Form,
    'w4-form': W4Form,
    'w9-form': W9Form,
    'emergency-contact': EmergencyContact,
    'direct-deposit': DirectDeposit,
    'misconduct-statement': MisconductStatement,
    'code-of-ethics': CodeOfEthics,
    'service-delivery-policy': ServiceDeliveryPolicy,
    'non-compete-agreement': NonCompeteAgreement,
    'background-check': BackgroundCheck,
    'tb-symptom-screen': TBSymptomScreen,
    'orientation-checklist': OrientationChecklist,
    'job-description': JobDescriptionAcknowledgment
  };
  return models[formType];
};

// Get all applications pending HR review
router.get("/pending-applications", async (req, res) => {
  try {
    const applications = await OnboardingApplication.find({
      applicationStatus: { $in: ["submitted", "under_review"] }
    })
      .populate("employeeId", "userName email phoneNumber position department")
      .populate("reviewedBy", "userName")
      .sort({ submittedAt: 1 }); // Oldest first

    res.status(200).json({
      message: "Pending applications retrieved successfully",
      applications
    });

  } catch (error) {
    console.error("Error getting pending applications:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

// Get detailed application with all forms for HR review
router.get("/application-detail/:applicationId", async (req, res) => {
  try {
    const { applicationId } = req.params;

    const application = await OnboardingApplication.findById(applicationId)
      .populate("employeeId", "userName email phoneNumber position department")
      .populate("reviewedBy", "userName");

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    // Get all forms with their statuses
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
      jobDescriptions
    ] = await Promise.all([
      EmploymentApplication.findOne({ applicationId }).populate("hrFeedback.reviewedBy", "userName"),
      I9Form.findOne({ applicationId }).populate("hrFeedback.reviewedBy", "userName"),
      W4Form.findOne({ applicationId }).populate("hrFeedback.reviewedBy", "userName"),
      W9Form.findOne({ applicationId }).populate("hrFeedback.reviewedBy", "userName"),
      EmergencyContact.findOne({ applicationId }).populate("hrFeedback.reviewedBy", "userName"),
      DirectDeposit.findOne({ applicationId }).populate("hrFeedback.reviewedBy", "userName"),
      MisconductStatement.findOne({ applicationId }).populate("hrFeedback.reviewedBy", "userName"),
      CodeOfEthics.findOne({ applicationId }).populate("hrFeedback.reviewedBy", "userName"),
      ServiceDeliveryPolicy.findOne({ applicationId }).populate("hrFeedback.reviewedBy", "userName"),
      NonCompeteAgreement.findOne({ applicationId }).populate("hrFeedback.reviewedBy", "userName"),
      BackgroundCheck.findOne({ applicationId }).populate("hrFeedback.reviewedBy", "userName"),
      TBSymptomScreen.findOne({ applicationId }).populate("hrFeedback.reviewedBy", "userName"),
      OrientationChecklist.findOne({ applicationId }).populate("hrFeedback.reviewedBy", "userName"),
      JobDescriptionAcknowledgment.find({ applicationId }).populate("hrFeedback.reviewedBy", "userName")
    ]);

    const response = {
      application,
      forms: {
        employmentApplication: employmentApp,
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
        jobDescriptions: {
          PCA: jobDescriptions.find(jd => jd.jobDescriptionType === 'PCA'),
          CNA: jobDescriptions.find(jd => jd.jobDescriptionType === 'CNA'),
          LPN: jobDescriptions.find(jd => jd.jobDescriptionType === 'LPN'),
          RN: jobDescriptions.find(jd => jd.jobDescriptionType === 'RN')
        }
      }
    };

    res.status(200).json({
      message: "Application details retrieved successfully",
      data: response
    });

  } catch (error) {
    console.error("Error getting application details:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

// Review individual form
router.put("/review-form/:formType/:formId", async (req, res) => {
  try {
    const { formType, formId } = req.params;
    const { status, comment, reviewedBy } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status. Use 'approved' or 'rejected'" });
    }

    const FormModel = getFormModel(formType);
    if (!FormModel) {
      return res.status(400).json({ message: "Invalid form type" });
    }

    const form = await FormModel.findById(formId);
    if (!form) {
      return res.status(404).json({ message: "Form not found" });
    }

    // Update form status and HR feedback
    form.status = status;
    form.hrFeedback = {
      comment: comment || "",
      reviewedBy,
      reviewedAt: new Date()
    };

    await form.save();

    // Check if this was the last form to be reviewed
    await checkAndUpdateApplicationStatus(form.applicationId);

    res.status(200).json({
      message: `Form ${status} successfully`,
      form
    });

  } catch (error) {
    console.error("Error reviewing form:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

// Review entire application
router.put("/review-application/:applicationId", async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { status, reviewComments, reviewedBy } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status. Use 'approved' or 'rejected'" });
    }

    const application = await OnboardingApplication.findById(applicationId);
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    // Update application status
    application.applicationStatus = status;
    application.reviewComments = reviewComments || "";
    application.reviewedBy = reviewedBy;
    application.reviewedAt = new Date();

    await application.save();

    res.status(200).json({
      message: `Application ${status} successfully`,
      application
    });

  } catch (error) {
    console.error("Error reviewing application:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

// Get form review statistics
router.get("/review-statistics", async (req, res) => {
  try {
    const stats = await OnboardingApplication.aggregate([
      {
        $group: {
          _id: "$applicationStatus",
          count: { $sum: 1 }
        }
      }
    ]);

    const formStats = {};
    const formModels = [
      { name: 'employment-application', model: EmploymentApplication },
      { name: 'i9-form', model: I9Form },
      { name: 'w4-form', model: W4Form },
      { name: 'w9-form', model: W9Form },
      { name: 'emergency-contact', model: EmergencyContact },
      { name: 'direct-deposit', model: DirectDeposit },
      { name: 'misconduct-statement', model: MisconductStatement },
      { name: 'code-of-ethics', model: CodeOfEthics },
      { name: 'service-delivery-policy', model: ServiceDeliveryPolicy },
      { name: 'non-compete-agreement', model: NonCompeteAgreement },
      { name: 'background-check', model: BackgroundCheck },
      { name: 'tb-symptom-screen', model: TBSymptomScreen },
      { name: 'orientation-checklist', model: OrientationChecklist },
      { name: 'job-description', model: JobDescriptionAcknowledgment }
    ];

    for (const form of formModels) {
      const formStat = await form.model.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 }
          }
        }
      ]);
      formStats[form.name] = formStat;
    }

    res.status(200).json({
      message: "Review statistics retrieved successfully",
      applicationStats: stats,
      formStats
    });

  } catch (error) {
    console.error("Error getting review statistics:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

// Helper function to check if all forms are reviewed and update application status
async function checkAndUpdateApplicationStatus(applicationId) {
  try {
    const application = await OnboardingApplication.findById(applicationId);
    if (!application || application.applicationStatus !== "submitted") {
      return;
    }

    // Get all forms for this application
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
      jobDescriptions
    ] = await Promise.all([
      EmploymentApplication.findOne({ applicationId }),
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
      OrientationChecklist.findOne({ applicationId }),
      JobDescriptionAcknowledgment.find({ applicationId })
    ]);

    // Check if all forms are either approved or rejected
    const allForms = [
      employmentApp, i9Form, w4Form, w9Form, emergencyContact, directDeposit,
      misconductStatement, codeOfEthics, serviceDeliveryPolicy, nonCompeteAgreement,
      backgroundCheck, tbSymptomScreen, orientationChecklist, ...jobDescriptions
    ].filter(form => form !== null);

    const allFormsReviewed = allForms.every(form => 
      ["approved", "rejected"].includes(form.status)
    );

    if (allFormsReviewed) {
      const anyFormRejected = allForms.some(form => form.status === "rejected");
      
      if (anyFormRejected) {
        application.applicationStatus = "under_review";
      } else {
        application.applicationStatus = "under_review"; // Still needs final HR approval
      }
      
      await application.save();
    }

  } catch (error) {
    console.error("Error checking application status:", error);
  }
}

module.exports = router;
