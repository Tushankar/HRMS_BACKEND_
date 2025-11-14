const express = require("express");
const EmergencyContact = require("../../database/Models/EmergencyContact");
const EmergencyContactTemplate = require("../../database/Models/EmergencyContactTemplate");
const DirectDeposit = require("../../database/Models/DirectDeposit");
const BackgroundCheck = require("../../database/Models/BackgroundCheck");
const PersonalInformation = require("../../database/Models/PersonalInformation");
const ProfessionalExperience = require("../../database/Models/ProfessionalExperience");
const WorkExperience = require("../../database/Models/WorkExperience");
const OrientationChecklist = require("../../database/Models/OrientationChecklist");
const OnboardingApplication = require("../../database/Models/OnboardingApplication");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

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
      console.log(
        "- WARNING: formData contains status field:",
        formData.status
      );
    }

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

    // Find existing form or create new one
    let emergencyContactForm = await EmergencyContact.findOne({
      applicationId,
    });

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
        status,
      });
    }

    await emergencyContactForm.save();

    // Update application progress
    if (status === "submitted" || status === "completed") {
      // Ensure completedForms array exists
      if (!application.completedForms) {
        application.completedForms = [];
      }

      // Check if Emergency Contact is already marked as completed
      if (!application.completedForms.includes("emergencyContact")) {
        application.completedForms.push("emergencyContact");
      }

      application.completionPercentage =
        application.calculateCompletionPercentage();
      await application.save();
    }

    const message =
      status === "draft"
        ? "Emergency contact form saved as draft"
        : "Emergency contact form submitted successfully";

    res.status(200).json({
      success: true,
      message,
      emergencyContact: emergencyContactForm,
      completionPercentage: application.completionPercentage,
    });
  } catch (error) {
    console.error("Error saving emergency contact form:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
});

// Get Emergency Contact form
router.get("/get-emergency-contact/:applicationId", async (req, res) => {
  try {
    const { applicationId } = req.params;

    const emergencyContact = await EmergencyContact.findOne({ applicationId });

    if (!emergencyContact) {
      return res
        .status(404)
        .json({ message: "Emergency contact form not found" });
    }

    res.status(200).json({
      message: "Emergency contact form retrieved successfully",
      emergencyContact,
    });
  } catch (error) {
    console.error("Error getting emergency contact form:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
});

// Save or update Direct Deposit form
router.post("/save-direct-deposit", async (req, res) => {
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
        status,
      });
    }

    await directDepositForm.save();

    // Update application progress
    if (status === "submitted" || status === "completed") {
      // Ensure completedForms array exists
      if (!application.completedForms) {
        application.completedForms = [];
      }

      // Check if Direct Deposit is already marked as completed
      if (!application.completedForms.includes("directDeposit")) {
        application.completedForms.push("directDeposit");
      }

      application.completionPercentage =
        application.calculateCompletionPercentage();
      await application.save();
    }

    const message =
      status === "draft"
        ? "Direct deposit form saved as draft"
        : "Direct deposit form submitted successfully";

    res.status(200).json({
      message,
      directDeposit: directDepositForm,
      completionPercentage: application.completionPercentage,
    });
  } catch (error) {
    console.error("Error saving direct deposit form:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
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
      directDeposit,
    });
  } catch (error) {
    console.error("Error getting direct deposit form:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
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
      directDeposit,
    });
  } catch (error) {
    console.error("Error getting direct deposit form by ID:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
});

// Get Emergency Contact form by ID
router.get("/get-emergency-contact/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const emergencyContact = await EmergencyContact.findById(id);

    if (!emergencyContact) {
      return res
        .status(404)
        .json({ message: "Emergency contact form not found" });
    }

    res.status(200).json({
      message: "Emergency contact form retrieved successfully",
      emergencyContact,
    });
  } catch (error) {
    console.error("Error getting emergency contact form by ID:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
});

// Background Check route moved to screening-forms.js

