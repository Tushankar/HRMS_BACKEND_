const express = require("express");
const BackgroundCheck = require("../../database/Models/BackgroundCheck");
const TBSymptomScreen = require("../../database/Models/TBSymptomScreen");
const OrientationChecklist = require("../../database/Models/OrientationChecklist");
const OnboardingApplication = require("../../database/Models/OnboardingApplication");

const router = express.Router();

// Save or update Background Check form
router.post("/save-background-check", async (req, res) => {
  try {
    console.log(
      "Background check request received:",
      JSON.stringify(req.body, null, 2)
    );
    const { applicationId, employeeId, formData, status = "draft" } = req.body;

    if (!applicationId || !employeeId) {
      console.log("Missing required fields:", { applicationId, employeeId });
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

    // Find existing form or create new one
    let backgroundCheckForm = await BackgroundCheck.findOne({ applicationId });

    if (backgroundCheckForm) {
      // Update existing form - merge formData properly
      if (formData.applicantInfo) {
        backgroundCheckForm.applicantInfo = {
          ...backgroundCheckForm.applicantInfo,
          ...formData.applicantInfo,
        };
      }
      if (formData.employmentInfo) {
        backgroundCheckForm.employmentInfo = {
          ...backgroundCheckForm.employmentInfo,
          ...formData.employmentInfo,
        };
      }
      if (formData.consentAcknowledgment) {
        backgroundCheckForm.consentAcknowledgment = {
          ...backgroundCheckForm.consentAcknowledgment,
          ...formData.consentAcknowledgment,
        };
      }
      if (formData.notification) {
        backgroundCheckForm.notification = {
          ...backgroundCheckForm.notification,
          ...formData.notification,
        };
      }
      if (formData.applicantSignature) {
        backgroundCheckForm.applicantSignature = formData.applicantSignature;
      }
      if (formData.applicantSignatureDate) {
        backgroundCheckForm.applicantSignatureDate =
          formData.applicantSignatureDate;
      }
      backgroundCheckForm.status = status;
    } else {
      // Create new form with proper structure
      backgroundCheckForm = new BackgroundCheck({
        applicationId,
        employeeId,
        applicantInfo: formData.applicantInfo || {},
        employmentInfo: formData.employmentInfo || {},
        consentAcknowledgment: formData.consentAcknowledgment || {},
        notification: formData.notification || {},
        applicantSignature: formData.applicantSignature || "",
        applicantSignatureDate: formData.applicantSignatureDate || null,
        status,
      });
    }

    await backgroundCheckForm.save();

    // Update application progress
    if (status === "completed") {
      // Ensure completedForms array exists
      if (!application.completedForms) {
        application.completedForms = [];
      }

      // Check if Background Check is already marked as completed
      if (!application.completedForms.includes("Background Check")) {
        application.completedForms.push("Background Check");
      }

      application.completionPercentage =
        application.calculateCompletionPercentage();
      await application.save();
    }

    const message =
      status === "draft"
        ? "Background check form saved as draft"
        : "Background check form completed";

    res.status(200).json({
      message,
      backgroundCheck: backgroundCheckForm,
      completionPercentage: application.completionPercentage,
    });
  } catch (error) {
    console.error("Error saving background check form:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
});

// Get Background Check form by application ID
router.get("/get-background-check/:applicationId", async (req, res) => {
  try {
    const { applicationId } = req.params;

    const backgroundCheck = await BackgroundCheck.findOne({ applicationId });

    if (!backgroundCheck) {
      return res
        .status(404)
        .json({ message: "Background check form not found" });
    }

    res.status(200).json({
      message: "Background check form retrieved successfully",
      backgroundCheck,
    });
  } catch (error) {
    console.error("Error getting background check form:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
});

// Get Background Check form by ID (for your frontend route)
router.get("/get-background-check-by-id/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const backgroundCheck = await BackgroundCheck.findById(id);

    if (!backgroundCheck) {
      return res
        .status(404)
        .json({ message: "Background check form not found" });
    }

    res.status(200).json({
      message: "Background check form retrieved successfully",
      backgroundCheck,
    });
  } catch (error) {
    console.error("Error getting background check form by ID:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
});

// Update background check results (HR only)
router.put(
  "/update-background-check-results/:applicationId",
  async (req, res) => {
    try {
      const { applicationId } = req.params;
      const { results, reviewedBy } = req.body;

      const backgroundCheck = await BackgroundCheck.findOne({ applicationId });
      if (!backgroundCheck) {
        return res
          .status(404)
          .json({ message: "Background check form not found" });
      }

      backgroundCheck.results = { ...backgroundCheck.results, ...results };
      backgroundCheck.results.reviewedBy = reviewedBy;
      backgroundCheck.results.reviewDate = new Date();

      await backgroundCheck.save();

      res.status(200).json({
        message: "Background check results updated successfully",
        backgroundCheck,
      });
    } catch (error) {
      console.error("Error updating background check results:", error);
      res
        .status(500)
        .json({ message: "Internal server error", error: error.message });
    }
  }
);

// Save or update TB Symptom Screen form
router.post("/save-tb-symptom-screen", async (req, res) => {
  try {
    console.log(
      "TB Symptom Screen request received:",
      JSON.stringify(req.body, null, 2)
    );
    const { applicationId, employeeId, formData, status = "draft" } = req.body;

    if (!applicationId || !employeeId) {
      console.log("Missing required fields:", { applicationId, employeeId });
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

    // Find existing form or create new one
    let tbScreenForm = await TBSymptomScreen.findOne({ applicationId });

    if (tbScreenForm) {
      // Update existing form - merge formData properly
      if (formData.basicInfo) {
        tbScreenForm.basicInfo = {
          ...tbScreenForm.basicInfo,
          ...formData.basicInfo,
        };
      }
      if (formData.lastSkinTest) {
        tbScreenForm.lastSkinTest = {
          ...tbScreenForm.lastSkinTest,
          ...formData.lastSkinTest,
        };
      }
      if (formData.treatmentHistory) {
        tbScreenForm.treatmentHistory = {
          ...tbScreenForm.treatmentHistory,
          ...formData.treatmentHistory,
        };
      }
      if (formData.symptoms) {
        tbScreenForm.symptoms = {
          ...tbScreenForm.symptoms,
          ...formData.symptoms,
        };
      }
      if (formData.actionTaken) {
        tbScreenForm.actionTaken = {
          ...tbScreenForm.actionTaken,
          ...formData.actionTaken,
        };
      }
      if (formData.screeningDate) {
        tbScreenForm.screeningDate = formData.screeningDate;
      }
      if (formData.screenerSignature) {
        tbScreenForm.screenerSignature = formData.screenerSignature;
      }
      // Ignore clientSignature and clientSignatureDate from employee submission (HR-only via submit-notes)
      tbScreenForm.status = status;
    } else {
      // Create new form with proper structure
      tbScreenForm = new TBSymptomScreen({
        applicationId,
        employeeId,
        basicInfo: formData.basicInfo || {},
        lastSkinTest: formData.lastSkinTest || {},
        treatmentHistory: formData.treatmentHistory || {},
        symptoms: formData.symptoms || {},
        actionTaken: formData.actionTaken || {},
        screeningDate: formData.screeningDate || null,
        screenerSignature: formData.screenerSignature || "",
        // clientSignature is HR-only; do not accept from employee submission here
        clientSignature: "",
        clientSignatureDate: null,
        status,
      });
    }

    await tbScreenForm.save();

    // Update application progress
    if (status === "completed") {
      // Ensure completedForms array exists
      if (!application.completedForms) {
        application.completedForms = [];
      }

      // Check if TB Symptom Screen is already marked as completed
      if (!application.completedForms.includes("TB Symptom Screen")) {
        application.completedForms.push("TB Symptom Screen");
      }

      application.completionPercentage =
        application.calculateCompletionPercentage();
      await application.save();
    }

    const message =
      status === "draft"
        ? "TB symptom screen saved as draft"
        : "TB symptom screen completed";

    res.status(200).json({
      message,
      tbSymptomScreen: tbScreenForm,
      completionPercentage: application.completionPercentage,
    });
  } catch (error) {
    console.error("Error saving TB symptom screen:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
});

// Get TB Symptom Screen form by application ID
router.get("/get-tb-symptom-screen/:applicationId", async (req, res) => {
  try {
    const { applicationId } = req.params;

    const tbSymptomScreen = await TBSymptomScreen.findOne({ applicationId });

    if (!tbSymptomScreen) {
      return res.status(404).json({ message: "TB symptom screen not found" });
    }

    res.status(200).json({
      message: "TB symptom screen retrieved successfully",
      tbSymptomScreen,
    });
  } catch (error) {
    console.error("Error getting TB symptom screen:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
});

// Get TB Symptom Screen form by ID (for your frontend route)
router.get("/get-tb-symptom-screen-by-id/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const tbSymptomScreen = await TBSymptomScreen.findById(id);

    if (!tbSymptomScreen) {
      return res.status(404).json({ message: "TB symptom screen not found" });
    }

    res.status(200).json({
      message: "TB symptom screen retrieved successfully",
      tbSymptomScreen,
    });
  } catch (error) {
    console.error("Error getting TB symptom screen by ID:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
});

// Save or update Orientation Checklist
router.post("/save-orientation-checklist", async (req, res) => {
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

    // Map form data to schema fields for Orientation Checklist
    const mappedData = {
      // Checkbox acknowledgments - mapping frontend field names to database field names
      readPoliciesAndScope: formData.policies || false,
      understandDuties: formData.duties || false,
      reportEmergencies: formData.emergencies || false,
      reportTBExposure: formData.tbExposure || false,
      understandClientRights: formData.clientRights || false,
      readProcedures: formData.complaints || false,
      understandDocumentation: formData.documentation || false,
      receivedHandbook: formData.handbook || false,
      // Employee signature fields (frontend uses employeeSignature, employeeDate)
      employeeSignature: formData.employeeSignature || "",
      employeeSignatureDate: formData.employeeDate
        ? new Date(formData.employeeDate)
        : null,
      // Agency signature is HR-only: ignored on employee save; set via HR submit-notes
      status,
    };

    // Find existing form or create new one
    let orientationForm = await OrientationChecklist.findOne({ applicationId });

    if (orientationForm) {
      // Update existing form with mapped data
      Object.assign(orientationForm, mappedData);
    } else {
      // Create new form with mapped data
      orientationForm = new OrientationChecklist({
        applicationId,
        employeeId,
        ...mappedData,
      });
    }

    await orientationForm.save();

    // Update application progress
    if (status === "completed") {
      // Ensure completedForms array exists
      if (!application.completedForms) {
        application.completedForms = [];
      }

      // Check if Orientation Checklist is already marked as completed
      if (!application.completedForms.includes("Orientation Checklist")) {
        application.completedForms.push("Orientation Checklist");
      }

      application.completionPercentage =
        application.calculateCompletionPercentage();
      await application.save();
    }

    const message =
      status === "draft"
        ? "Orientation checklist saved as draft"
        : "Orientation checklist completed";

    res.status(200).json({
      message,
      orientationChecklist: orientationForm,
      completionPercentage: application.completionPercentage,
    });
  } catch (error) {
    console.error("Error saving orientation checklist:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
});

// Get Orientation Checklist
router.get("/get-orientation-checklist/:applicationId", async (req, res) => {
  try {
    const { applicationId } = req.params;

    const orientationChecklist = await OrientationChecklist.findOne({
      applicationId,
    });

    if (!orientationChecklist) {
      return res
        .status(404)
        .json({ message: "Orientation checklist not found" });
    }

    // Map database fields to frontend field names
    const mappedData = {
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
      employeeSignature: orientationChecklist.employeeSignature || "",
      employeeDate: orientationChecklist.employeeSignatureDate || null,
      agencySignature: orientationChecklist.agencySignature || "",
      agencyDate: orientationChecklist.agencySignatureDate || null,
      status: orientationChecklist.status || "draft",
    };

    res.status(200).json({
      message: "Orientation checklist retrieved successfully",
      orientationChecklist: mappedData,
    });
  } catch (error) {
    console.error("Error getting orientation checklist:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
});

module.exports = router;
