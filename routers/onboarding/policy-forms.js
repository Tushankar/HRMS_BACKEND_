const express = require("express");
const MisconductStatement = require("../../database/Models/MisconductStatement");
const CodeOfEthics = require("../../database/Models/CodeOfEthics");
const ServiceDeliveryPolicy = require("../../database/Models/ServiceDeliveryPolicy");
const NonCompeteAgreement = require("../../database/Models/NonCompeteAgreement");
const OnboardingApplication = require("../../database/Models/OnboardingApplication");

const router = express.Router();

// Save or update Misconduct Statement form
router.post("/save-misconduct-statement", async (req, res) => {
  try {
    const { applicationId, employeeId, formData, status = "draft" } = req.body;

    if (!applicationId || !employeeId) {
      return res
        .status(400)
        .json({ message: "Application ID and Employee ID are required" });
    }

    // Check if application exists
    const application = await OnboardingApplication.findById(applicationId);
    if (!application) {
      return res
        .status(404)
        .json({ message: "Onboarding application not found" });
    }

    console.log("Raw formData received:", formData); // Debug log

    // Map flat form data to nested schema structure
    const mappedData = {
      staffInfo: {
        staffTitle: formData.staffTitle || "",
        employeeName: formData.employeeName || "",
        employmentPosition: formData.employmentPosition || "",
      },
      acknowledgment: {
        understandsCodeOfConduct: formData.understandsCodeOfConduct || false,
        noMisconductHistory: formData.noMisconductHistory || false,
        formReadAndUnderstood: formData.formReadAndUnderstood || false,
      },
      employeeSignature: {
        printedName: formData.employeeName || "",
        position: formData.employmentPosition || "",
        signature: formData.signature || "",
        date: formData.date ? new Date(formData.date) : null,
      },
      verifier: {
        statement: formData.witnessStatement || "",
        printedName: formData.witnessName || "",
        // Employee should NOT set witness signature
        signature: "",
        date: formData.witnessDate ? new Date(formData.witnessDate) : null,
      },
      notaryInfo: {
        state: "Georgia", // Default as per schema
        day: formData.notaryDate ? parseInt(formData.notaryDate) : null,
        month: formData.notaryMonth || "",
        year: formData.notaryYear ? parseInt(formData.notaryYear) : null,
        // Employee should NOT set notary signature
        notarySignature: "",
        notarySeal: formData.notarySeal || "",
      },
      status,
    };

    console.log("Mapped data for database:", mappedData); // Debug log

    // Find existing form or create new one
    let misconductForm = await MisconductStatement.findOne({ applicationId });

    if (misconductForm) {
      // Update existing form with mapped data
      Object.assign(misconductForm, mappedData);
    } else {
      // Create new form with mapped data
      misconductForm = new MisconductStatement({
        applicationId,
        employeeId,
        ...mappedData,
      });
    }

    await misconductForm.save();

    // Update application progress
    if (status === "completed") {
      // Ensure completedForms array exists
      if (!application.completedForms) {
        application.completedForms = [];
      }

      // Check if Staff Statement of Misconduct is already marked as completed
      if (
        !application.completedForms.includes("Staff Statement of Misconduct")
      ) {
        application.completedForms.push("Staff Statement of Misconduct");
      }

      application.completionPercentage =
        application.calculateCompletionPercentage();
      await application.save();
    }

    const message =
      status === "draft"
        ? "Misconduct statement saved as draft"
        : "Misconduct statement completed";

    res.status(200).json({
      message,
      misconductStatement: misconductForm,
      completionPercentage: application.completionPercentage,
    });
  } catch (error) {
    console.error("Error saving misconduct statement:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
});

// Get Misconduct Statement form
router.get("/get-misconduct-statement/:applicationId", async (req, res) => {
  try {
    const { applicationId } = req.params;

    const misconductStatement = await MisconductStatement.findOne({
      applicationId,
    });

    if (!misconductStatement) {
      return res
        .status(404)
        .json({ message: "Misconduct statement not found" });
    }

    res.status(200).json({
      message: "Misconduct statement retrieved successfully",
      misconductStatement,
    });
  } catch (error) {
    console.error("Error getting misconduct statement:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
});

// Save or update Code of Ethics form
router.post("/save-code-of-ethics", async (req, res) => {
  try {
    const { applicationId, employeeId, formData, status = "draft" } = req.body;

    if (!applicationId || !employeeId) {
      return res
        .status(400)
        .json({ message: "Application ID and Employee ID are required" });
    }

    // Check if application exists
    const application = await OnboardingApplication.findById(applicationId);
    if (!application) {
      return res
        .status(404)
        .json({ message: "Onboarding application not found" });
    }

    // Map form data to schema fields
    const mappedData = {
      acknowledgment: formData.acknowledgment || false,
      employeeSignature: formData.signature || formData.employeeSignature || "",
      signatureDate: formData.date
        ? new Date(formData.date)
        : formData.signatureDate
        ? new Date(formData.signatureDate)
        : null,
      status,
    };

    // Find existing form or create new one
    let codeOfEthicsForm = await CodeOfEthics.findOne({ applicationId });

    if (codeOfEthicsForm) {
      // Update existing form with mapped data
      Object.assign(codeOfEthicsForm, mappedData);
    } else {
      // Create new form with mapped data
      codeOfEthicsForm = new CodeOfEthics({
        applicationId,
        employeeId,
        ...mappedData,
      });
    }

    await codeOfEthicsForm.save();

    // Update application progress
    if (status === "completed") {
      // Ensure completedForms array exists
      if (!application.completedForms) {
        application.completedForms = [];
      }

      // Check if Code of Ethics is already marked as completed
      if (!application.completedForms.includes("Code of Ethics")) {
        application.completedForms.push("Code of Ethics");
      }

      application.completionPercentage =
        application.calculateCompletionPercentage();
      await application.save();
    }

    const message =
      status === "draft"
        ? "Code of ethics saved as draft"
        : "Code of ethics completed";

    res.status(200).json({
      message,
      codeOfEthics: codeOfEthicsForm,
      completionPercentage: application.completionPercentage,
    });
  } catch (error) {
    console.error("Error saving code of ethics:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
});

// Get Code of Ethics form
router.get("/get-code-of-ethics/:applicationId", async (req, res) => {
  try {
    const { applicationId } = req.params;

    const codeOfEthics = await CodeOfEthics.findOne({ applicationId });

    if (!codeOfEthics) {
      return res.status(404).json({ message: "Code of ethics form not found" });
    }

    // Map database fields to frontend field names
    const mappedData = {
      ...codeOfEthics.toObject(),
      signature: codeOfEthics.employeeSignature || "",
      date: codeOfEthics.signatureDate || null,
    };

    res.status(200).json({
      message: "Code of ethics retrieved successfully",
      codeOfEthics: mappedData,
    });
  } catch (error) {
    console.error("Error getting code of ethics:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
});

// Save or update Service Delivery Policy form
router.post("/save-service-delivery-policy", async (req, res) => {
  try {
    const { applicationId, employeeId, formData, status = "draft" } = req.body;

    if (!applicationId || !employeeId) {
      return res
        .status(400)
        .json({ message: "Application ID and Employee ID are required" });
    }

    // Check if application exists
    const application = await OnboardingApplication.findById(applicationId);
    if (!application) {
      return res
        .status(404)
        .json({ message: "Onboarding application not found" });
    }

    // Map form data to schema fields for Service Delivery Policy
    const mappedData = {
      // Policy acknowledgments
      policy1Acknowledged: formData.policy1Acknowledged || false,
      policy2Acknowledged: formData.policy2Acknowledged || false,
      policy3Acknowledged: formData.policy3Acknowledged || false,
      policy4Acknowledged: formData.policy4Acknowledged || false,
      policy5Acknowledged: formData.policy5Acknowledged || false,
      // Employee signature fields (frontend uses employeeSignature, employeeDate)
      employeeSignature: formData.employeeSignature || "",
      employeeSignatureDate: formData.employeeDate
        ? new Date(formData.employeeDate)
        : null,
      // Supervisor signature fields are HR-only. Do NOT accept from employee form submit.
      // Keep existing supervisorSignature fields unchanged here; they will be set via HR notes endpoint.
      status,
    };

    // Find existing form or create new one
    let serviceDeliveryForm = await ServiceDeliveryPolicy.findOne({
      applicationId,
    });

    if (serviceDeliveryForm) {
      // Update existing form with mapped data
      Object.assign(serviceDeliveryForm, mappedData);
    } else {
      // Create new form with mapped data
      serviceDeliveryForm = new ServiceDeliveryPolicy({
        applicationId,
        employeeId,
        ...mappedData,
      });
    }

    await serviceDeliveryForm.save();

    // Update application progress
    if (status === "completed") {
      // Ensure completedForms array exists
      if (!application.completedForms) {
        application.completedForms = [];
      }

      // Check if Service Delivery Policies is already marked as completed
      if (!application.completedForms.includes("Service Delivery Policies")) {
        application.completedForms.push("Service Delivery Policies");
      }

      application.completionPercentage =
        application.calculateCompletionPercentage();
      await application.save();
    }

    const message =
      status === "draft"
        ? "Service delivery policy saved as draft"
        : "Service delivery policy completed";

    res.status(200).json({
      message,
      serviceDeliveryPolicy: serviceDeliveryForm,
      completionPercentage: application.completionPercentage,
    });
  } catch (error) {
    console.error("Error saving service delivery policy:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
});

// Get Service Delivery Policy form
router.get("/get-service-delivery-policy/:applicationId", async (req, res) => {
  try {
    const { applicationId } = req.params;

    const serviceDeliveryPolicy = await ServiceDeliveryPolicy.findOne({
      applicationId,
    });

    if (!serviceDeliveryPolicy) {
      return res
        .status(404)
        .json({ message: "Service delivery policy form not found" });
    }

    // Map database fields to frontend field names
    const mappedData = {
      ...serviceDeliveryPolicy.toObject(),
      employeeDate: serviceDeliveryPolicy.employeeSignatureDate || null,
      agencySignature: serviceDeliveryPolicy.supervisorSignature || "",
      agencyDate: serviceDeliveryPolicy.supervisorSignatureDate || null,
    };

    res.status(200).json({
      message: "Service delivery policy retrieved successfully",
      serviceDeliveryPolicy: mappedData,
    });
  } catch (error) {
    console.error("Error getting service delivery policy:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
});

// Save or update Non-Compete Agreement form
router.post("/save-non-compete-agreement", async (req, res) => {
  try {
    const { applicationId, employeeId, formData, status = "draft" } = req.body;

    if (!applicationId || !employeeId) {
      return res
        .status(400)
        .json({ message: "Application ID and Employee ID are required" });
    }

    // Check if application exists
    const application = await OnboardingApplication.findById(applicationId);
    if (!application) {
      return res
        .status(404)
        .json({ message: "Onboarding application not found" });
    }

    // Map form data to schema fields for Non-Compete Agreement
    const mappedData = {
      // Effective date mapping
      effectiveDate: {
        day: formData.agreementDate
          ? new Date(formData.agreementDate).getDate()
          : null,
        month:
          formData.agreementMonth ||
          (formData.agreementDate
            ? new Date(formData.agreementDate).toLocaleDateString("en-US", {
                month: "long",
              })
            : ""),
        year: formData.agreementYear
          ? parseInt(formData.agreementYear)
          : formData.agreementDate
          ? new Date(formData.agreementDate).getFullYear()
          : null,
      },
      // Employee info mapping
      employeeInfo: {
        employeeName: formData.employeeName || "",
        address: formData.employeeAddress || "",
        position: formData.jobTitle || "",
      },
      // Signature mapping
      employeeSignature: formData.employeeSignature || "",
      employeeSignatureDate: formData.agreementDate
        ? new Date(formData.agreementDate)
        : null,
      status,
    };

    // Find existing form or create new one
    let nonCompeteForm = await NonCompeteAgreement.findOne({ applicationId });

    if (nonCompeteForm) {
      // Update existing form with mapped data
      Object.assign(nonCompeteForm, mappedData);
    } else {
      // Create new form with mapped data
      nonCompeteForm = new NonCompeteAgreement({
        applicationId,
        employeeId,
        ...mappedData,
      });
    }

    await nonCompeteForm.save();

    // Update application progress
    if (status === "completed") {
      // Ensure completedForms array exists
      if (!application.completedForms) {
        application.completedForms = [];
      }

      // Check if Non-Compete Agreement is already marked as completed
      if (!application.completedForms.includes("Non-Compete Agreement")) {
        application.completedForms.push("Non-Compete Agreement");
      }

      application.completionPercentage =
        application.calculateCompletionPercentage();
      await application.save();
    }

    const message =
      status === "draft"
        ? "Non-compete agreement saved as draft"
        : "Non-compete agreement completed";

    res.status(200).json({
      message,
      nonCompeteAgreement: nonCompeteForm,
      completionPercentage: application.completionPercentage,
    });
  } catch (error) {
    console.error("Error saving non-compete agreement:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
});

// Get Non-Compete Agreement form
router.get("/get-non-compete-agreement/:applicationId", async (req, res) => {
  try {
    const { applicationId } = req.params;

    const nonCompeteAgreement = await NonCompeteAgreement.findOne({
      applicationId,
    });

    if (!nonCompeteAgreement) {
      return res
        .status(404)
        .json({ message: "Non-compete agreement not found" });
    }

    // Map database fields to frontend field names
    const mappedData = {
      ...nonCompeteAgreement.toObject(),
      // Map effective date back to frontend fields
      agreementDate:
        nonCompeteAgreement.effectiveDate?.day &&
        nonCompeteAgreement.effectiveDate?.month &&
        nonCompeteAgreement.effectiveDate?.year
          ? new Date(
              nonCompeteAgreement.effectiveDate.year,
              [
                "January",
                "February",
                "March",
                "April",
                "May",
                "June",
                "July",
                "August",
                "September",
                "October",
                "November",
                "December",
              ].indexOf(nonCompeteAgreement.effectiveDate.month),
              nonCompeteAgreement.effectiveDate.day
            )
          : null,
      agreementMonth: nonCompeteAgreement.effectiveDate?.month || "",
      agreementYear: nonCompeteAgreement.effectiveDate?.year?.toString() || "",
      // Map employee info
      employeeName: nonCompeteAgreement.employeeInfo?.employeeName || "",
      employeeAddress: nonCompeteAgreement.employeeInfo?.address || "",
      jobTitle: nonCompeteAgreement.employeeInfo?.position || "",
      // Map company representative
      companyRepName: nonCompeteAgreement.companyRepresentative?.name || "",
      companyRepSignature:
        nonCompeteAgreement.companyRepresentative?.signature || "",
    };

    res.status(200).json({
      message: "Non-compete agreement retrieved successfully",
      nonCompeteAgreement: mappedData,
    });
  } catch (error) {
    console.error("Error getting non-compete agreement:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
});

module.exports = router;
