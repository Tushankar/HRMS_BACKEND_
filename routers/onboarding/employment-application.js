const express = require("express");
const EmploymentApplication = require("../../database/Models/EmploymentApplication");
const OnboardingApplication = require("../../database/Models/OnboardingApplication");

const router = express.Router();

// Save or update employment application
router.post("/save-employment-application", async (req, res) => {
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
    let employmentApp = await EmploymentApplication.findOne({ applicationId });
    
    if (employmentApp) {
      // Update existing form
      Object.assign(employmentApp, formData);
      employmentApp.status = status;
    } else {
      // Create new form
      employmentApp = new EmploymentApplication({
        applicationId,
        employeeId,
        ...formData,
        status
      });
    }

    await employmentApp.save();

    // Update application progress
    if (status === "completed") {
      // Ensure completedForms array exists
      if (!application.completedForms) {
        application.completedForms = [];
      }
      
      // Check if Employment Application is already marked as completed
      if (!application.completedForms.includes("Employment Application")) {
        application.completedForms.push("Employment Application");
      }
      
      application.completionPercentage = application.calculateCompletionPercentage();
      await application.save();
    }

    const message = status === "draft" ? "Employment application saved as draft" : "Employment application completed";

    res.status(200).json({
      message,
      employmentApplication: employmentApp,
      completionPercentage: application.completionPercentage
    });

  } catch (error) {
    console.error("Error saving employment application:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

// Get employment application
router.get("/get-employment-application/:applicationId", async (req, res) => {
  try {
    const { applicationId } = req.params;

    const employmentApp = await EmploymentApplication.findOne({ applicationId });
    
    if (!employmentApp) {
      return res.status(404).json({ message: "Employment application not found" });
    }

    // The employment application model already matches frontend structure
    // Just return the data as-is, no flattening needed
    const flattenedApp = {
      _id: employmentApp._id,
      applicationId: employmentApp.applicationId,
      employeeId: employmentApp.employeeId,
      applicantInfo: employmentApp.applicantInfo || {},
      education: employmentApp.education || {},
      references: employmentApp.references || [],
      previousEmployments: employmentApp.previousEmployments || [], // This is the correct field
      militaryService: employmentApp.militaryService || {},
      legalQuestions: employmentApp.legalQuestions || {},
      signature: employmentApp.signature || '',
      signatureDate: employmentApp.signatureDate || null,
      date: employmentApp.date || null,
      status: employmentApp.status || 'draft',
      createdAt: employmentApp.createdAt,
      updatedAt: employmentApp.updatedAt
    };

    res.status(200).json({
      message: "Employment application retrieved successfully",
      employmentApplication: flattenedApp
    });

  } catch (error) {
    console.error("Error getting employment application:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

module.exports = router;