// Get Background Check form by ID
router.get("/get-background-check-by-id/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const backgroundCheck = await BackgroundCheck.findById(id);

    if (!backgroundCheck) {
      return res
        .status(404)
        .json({ message: "Background check form not found" });
    }

    // Transform the data to match frontend format
    const formData = {
      lastName: backgroundCheck.applicantInfo?.lastName || "",
      firstName: backgroundCheck.applicantInfo?.firstName || "",
      middleInitial: backgroundCheck.applicantInfo?.middleInitial || "",
      socialSecurityNo:
        backgroundCheck.applicantInfo?.socialSecurityNumber || "",
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
      positionAppliedFor:
        backgroundCheck.employmentInfo?.positionAppliedFor || "",
      signature: backgroundCheck.applicantSignature || "",
      date: backgroundCheck.applicantSignatureDate || new Date(),
    };

    res.status(200).json({
      message: "Background check form retrieved successfully",
      backgroundCheck: {
        ...backgroundCheck.toObject(),
        formData,
      },
    });
  } catch (error) {
    console.error("Error getting background check form by ID:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
});

// Save or update Personal Information form
router.post("/save-personal-information", async (req, res) => {
  try {
    const { applicationId, employeeId, formData, status = "draft" } = req.body;

    if (!applicationId) {
      return res.status(400).json({ message: "Application ID is required" });
    }

    // Check if application exists
    const application = await OnboardingApplication.findById(applicationId);
    if (!application) {
      return res
        .status(404)
        .json({ message: "Onboarding application not found" });
    }

    // Find existing form or create new one
    let personalInfoForm = await PersonalInformation.findOne({ applicationId });

    if (personalInfoForm) {
      // Update existing form - ensure status parameter overrides any status in formData
      const { status: formDataStatus, ...cleanFormData } = formData;
      Object.assign(personalInfoForm, cleanFormData);
      personalInfoForm.status = status;
      // Update employeeId if provided and valid
      if (employeeId && employeeId.length === 24) {
        personalInfoForm.employeeId = employeeId;
      }
    } else {
      // Create new form - ensure status parameter overrides any status in formData
      const { status: formDataStatus, ...cleanFormData } = formData;
      const formPayload = {
        applicationId,
        ...cleanFormData,
        status,
      };
      // Only add employeeId if it's valid
      if (employeeId && employeeId.length === 24) {
        formPayload.employeeId = employeeId;
      }
      personalInfoForm = new PersonalInformation(formPayload);
    }

    // Use validateBeforeSave: false for draft to skip validation
    await personalInfoForm.save({ validateBeforeSave: status !== "draft" });

    // Update application progress
    if (status === "completed") {
      // Ensure completedForms array exists
      if (!application.completedForms) {
        application.completedForms = [];
      }

      // Check if Personal Information is already marked as completed
      if (!application.completedForms.includes("Personal Information")) {
        application.completedForms.push("Personal Information");
      }

      application.completionPercentage =
        application.calculateCompletionPercentage();
      await application.save();
    }

    const message =
      status === "draft"
        ? "Personal information saved as draft"
        : "Personal information completed";

    res.status(200).json({
      message,
      personalInformation: personalInfoForm,
      completionPercentage: application.completionPercentage,
    });
  } catch (error) {
    console.error("Error saving personal information form:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
});

// Get Personal Information form
router.get("/get-personal-information/:applicationId", async (req, res) => {
  try {
    const { applicationId } = req.params;

    const personalInformation = await PersonalInformation.findOne({
      applicationId,
    });

    if (!personalInformation) {
      return res
        .status(404)
        .json({ message: "Personal information form not found" });
    }

    res.status(200).json({
      message: "Personal information form retrieved successfully",
      personalInformation,
    });
  } catch (error) {
    console.error("Error getting personal information form:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
});

// Get Personal Information form by ID
router.get("/get-personal-information-by-id/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const personalInformation = await PersonalInformation.findById(id);

    if (!personalInformation) {
      return res
        .status(404)
        .json({ message: "Personal information form not found" });
    }

    res.status(200).json({
      message: "Personal information form retrieved successfully",
      personalInformation,
    });
  } catch (error) {
    console.error("Error getting personal information form by ID:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
});

// Save or update Professional Experience form
router.post("/save-professional-experience", async (req, res) => {
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

    // Convert hasMilitaryService from string to boolean
    let cleanFormData = { ...formData };
    if (cleanFormData.hasMilitaryService) {
      cleanFormData.hasMilitaryService =
        cleanFormData.hasMilitaryService === "YES" ? true : false;
    }

    // Find existing form or create new one
    let professionalExpForm = await ProfessionalExperience.findOne({
      applicationId,
    });

    if (professionalExpForm) {
      // Update existing form - ensure status parameter overrides any status in formData
      const { status: formDataStatus, ...formDataWithoutStatus } =
        cleanFormData;
      Object.assign(professionalExpForm, formDataWithoutStatus);
      professionalExpForm.status = status;
    } else {
      // Create new form - ensure status parameter overrides any status in formData
      const { status: formDataStatus, ...formDataWithoutStatus } =
        cleanFormData;
      professionalExpForm = new ProfessionalExperience({
        applicationId,
        employeeId,
        ...formDataWithoutStatus,
        status,
      });
    }

    // Use validateBeforeSave: false for draft to skip validation
    await professionalExpForm.save({ validateBeforeSave: status !== "draft" });

    // Update application progress
    if (status === "completed") {
      // Ensure completedForms array exists
      if (!application.completedForms) {
        application.completedForms = [];
      }

      // Check if Professional Experience is already marked as completed
      if (!application.completedForms.includes("Professional Experience")) {
        application.completedForms.push("Professional Experience");
      }

      // Update application status to reflect form completion
      application.applicationStatus = "completed";

      application.completionPercentage =
        application.calculateCompletionPercentage();
      await application.save();
    }

    const message =
      status === "draft"
        ? "Professional experience saved as draft"
        : "Professional experience completed";

    res.status(200).json({
      message,
      professionalExperience: professionalExpForm,
      completionPercentage: application.completionPercentage,
    });
  } catch (error) {
    console.error("Error saving professional experience form:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
});

// Get Professional Experience form
router.get("/get-professional-experience/:applicationId", async (req, res) => {
  try {
    const { applicationId } = req.params;

    const professionalExperience = await ProfessionalExperience.findOne({
      applicationId,
    });

    if (!professionalExperience) {
      return res
        .status(404)
        .json({ message: "Professional experience form not found" });
    }

    res.status(200).json({
      message: "Professional experience form retrieved successfully",
      professionalExperience,
    });
  } catch (error) {
    console.error("Error getting professional experience form:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
});

// Get Professional Experience form by ID
router.get("/get-professional-experience-by-id/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const professionalExperience = await ProfessionalExperience.findById(id);

    if (!professionalExperience) {
      return res
        .status(404)
        .json({ message: "Professional experience form not found" });
    }

    res.status(200).json({
      message: "Professional experience form retrieved successfully",
      professionalExperience,
    });
  } catch (error) {
    console.error("Error getting professional experience form by ID:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
});

// Save or update Work Experience form
router.post("/save-work-experience", async (req, res) => {
  try {
    const {
      applicationId,
      employeeId,
      formData,
      status = "draft",
      workExperiences,
      hrFeedback,
    } = req.body;

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

    // Find existing form or create new one
    let workExperienceForm = await WorkExperience.findOne({ applicationId });

    // Determine if this is an HR feedback-only update
    const isHRFeedbackOnly =
      hrFeedback !== undefined &&
      workExperiences === undefined &&
      formData === undefined;

    // Handle HR notes submission (when hrFeedback is sent)
    if (hrFeedback !== undefined) {
      if (!workExperienceForm) {
        return res
          .status(404)
          .json({
            message:
              "Work experience form not found. Cannot add HR notes to non-existent form.",
          });
      }

      // Update HR feedback
      workExperienceForm.hrFeedback = hrFeedback;

      // Only update workExperiences if provided (not for HR notes only)
      if (workExperiences !== undefined) {
        workExperienceForm.workExperiences = workExperiences;
      }

      // Update status
      workExperienceForm.status = status;
    }
    // Handle regular form submission (when formData is sent)
    else if (formData) {
      if (workExperienceForm) {
        // Update existing form - ensure status parameter overrides any status in formData
        const { status: formDataStatus, ...cleanFormData } = formData;
        Object.assign(workExperienceForm, cleanFormData);
        workExperienceForm.status = status;
      } else {
        // Create new form - ensure status parameter overrides any status in formData
        const { status: formDataStatus, ...cleanFormData } = formData;
        workExperienceForm = new WorkExperience({
          applicationId,
          employeeId,
          ...cleanFormData,
          status,
        });
      }
    } else if (workExperiences !== undefined) {
      // Handle workExperiences update without HR feedback
      if (!workExperienceForm) {
        workExperienceForm = new WorkExperience({
          applicationId,
          employeeId,
          workExperiences,
          status,
        });
      } else {
        workExperienceForm.workExperiences = workExperiences;
        workExperienceForm.status = status;
      }
    } else {
      return res
        .status(400)
        .json({
          message:
            "Either formData, workExperiences, or hrFeedback must be provided",
        });
    }

    // Skip validation if only updating HR feedback
    await workExperienceForm.save({ validateBeforeSave: !isHRFeedbackOnly });

    // Update application progress
    if (status === "completed") {
      // Ensure completedForms array exists
      if (!application.completedForms) {
        application.completedForms = [];
      }

      // Check if Work Experience is already marked as completed
      if (!application.completedForms.includes("Work Experience")) {
        application.completedForms.push("Work Experience");
      }

      application.completionPercentage =
        application.calculateCompletionPercentage();
      await application.save();
    }

    const message =
      status === "draft"
        ? "Work experience saved as draft"
        : status === "under_review"
        ? "Work experience sent for review"
        : "Work experience completed";

    res.status(200).json({
      message,
      workExperience: workExperienceForm,
      completionPercentage: application.completionPercentage,
    });
  } catch (error) {
    console.error("Error saving work experience form:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
});

// Get Work Experience form
router.get("/get-work-experience/:applicationId", async (req, res) => {
  try {
    const { applicationId } = req.params;

    const workExperience = await WorkExperience.findOne({ applicationId });

    if (!workExperience) {
      return res
        .status(404)
        .json({ message: "Work experience form not found" });
    }

    res.status(200).json({
      message: "Work experience form retrieved successfully",
      workExperience,
    });
  } catch (error) {
    console.error("Error getting work experience form:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
});

// Get Work Experience form by ID
router.get("/get-work-experience-by-id/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const workExperience = await WorkExperience.findById(id);

    if (!workExperience) {
      return res
        .status(404)
        .json({ message: "Work experience form not found" });
    }

    res.status(200).json({
      message: "Work experience form retrieved successfully",
      workExperience,
    });
  } catch (error) {
    console.error("Error getting work experience form by ID:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
});

// Save or update Orientation Checklist form
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

    // Find existing form or create new one
    let orientationChecklistForm = await OrientationChecklist.findOne({
      applicationId,
    });

    if (orientationChecklistForm) {
      // Update existing form - ensure status parameter overrides any status in formData
      const { status: formDataStatus, ...cleanFormData } = formData;
      Object.assign(orientationChecklistForm, cleanFormData);
      orientationChecklistForm.status = status;
    } else {
      // Create new form - ensure status parameter overrides any status in formData
      const { status: formDataStatus, ...cleanFormData } = formData;
      orientationChecklistForm = new OrientationChecklist({
        applicationId,
        employeeId,
        ...cleanFormData,
        status,
      });
    }

    await orientationChecklistForm.save();

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
      orientationChecklist: orientationChecklistForm,
      completionPercentage: application.completionPercentage,
    });
  } catch (error) {
    console.error("Error saving orientation checklist form:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
});

// Get Orientation Checklist form
router.get("/get-orientation-checklist/:applicationId", async (req, res) => {
  try {
    const { applicationId } = req.params;

    const orientationChecklist = await OrientationChecklist.findOne({
      applicationId,
    });

    if (!orientationChecklist) {
      return res
        .status(404)
        .json({ message: "Orientation checklist form not found" });
    }

    res.status(200).json({
      message: "Orientation checklist form retrieved successfully",
      orientationChecklist,
    });
  } catch (error) {
    console.error("Error getting orientation checklist form:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
});

// =============== EMERGENCY CONTACT TEMPLATE & UPLOAD ENDPOINTS ===============

// Multer configuration for Emergency Contact uploads
const emergencyContactStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../../uploads/emergency-contact");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      "emergency-contact-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const emergencyContactUpload = multer({
  storage: emergencyContactStorage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// HR Upload Emergency Contact Template
router.post(
  "/hr-upload-emergency-contact-template",
  emergencyContactUpload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Deactivate all previous templates
      await EmergencyContactTemplate.updateMany({}, { isActive: false });

      // Create new template
      const template = new EmergencyContactTemplate({
        filename: req.file.filename,
        filePath: `uploads/emergency-contact/${req.file.filename}`,
        uploadedBy: req.body.uploadedBy || req.user?._id,
        isActive: true,
      });

      await template.save();

      res.status(200).json({
        message: "Emergency Contact template uploaded successfully",
        template,
      });
    } catch (error) {
      console.error("Error uploading Emergency Contact template:", error);
      res.status(500).json({
        message: "Failed to upload template",
        error: error.message,
      });
    }
  }
);

// Get Active Emergency Contact Template
router.get("/get-emergency-contact-template", async (req, res) => {
  try {
    const template = await EmergencyContactTemplate.findOne({
      isActive: true,
    }).sort({
      createdAt: -1,
    });

    if (!template) {
      return res.status(404).json({ message: "No active template found" });
    }

    res.status(200).json({
      message: "Template retrieved successfully",
      template,
    });
  } catch (error) {
    console.error("Error fetching Emergency Contact template:", error);
    res.status(500).json({
      message: "Failed to fetch template",
      error: error.message,
    });
  }
});

// Employee Upload Signed Emergency Contact
router.post(
  "/employee-upload-signed-emergency-contact",
  emergencyContactUpload.single("file"),
  async (req, res) => {
    try {
      const { applicationId, employeeId } = req.body;

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      if (!applicationId || !employeeId) {
        return res.status(400).json({
          message: "Application ID and Employee ID are required",
        });
      }

      // Find or create the Emergency Contact form
      let emergencyContact = await EmergencyContact.findOne({ applicationId });

      if (!emergencyContact) {
        emergencyContact = new EmergencyContact({
          applicationId,
          employeeId,
          status: "submitted",
        });
      } else {
        // Delete old file if exists
        if (emergencyContact.employeeUploadedForm?.filePath) {
          const oldFilePath = path.join(
            __dirname,
            "../../",
            emergencyContact.employeeUploadedForm.filePath
          );
          if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
          }
        }
        emergencyContact.status = "submitted";
      }

      // Save new file info
      emergencyContact.employeeUploadedForm = {
        filename: req.file.filename,
        filePath: `uploads/emergency-contact/${req.file.filename}`,
        uploadedAt: new Date(),
      };

      await emergencyContact.save();

      // Update application
      const application = await OnboardingApplication.findById(applicationId);
      if (application) {
        application.forms.emergencyContact = emergencyContact._id;
        if (!application.completedForms.includes("emergencyContact")) {
          application.completedForms.push("emergencyContact");
        }
        await application.save();
      }

      res.status(200).json({
        message: "Emergency Contact form uploaded successfully",
        emergencyContact,
      });
    } catch (error) {
      console.error("Error uploading Emergency Contact:", error);
      res.status(500).json({
        message: "Failed to upload form",
        error: error.message,
      });
    }
  }
);

// Remove Emergency Contact Upload
router.post("/remove-emergency-contact-upload", async (req, res) => {
  try {
    const { applicationId, employeeId } = req.body;

    if (!applicationId || !employeeId) {
      return res.status(400).json({
        message: "Application ID and Employee ID are required",
      });
    }

    const emergencyContact = await EmergencyContact.findOne({ applicationId });

    if (!emergencyContact) {
      return res
        .status(404)
        .json({ message: "Emergency Contact form not found" });
    }

    // Delete file from filesystem
    if (emergencyContact.employeeUploadedForm?.filePath) {
      const filePath = path.join(
        __dirname,
        "../../",
        emergencyContact.employeeUploadedForm.filePath
      );
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // Clear upload data and reset status
    emergencyContact.employeeUploadedForm = undefined;
    emergencyContact.status = "draft";
    await emergencyContact.save();

    // Update application
    const application = await OnboardingApplication.findById(applicationId);
    if (application) {
      application.completedForms = application.completedForms.filter(
        (form) => form !== "emergencyContact"
      );
      await application.save();
    }

    res.status(200).json({
      message: "Upload removed successfully",
      emergencyContact,
    });
  } catch (error) {
    console.error("Error removing Emergency Contact upload:", error);
    res.status(500).json({
      message: "Failed to remove upload",
      error: error.message,
    });
  }
});

// HR Get All Emergency Contact Submissions
router.get("/hr-get-all-emergency-contact-submissions", async (req, res) => {
  try {
    const submissions = await EmergencyContact.find({
      "employeeUploadedForm.filename": { $exists: true },
    })
      .populate("employeeId", "name email")
      .populate("applicationId")
      .sort({ "employeeUploadedForm.uploadedAt": -1 });

    res.status(200).json({
      message: "Emergency Contact submissions retrieved successfully",
      submissions,
    });
  } catch (error) {
    console.error("Error fetching Emergency Contact submissions:", error);
    res.status(500).json({
      message: "Failed to fetch submissions",
      error: error.message,
    });
  }
});

// Get Single Emergency Contact Submission
router.get("/get-emergency-contact-submission/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const submission = await EmergencyContact.findById(id)
      .populate("employeeId", "name email")
      .populate("applicationId");

    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    res.status(200).json({
      message: "Submission retrieved successfully",
      submission,
    });
  } catch (error) {
    console.error("Error fetching Emergency Contact submission:", error);
    res.status(500).json({
      message: "Failed to fetch submission",
      error: error.message,
    });
  }
});

// HR Clear Emergency Contact Submission
router.delete(
  "/hr-clear-emergency-contact-submission/:id",
  async (req, res) => {
    try {
      const { id } = req.params;

      const submission = await EmergencyContact.findById(id);

      if (!submission) {
        return res.status(404).json({ message: "Submission not found" });
      }

      // Delete file from filesystem
      if (submission.employeeUploadedForm?.filePath) {
        const filePath = path.join(
          __dirname,
          "../../",
          submission.employeeUploadedForm.filePath
        );
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      // Clear upload data
      submission.employeeUploadedForm = undefined;
      submission.status = "draft";
      await submission.save();

      // Update application
      if (submission.applicationId) {
        const application = await OnboardingApplication.findById(
          submission.applicationId
        );
        if (application) {
          application.completedForms = application.completedForms.filter(
            (form) => form !== "emergencyContact"
          );
          await application.save();
        }
      }

      res.status(200).json({
        message: "Submission cleared successfully",
        submission,
      });
    } catch (error) {
      console.error("Error clearing Emergency Contact submission:", error);
      res.status(500).json({
        message: "Failed to clear submission",
        error: error.message,
      });
    }
  }
);

module.exports = router;
