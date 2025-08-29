const express = require("express");
const EmergencyContact = require("../../database/Models/EmergencyContact");
const DirectDeposit = require("../../database/Models/DirectDeposit");
const BackgroundCheck = require("../../database/Models/BackgroundCheck");
const OnboardingApplication = require("../../database/Models/OnboardingApplication");

const router = express.Router();

// Save or update Emergency Contact form
router.post("/save-emergency-contact", async (req, res) => {
  try {
    const { applicationId, employeeId, formData, status = "draft" } = req.body;

    // Debug logging
    console.log("Emergency Contact Save Request:");
    console.log("- applicationId:", applicationId);
    console.log("- employeeId:", employeeId);
    console.log("- status parameter:", status);
    console.log("- formData keys:", Object.keys(formData));
    if (formData.status) {
      console.log("- WARNING: formData contains status field:", formData.status);
    }

    if (!applicationId || !employeeId) {
      return res.status(400).json({ message: "Application ID and Employee ID are required" });
    }

    // Check if application exists
    const application = await OnboardingApplication.findById(applicationId);
    if (!application) {
      return res.status(404).json({ message: "Onboarding application not found" });
    }

    // Find existing form or create new one
    let emergencyContactForm = await EmergencyContact.findOne({ applicationId });
    
    if (emergencyContactForm) {
      // Update existing form - ensure status parameter overrides any status in formData
      const { status: formDataStatus, ...cleanFormData } = formData;
      Object.assign(emergencyContactForm, cleanFormData);
      emergencyContactForm.status = status;
    } else {
      // Create new form - ensure status parameter overrides any status in formData
      const { status: formDataStatus, ...cleanFormData } = formData;
      emergencyContactForm = new EmergencyContact({
        applicationId,
        employeeId,
        ...cleanFormData,
        status
      });
    }

    await emergencyContactForm.save();

    // Update application progress
    if (status === "completed") {
      // Ensure completedForms array exists
      if (!application.completedForms) {
        application.completedForms = [];
      }
      
      // Check if Emergency Contact is already marked as completed
      if (!application.completedForms.includes("Emergency Contact")) {
        application.completedForms.push("Emergency Contact");
      }
      
      application.completionPercentage = application.calculateCompletionPercentage();
      await application.save();
    }

    const message = status === "draft" ? "Emergency contact form saved as draft" : "Emergency contact form completed";

    res.status(200).json({
      message,
      emergencyContact: emergencyContactForm,
      completionPercentage: application.completionPercentage
    });

  } catch (error) {
    console.error("Error saving emergency contact form:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

// Get Emergency Contact form
router.get("/get-emergency-contact/:applicationId", async (req, res) => {
  try {
    const { applicationId } = req.params;

    const emergencyContact = await EmergencyContact.findOne({ applicationId });
    
    if (!emergencyContact) {
      return res.status(404).json({ message: "Emergency contact form not found" });
    }

    res.status(200).json({
      message: "Emergency contact form retrieved successfully",
      emergencyContact
    });

  } catch (error) {
    console.error("Error getting emergency contact form:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

// Save or update Direct Deposit form
router.post("/save-direct-deposit", async (req, res) => {
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
    let directDepositForm = await DirectDeposit.findOne({ applicationId });
    
    if (directDepositForm) {
      // Update existing form - ensure status parameter overrides any status in formData
      const { status: formDataStatus, ...cleanFormData } = formData;
      Object.assign(directDepositForm, cleanFormData);
      directDepositForm.status = status;
    } else {
      // Create new form - ensure status parameter overrides any status in formData
      const { status: formDataStatus, ...cleanFormData } = formData;
      directDepositForm = new DirectDeposit({
        applicationId,
        employeeId,
        ...cleanFormData,
        status
      });
    }

    await directDepositForm.save();

    // Update application progress
    if (status === "completed") {
      // Ensure completedForms array exists
      if (!application.completedForms) {
        application.completedForms = [];
      }
      
      // Check if Direct Deposit is already marked as completed
      if (!application.completedForms.includes("Direct Deposit")) {
        application.completedForms.push("Direct Deposit");
      }
      
      application.completionPercentage = application.calculateCompletionPercentage();
      await application.save();
    }

    const message = status === "draft" ? "Direct deposit form saved as draft" : "Direct deposit form completed";

    res.status(200).json({
      message,
      directDeposit: directDepositForm,
      completionPercentage: application.completionPercentage
    });

  } catch (error) {
    console.error("Error saving direct deposit form:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

// Get Direct Deposit form
router.get("/get-direct-deposit/:applicationId", async (req, res) => {
  try {
    const { applicationId } = req.params;

    const directDeposit = await DirectDeposit.findOne({ applicationId });
    
    if (!directDeposit) {
      return res.status(404).json({ message: "Direct deposit form not found" });
    }

    res.status(200).json({
      message: "Direct deposit form retrieved successfully",
      directDeposit
    });

  } catch (error) {
    console.error("Error getting direct deposit form:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

// Get Direct Deposit form by ID
router.get("/get-direct-deposit-by-id/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const directDeposit = await DirectDeposit.findById(id);
    
    if (!directDeposit) {
      return res.status(404).json({ message: "Direct deposit form not found" });
    }

    res.status(200).json({
      message: "Direct deposit form retrieved successfully",
      directDeposit
    });

  } catch (error) {
    console.error("Error getting direct deposit form by ID:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

// Get Emergency Contact form by ID
router.get("/get-emergency-contact/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const emergencyContact = await EmergencyContact.findById(id);
    
    if (!emergencyContact) {
      return res.status(404).json({ message: "Emergency contact form not found" });
    }

    res.status(200).json({
      message: "Emergency contact form retrieved successfully",
      emergencyContact
    });

  } catch (error) {
    console.error("Error getting emergency contact form by ID:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

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

    // Validate formData structure
    if (!formData) {
      return res.status(400).json({ message: "Form data is required" });
    }

    // Find existing form or create new one
    let backgroundCheckForm = await BackgroundCheck.findOne({ applicationId });
    
    if (backgroundCheckForm) {
      // Update existing form
      backgroundCheckForm.applicantInfo = {
        lastName: formData.lastName,
        firstName: formData.firstName,
        middleInitial: formData.middleInitial,
        socialSecurityNumber: formData.socialSecurityNo,
        dateOfBirth: formData.dateOfBirth,
        height: formData.height,
        weight: formData.weight,
        sex: formData.sex,
        eyeColor: formData.eyeColor,
        hairColor: formData.hairColor,
        race: formData.race,
        address: {
          street: formData.streetAddress,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zip,
        },
      };
      backgroundCheckForm.employmentInfo = {
        provider: formData.provider,
        positionAppliedFor: formData.positionAppliedFor,
      };
      backgroundCheckForm.applicantSignature = formData.signature;
      backgroundCheckForm.applicantSignatureDate = formData.date;
      backgroundCheckForm.status = status;
    } else {
      // Create new form
      backgroundCheckForm = new BackgroundCheck({
        applicationId,
        employeeId,
        applicantInfo: {
          lastName: formData.lastName,
          firstName: formData.firstName,
          middleInitial: formData.middleInitial,
          socialSecurityNumber: formData.socialSecurityNo,
          dateOfBirth: formData.dateOfBirth,
          height: formData.height,
          weight: formData.weight,
          sex: formData.sex,
          eyeColor: formData.eyeColor,
          hairColor: formData.hairColor,
          race: formData.race,
          address: {
            street: formData.streetAddress,
            city: formData.city,
            state: formData.state,
            zipCode: formData.zip,
          },
        },
        employmentInfo: {
          provider: formData.provider,
          positionAppliedFor: formData.positionAppliedFor,
        },
        applicantSignature: formData.signature,
        applicantSignatureDate: formData.date,
        status
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
        await application.save();
      }
    }

    res.status(200).json({
      message: "Background check form saved successfully",
      backgroundCheck: backgroundCheckForm
    });

  } catch (error) {
    console.error("Error saving background check form:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

// Get Background Check form by ID
router.get("/get-background-check-by-id/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const backgroundCheck = await BackgroundCheck.findById(id);
    
    if (!backgroundCheck) {
      return res.status(404).json({ message: "Background check form not found" });
    }

    // Transform the data to match frontend format
    const formData = {
      lastName: backgroundCheck.applicantInfo?.lastName || "",
      firstName: backgroundCheck.applicantInfo?.firstName || "",
      middleInitial: backgroundCheck.applicantInfo?.middleInitial || "",
      socialSecurityNo: backgroundCheck.applicantInfo?.socialSecurityNumber || "",
      height: backgroundCheck.applicantInfo?.height || "",
      weight: backgroundCheck.applicantInfo?.weight || "",
      eyeColor: backgroundCheck.applicantInfo?.eyeColor || "",
      hairColor: backgroundCheck.applicantInfo?.hairColor || "",
      dateOfBirth: backgroundCheck.applicantInfo?.dateOfBirth || new Date(),
      sex: backgroundCheck.applicantInfo?.sex || "",
      race: backgroundCheck.applicantInfo?.race || "",
      streetAddress: backgroundCheck.applicantInfo?.address?.street || "",
      city: backgroundCheck.applicantInfo?.address?.city || "",
      state: backgroundCheck.applicantInfo?.address?.state || "",
      zip: backgroundCheck.applicantInfo?.address?.zipCode || "",
      provider: backgroundCheck.employmentInfo?.provider || "",
      positionAppliedFor: backgroundCheck.employmentInfo?.positionAppliedFor || "",
      signature: backgroundCheck.applicantSignature || "",
      date: backgroundCheck.applicantSignatureDate || new Date(),
    };

    res.status(200).json({
      message: "Background check form retrieved successfully",
      backgroundCheck: {
        ...backgroundCheck.toObject(),
        formData
      }
    });

  } catch (error) {
    console.error("Error getting background check form by ID:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

module.exports = router;
