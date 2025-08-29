const express = require("express");
const BackgroundCheck = require("../../database/Models/BackgroundCheck");
const TBSymptomScreen = require("../../database/Models/TBSymptomScreen");
const OrientationChecklist = require("../../database/Models/OrientationChecklist");
const OnboardingApplication = require("../../database/Models/OnboardingApplication");

const router = express.Router();

// Save or update Background Check form
router.post("/save-background-check", async (req, res) => {
  try {
    const { applicationId, employeeId, formData, status = "draft" } = req.body;

    if (!applicationId || !employeeId) {
      return res.status(400).json({ message: "Application ID and Employee ID are required" });
    }

    // Check if application exists
    const application = await OnboardingApplication.findById(applicationId);
    if (!application) {
      return res.status(404).json({ message: "Onboarding application not found" });
    }

    // Find existing form or create new one
    let backgroundCheckForm = await BackgroundCheck.findOne({ applicationId });
    
    if (backgroundCheckForm) {
      // Update existing form
      Object.assign(backgroundCheckForm, formData);
      backgroundCheckForm.status = status;
    } else {
      // Create new form
      backgroundCheckForm = new BackgroundCheck({
        applicationId,
        employeeId,
        ...formData,
        status
      });
    }

    await backgroundCheckForm.save();

    // Update application progress
    if (status === "completed") {
      // Ensure formsCompleted array exists
      if (!application.formsCompleted) {
        application.formsCompleted = [];
      }

      const existingFormIndex = application.formsCompleted.findIndex(
        form => form.formName === "Background Check Form"
      );
      
      if (existingFormIndex === -1) {
        application.formsCompleted.push({
          formName: "Background Check Form",
          status: "completed"
        });
      } else {
        application.formsCompleted[existingFormIndex].status = "completed";
        application.formsCompleted[existingFormIndex].completedAt = new Date();
      }
      
      application.completionPercentage = application.calculateCompletionPercentage();
      await application.save();
    }

    const message = status === "draft" ? "Background check form saved as draft" : "Background check form completed";

    res.status(200).json({
      message,
      backgroundCheck: backgroundCheckForm,
      completionPercentage: application.completionPercentage
    });

  } catch (error) {
    console.error("Error saving background check form:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

// Get Background Check form
router.get("/get-background-check/:applicationId", async (req, res) => {
  try {
    const { applicationId } = req.params;

    const backgroundCheck = await BackgroundCheck.findOne({ applicationId });
    
    if (!backgroundCheck) {
      return res.status(404).json({ message: "Background check form not found" });
    }

    res.status(200).json({
      message: "Background check form retrieved successfully",
      backgroundCheck
    });

  } catch (error) {
    console.error("Error getting background check form:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

// Update background check results (HR only)
router.put("/update-background-check-results/:applicationId", async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { results, reviewedBy } = req.body;

    const backgroundCheck = await BackgroundCheck.findOne({ applicationId });
    if (!backgroundCheck) {
      return res.status(404).json({ message: "Background check form not found" });
    }

    backgroundCheck.results = { ...backgroundCheck.results, ...results };
    backgroundCheck.results.reviewedBy = reviewedBy;
    backgroundCheck.results.reviewDate = new Date();

    await backgroundCheck.save();

    res.status(200).json({
      message: "Background check results updated successfully",
      backgroundCheck
    });

  } catch (error) {
    console.error("Error updating background check results:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

// Save or update TB Symptom Screen form
router.post("/save-tb-symptom-screen", async (req, res) => {
  try {
    const { applicationId, employeeId, formData, status = "draft" } = req.body;

    if (!applicationId || !employeeId) {
      return res.status(400).json({ message: "Application ID and Employee ID are required" });
    }

    // Check if application exists
    const application = await OnboardingApplication.findById(applicationId);
    if (!application) {
      return res.status(404).json({ message: "Onboarding application not found" });
    }

    // Find existing form or create new one
    let tbScreenForm = await TBSymptomScreen.findOne({ applicationId });
    
    if (tbScreenForm) {
      // Update existing form - avoid overwriting employeeId and applicationId
      const { employeeId: formEmployeeId, applicationId: formApplicationId, ...safeFormData } = formData;
      Object.assign(tbScreenForm, safeFormData);
      tbScreenForm.status = status;
    } else {
      // Create new form - exclude conflicting fields from formData
      const { employeeId: formEmployeeId, applicationId: formApplicationId, ...safeFormData } = formData;
      tbScreenForm = new TBSymptomScreen({
        applicationId,
        employeeId,
        ...safeFormData,
        status
      });
    }

    await tbScreenForm.save();

    // Update application progress
    if (status === "completed") {
      // Ensure formsCompleted array exists
      if (!application.formsCompleted) {
        application.formsCompleted = [];
      }
      
      const existingFormIndex = application.formsCompleted.findIndex(
        form => form.formName === "TB Symptom Screen"
      );
      
      if (existingFormIndex === -1) {
        application.formsCompleted.push({
          formName: "TB Symptom Screen",
          status: "completed",
          completedAt: new Date()
        });
      } else {
        application.formsCompleted[existingFormIndex].status = "completed";
        application.formsCompleted[existingFormIndex].completedAt = new Date();
      }
      
      application.completionPercentage = application.calculateCompletionPercentage();
      await application.save();
    }

    const message = status === "draft" ? "TB symptom screen saved as draft" : "TB symptom screen completed";

    res.status(200).json({
      message,
      tbSymptomScreen: tbScreenForm,
      completionPercentage: application.completionPercentage
    });

  } catch (error) {
    console.error("Error saving TB symptom screen:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

// Get TB Symptom Screen form
router.get("/get-tb-symptom-screen/:applicationId", async (req, res) => {
  try {
    const { applicationId } = req.params;

    const tbSymptomScreen = await TBSymptomScreen.findOne({ applicationId });
    
    if (!tbSymptomScreen) {
      return res.status(404).json({ message: "TB symptom screen not found" });
    }

    res.status(200).json({
      message: "TB symptom screen retrieved successfully",
      tbSymptomScreen
    });

  } catch (error) {
    console.error("Error getting TB symptom screen:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

// Save or update Orientation Checklist
router.post("/save-orientation-checklist", async (req, res) => {
  try {
    const { applicationId, employeeId, formData, status = "draft" } = req.body;

    if (!applicationId || !employeeId) {
      return res.status(400).json({ message: "Application ID and Employee ID are required" });
    }

    // Check if application exists
    const application = await OnboardingApplication.findById(applicationId);
    if (!application) {
      return res.status(404).json({ message: "Onboarding application not found" });
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
      employeeSignature: formData.employeeSignature || '',
      employeeSignatureDate: formData.employeeDate ? new Date(formData.employeeDate) : null,
      // Agency signature fields (frontend uses agencySignature, agencyDate)
      agencySignature: formData.agencySignature || '',
      agencySignatureDate: formData.agencyDate ? new Date(formData.agencyDate) : null,
      status
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
        ...mappedData
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
      
      application.completionPercentage = application.calculateCompletionPercentage();
      await application.save();
    }

    const message = status === "draft" ? "Orientation checklist saved as draft" : "Orientation checklist completed";

    res.status(200).json({
      message,
      orientationChecklist: orientationForm,
      completionPercentage: application.completionPercentage
    });

  } catch (error) {
    console.error("Error saving orientation checklist:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

// Get Orientation Checklist
router.get("/get-orientation-checklist/:applicationId", async (req, res) => {
  try {
    const { applicationId } = req.params;

    const orientationChecklist = await OrientationChecklist.findOne({ applicationId });
    
    if (!orientationChecklist) {
      return res.status(404).json({ message: "Orientation checklist not found" });
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
      employeeSignature: orientationChecklist.employeeSignature || '',
      employeeDate: orientationChecklist.employeeSignatureDate || null,
      agencySignature: orientationChecklist.agencySignature || '',
      agencyDate: orientationChecklist.agencySignatureDate || null,
      status: orientationChecklist.status || 'draft'
    };

    res.status(200).json({
      message: "Orientation checklist retrieved successfully",
      orientationChecklist: mappedData
    });

  } catch (error) {
    console.error("Error getting orientation checklist:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

module.exports = router;
