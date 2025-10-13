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

    const application = await OnboardingApplication.findById(applicationId);
    if (!application) {
      return res.status(404).json({ message: "Onboarding application not found" });
    }

    // =========== FIX STARTS HERE ===========
    // Manually map flat formData from the frontend to the nested schema structure.
    // Note: Employment Application does NOT include background check physical fields
    // (height, weight, eyeColor, hairColor, etc.) - those are only in Background Check form
    const mappedData = {
      applicantInfo: {
        firstName: formData.firstName,
        middleName: formData.middleName,
        lastName: formData.lastName,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zip: formData.zip,
        phone: formData.phone,
        email: formData.email,
        ssn: formData.ssn,
        positionApplied: formData.positionApplied,
        desiredSalary: formData.desiredSalary,
        dateAvailable: formData.dateAvailable,
        employmentType: formData.employmentType,
        citizenOfUS: formData.citizenOfUS,
        authorizedToWork: formData.authorizedToWork,
        workedForCompanyBefore: formData.workedForCompanyBefore,
        convictedOfFelony: formData.convictedOfFelony,
        felonyExplanation: formData.felonyExplanation,
        // NOTE: Background check physical fields (height, weight, etc.) are NOT included here
        // They are stored separately in the Background Check form only
      },
      education: formData.education,
      references: formData.references,
      previousEmployments: formData.previousEmployments,
      militaryService: formData.militaryService,
      signature: formData.signature,
      date: formData.date,
      status: status,
    };
    // =========== FIX ENDS HERE ===========

    let employmentApp = await EmploymentApplication.findOne({ applicationId });

    if (employmentApp) {
      // Update existing form by deep merging the new mapped data
      employmentApp.set(mappedData);
    } else {
      // Create new form with the correctly mapped data
      employmentApp = new EmploymentApplication({
        applicationId,
        employeeId,
        ...mappedData,
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

    console.log("🟡 GET Employment Application - Raw data from DB:", {
      id: employmentApp._id,
      applicantInfoKeys: employmentApp.applicantInfo ? Object.keys(employmentApp.applicantInfo) : [],
      applicantInfo: employmentApp.applicantInfo,
      hasBackgroundFields: {
        height: !!employmentApp.applicantInfo?.height,
        weight: !!employmentApp.applicantInfo?.weight,
        eyeColor: !!employmentApp.applicantInfo?.eyeColor,
        hairColor: !!employmentApp.applicantInfo?.hairColor,
        dateOfBirth: !!employmentApp.applicantInfo?.dateOfBirth,
        sex: !!employmentApp.applicantInfo?.sex,
        race: !!employmentApp.applicantInfo?.race,
      }
    });

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

    console.log("🟢 GET Employment Application - Returning flattened data:", {
      hasApplicantInfo: !!flattenedApp.applicantInfo,
      backgroundFields: {
        height: flattenedApp.applicantInfo?.height || "NOT SET",
        weight: flattenedApp.applicantInfo?.weight || "NOT SET",
        eyeColor: flattenedApp.applicantInfo?.eyeColor || "NOT SET",
        hairColor: flattenedApp.applicantInfo?.hairColor || "NOT SET",
        dateOfBirth: flattenedApp.applicantInfo?.dateOfBirth || "NOT SET",
        sex: flattenedApp.applicantInfo?.sex || "NOT SET",
        race: flattenedApp.applicantInfo?.race || "NOT SET",
      }
    });

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
