const express = require("express");
const fs = require("fs");
const BackgroundCheck = require("../../database/Models/BackgroundCheck");
const BackgroundCheckTemplate = require("../../database/Models/BackgroundCheckTemplate");
const TBSymptomScreen = require("../../database/Models/TBSymptomScreen");
const OrientationChecklist = require("../../database/Models/OrientationChecklist");
const OnboardingApplication = require("../../database/Models/OnboardingApplication");
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

const router = express.Router();

console.error("\n\n🔥🔥🔥 SCREENING-FORMS.JS LOADED 🔥🔥🔥\n\n");

// Test endpoint
router.post("/test-bg", (req, res) => {
  console.error("TEST ENDPOINT HIT");
  res.json({ test: "working", body: req.body });
});

// Get active Background Check template
router.get("/get-background-check-template", async (req, res) => {
  try {
    const template = await BackgroundCheckTemplate.findOne({
      isActive: true,
    }).sort({ createdAt: -1 });

    if (!template) {
      return res.status(404).json({ message: "No template found" });
    }

    res.status(200).json({
      message: "Template retrieved successfully",
      template,
    });
  } catch (error) {
    console.error("Error getting template:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
});

// HR upload Background Check template
router.post(
  "/hr-upload-background-check-template",
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const { uploadedBy } = req.body;

      // Deactivate previous templates
      await BackgroundCheckTemplate.updateMany({}, { isActive: false });

      // Create new template
      const template = new BackgroundCheckTemplate({
        filename: req.file.originalname,
        filePath: req.file.path,
        uploadedBy: uploadedBy || null,
        isActive: true,
      });

      await template.save();

      res.status(200).json({
        message: "Background Check template uploaded successfully",
        template,
      });
    } catch (error) {
      console.error("Error uploading template:", error);
      res
        .status(500)
        .json({ message: "Internal server error", error: error.message });
    }
  }
);

// Save or update Background Check form
router.post(
  "/save-background-check",
  (req, res, next) => {
    console.error("!!!!! ENDPOINT HIT !!!!!");
    next();
  },
  async (req, res) => {
    console.error("\n\n=== BACKGROUND CHECK ENDPOINT HIT ===");
    console.log("Request received at:", new Date().toISOString());
    console.log("Request body keys:", Object.keys(req.body));
    console.log("Request body:", JSON.stringify(req.body, null, 2));

    try {
      const {
        applicationId,
        employeeId,
        formData,
        status = "draft",
        hrFeedback,
      } = req.body;

      console.log("Parsed values:");
      console.log("- applicationId:", applicationId);
      console.log("- employeeId:", employeeId);
      console.log("- formData:", !!formData);
      console.log("- hrFeedback:", hrFeedback);
      console.log("- status:", status);

      // Handle HR notes submission - check if hrFeedback exists and has content
      console.log("Checking hrFeedback:", hrFeedback);
      console.log("hrFeedback exists?", !!hrFeedback);
      console.log("hrFeedback.comment?", hrFeedback?.comment);
      console.log("hrFeedback.reviewedAt?", hrFeedback?.reviewedAt);

      if (hrFeedback && hrFeedback.comment) {
        console.log("HR feedback condition matched - processing HR notes");
        let appId = applicationId;
        if (!appId || !appId.match(/^[0-9a-fA-F]{24}$/)) {
          if (!employeeId) {
            return res.status(400).json({
              success: false,
              message: "Employee ID is required for HR feedback",
            });
          }
          let application = await OnboardingApplication.findOne({ employeeId });
          if (!application) {
            return res
              .status(404)
              .json({ success: false, message: "Application not found" });
          }
          appId = application._id;
        }

        // Use findOneAndUpdate with upsert like other forms
        const updateData = {
          status: status || "under_review",
          hrFeedback: hrFeedback,
        };

        if (!applicationId || !applicationId.match(/^[0-9a-fA-F]{24}$/)) {
          // Only set employeeId if we're creating a new document
          updateData.employeeId = employeeId;
        }

        const backgroundCheck = await BackgroundCheck.findOneAndUpdate(
          { applicationId: appId },
          updateData,
          { new: true, upsert: true, validateBeforeSave: false }
        );

        return res.status(200).json({
          success: true,
          backgroundCheck: backgroundCheck,
          message: "HR feedback saved successfully",
        });
      }

      if (!applicationId && !employeeId) {
        return res
          .status(400)
          .json({ message: "Application ID or Employee ID is required" });
      }

      if (!formData) {
        return res.status(400).json({
          message: "Form data is required",
          debug: {
            receivedKeys: Object.keys(req.body),
            applicationId: applicationId,
            employeeId: employeeId,
            hasFormData: !!formData,
            hasHrFeedback: !!hrFeedback,
            hrFeedbackContent: hrFeedback,
            status: status,
          },
        });
      }

      const application = await OnboardingApplication.findById(applicationId);
      if (!application) {
        return res
          .status(404)
          .json({ message: "Onboarding application not found" });
      }

      let backgroundCheckForm = await BackgroundCheck.findOne({
        applicationId,
      });

      if (backgroundCheckForm) {
        if (formData.applicantInfo) {
          const existingAddress =
            backgroundCheckForm.applicantInfo?.address || {};
          const incomingAddress = formData.applicantInfo.address || {};

          const mergedApplicantInfo = {
            lastName:
              formData.applicantInfo.lastName ??
              backgroundCheckForm.applicantInfo?.lastName ??
              "",
            firstName:
              formData.applicantInfo.firstName ??
              backgroundCheckForm.applicantInfo?.firstName ??
              "",
            middleInitial:
              formData.applicantInfo.middleInitial ??
              backgroundCheckForm.applicantInfo?.middleInitial ??
              "",
            socialSecurityNumber:
              formData.applicantInfo.socialSecurityNumber ??
              backgroundCheckForm.applicantInfo?.socialSecurityNumber ??
              "",
            height:
              formData.applicantInfo.height ??
              backgroundCheckForm.applicantInfo?.height ??
              "",
            weight:
              formData.applicantInfo.weight ??
              backgroundCheckForm.applicantInfo?.weight ??
              "",
            eyeColor:
              formData.applicantInfo.eyeColor ??
              backgroundCheckForm.applicantInfo?.eyeColor ??
              "",
            hairColor:
              formData.applicantInfo.hairColor ??
              backgroundCheckForm.applicantInfo?.hairColor ??
              "",
            dateOfBirth:
              formData.applicantInfo.dateOfBirth ??
              backgroundCheckForm.applicantInfo?.dateOfBirth ??
              null,
            sex:
              formData.applicantInfo.sex ??
              backgroundCheckForm.applicantInfo?.sex ??
              "",
            race:
              formData.applicantInfo.race ??
              backgroundCheckForm.applicantInfo?.race ??
              "",
            address: {
              street: incomingAddress.street ?? existingAddress.street ?? "",
              city: incomingAddress.city ?? existingAddress.city ?? "",
              state: incomingAddress.state ?? existingAddress.state ?? "",
              zipCode: incomingAddress.zipCode ?? existingAddress.zipCode ?? "",
            },
          };

          backgroundCheckForm.applicantInfo = mergedApplicantInfo;
          backgroundCheckForm.markModified("applicantInfo");
        }
        if (formData.employmentInfo) {
          backgroundCheckForm.employmentInfo = {
            ...backgroundCheckForm.employmentInfo,
            ...formData.employmentInfo,
          };
          backgroundCheckForm.markModified("employmentInfo");
        }
        if (formData.consentAcknowledgment) {
          backgroundCheckForm.consentAcknowledgment = {
            ...backgroundCheckForm.consentAcknowledgment,
            ...formData.consentAcknowledgment,
          };
          backgroundCheckForm.markModified("consentAcknowledgment");
        }
        if (formData.notification) {
          backgroundCheckForm.notification = {
            ...backgroundCheckForm.notification,
            ...formData.notification,
          };
          backgroundCheckForm.markModified("notification");
        }
        if (formData.applicantSignature)
          backgroundCheckForm.applicantSignature = formData.applicantSignature;
        if (formData.applicantSignatureDate)
          backgroundCheckForm.applicantSignatureDate =
            formData.applicantSignatureDate;
        backgroundCheckForm.status = status;
      } else {
        const newApplicantInfo = {
          lastName: formData.applicantInfo?.lastName || "",
          firstName: formData.applicantInfo?.firstName || "",
          middleInitial: formData.applicantInfo?.middleInitial || "",
          socialSecurityNumber:
            formData.applicantInfo?.socialSecurityNumber || "",
          height: formData.applicantInfo?.height || "",
          weight: formData.applicantInfo?.weight || "",
          eyeColor: formData.applicantInfo?.eyeColor || "",
          hairColor: formData.applicantInfo?.hairColor || "",
          dateOfBirth: formData.applicantInfo?.dateOfBirth || null,
          sex: formData.applicantInfo?.sex || "",
          race: formData.applicantInfo?.race || "",
          address: {
            street: formData.applicantInfo?.address?.street || "",
            city: formData.applicantInfo?.address?.city || "",
            state: formData.applicantInfo?.address?.state || "",
            zipCode: formData.applicantInfo?.address?.zipCode || "",
          },
        };
        backgroundCheckForm = new BackgroundCheck({
          applicationId,
          employeeId,
          applicantInfo: newApplicantInfo,
          employmentInfo: formData.employmentInfo || {},
          consentAcknowledgment: formData.consentAcknowledgment || {},
          notification: formData.notification || {},
          applicantSignature: formData.applicantSignature || "",
          applicantSignatureDate: formData.applicantSignatureDate || null,
          status,
        });
      }

      await backgroundCheckForm.save({
        validateBeforeSave: status !== "draft",
      });

      if (status === "completed") {
        if (!application.completedForms) application.completedForms = [];
        if (!application.completedForms.includes("Background Check")) {
          application.completedForms.push("Background Check");
        }
        application.completionPercentage =
          application.calculateCompletionPercentage();
        await application.save();
      }

      res.status(200).json({
        message:
          status === "draft"
            ? "Background check form saved as draft"
            : "Background check form completed",
        backgroundCheck: backgroundCheckForm,
        completionPercentage: application.completionPercentage,
      });
    } catch (error) {
      console.error("Error saving background check form:", error);
      res
        .status(500)
        .json({ message: "Internal server error", error: error.message });
    }
  }
);

// Employee upload signed Background Check form
router.post(
  "/employee-upload-signed-background-check",
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const { applicationId, employeeId } = req.body;

      if (!applicationId) {
        return res.status(400).json({ message: "Application ID is required" });
      }

      let backgroundCheck = await BackgroundCheck.findOne({ applicationId });

      if (!backgroundCheck) {
        backgroundCheck = new BackgroundCheck({
          applicationId,
          employeeId,
        });
      }

      backgroundCheck.employeeUploadedForm = {
        filename: req.file.originalname,
        filePath: req.file.path,
        uploadedAt: new Date(),
      };
      backgroundCheck.status = "submitted";

      await backgroundCheck.save();

      res.status(200).json({
        message: "Signed Background Check form uploaded successfully",
        backgroundCheck,
      });
    } catch (error) {
      console.error("Error uploading signed form:", error);
      res
        .status(500)
        .json({ message: "Internal server error", error: error.message });
    }
  }
);

// Remove employee uploaded Background Check form
router.post("/remove-background-check-upload", async (req, res) => {
  try {
    const { applicationId, employeeId } = req.body;

    if (!applicationId) {
      return res.status(400).json({ message: "Application ID is required" });
    }

    const backgroundCheck = await BackgroundCheck.findOne({ applicationId });

    if (!backgroundCheck || !backgroundCheck.employeeUploadedForm) {
      return res.status(404).json({ message: "No uploaded form found" });
    }

    // Delete the file from the file system
    if (backgroundCheck.employeeUploadedForm.filePath) {
      try {
        const filePath = path.join(
          __dirname,
          "../../",
          backgroundCheck.employeeUploadedForm.filePath
        );
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (fileError) {
        console.warn(
          "Warning: Could not delete file from disk:",
          fileError.message
        );
      }
    }

    // Clear the uploaded form from the database
    backgroundCheck.employeeUploadedForm = null;
    backgroundCheck.status = "draft";

    await backgroundCheck.save();

    res.status(200).json({
      message: "Uploaded form removed successfully",
      backgroundCheck,
    });
  } catch (error) {
    console.error("Error removing uploaded form:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
});

// Employee upload CPR/First Aid Certificate
router.post(
  "/employee-upload-cpr-certificate",
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const { applicationId, employeeId } = req.body;

      if (!applicationId) {
        return res.status(400).json({ message: "Application ID is required" });
      }

      let backgroundCheck = await BackgroundCheck.findOne({ applicationId });

      if (!backgroundCheck) {
        backgroundCheck = new BackgroundCheck({
          applicationId,
          employeeId,
        });
      }

      backgroundCheck.cprFirstAidCertificate = {
        filename: req.file.originalname,
        filePath: req.file.path,
        uploadedAt: new Date(),
      };

      await backgroundCheck.save();

      res.status(200).json({
        message: "CPR/First Aid certificate uploaded successfully",
        backgroundCheck,
      });
    } catch (error) {
      console.error("Error uploading certificate:", error);
      res
        .status(500)
        .json({ message: "Internal server error", error: error.message });
    }
  }
);

// Remove CPR/First Aid Certificate upload
router.post("/remove-cpr-certificate-upload", async (req, res) => {
  try {
    const { applicationId, employeeId } = req.body;

    if (!applicationId) {
      return res.status(400).json({ message: "Application ID is required" });
    }

    const backgroundCheck = await BackgroundCheck.findOne({ applicationId });

    if (!backgroundCheck || !backgroundCheck.cprFirstAidCertificate) {
      return res.status(404).json({ message: "No certificate found" });
    }

    // Delete the file from the file system
    if (backgroundCheck.cprFirstAidCertificate.filePath) {
      try {
        const filePath = path.join(
          __dirname,
          "../../",
          backgroundCheck.cprFirstAidCertificate.filePath
        );
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (fileError) {
        console.warn(
          "Warning: Could not delete file from disk:",
          fileError.message
        );
      }
    }

    // Clear the certificate from the database
    backgroundCheck.cprFirstAidCertificate = null;

    await backgroundCheck.save();

    res.status(200).json({
      message: "Certificate removed successfully",
      backgroundCheck,
    });
  } catch (error) {
    console.error("Error removing certificate:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
});

// ========== TB SYMPTOM SCREEN FORM ENDPOINTS ==========

const TBSymptomScreenTemplate = require("../../database/Models/TBSymptomScreenTemplate");

// HR upload TB Symptom Screen template
router.post(
  "/hr-upload-tb-symptom-screen-template",
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const { uploadedBy } = req.body;

      // Deactivate previous templates
      await TBSymptomScreenTemplate.updateMany({}, { isActive: false });

      // Create new template
      const template = new TBSymptomScreenTemplate({
        filename: req.file.originalname,
        filePath: req.file.path,
        uploadedBy: uploadedBy || null,
        isActive: true,
      });

      await template.save();

      res.status(200).json({
        message: "TB Symptom Screen template uploaded successfully",
        template,
      });
    } catch (error) {
      console.error("Error uploading template:", error);
      res
        .status(500)
        .json({ message: "Internal server error", error: error.message });
    }
  }
);

// Get active TB Symptom Screen template
router.get("/get-tb-symptom-screen-template", async (req, res) => {
  try {
    const template = await TBSymptomScreenTemplate.findOne({
      isActive: true,
    }).sort({ createdAt: -1 });

    if (!template) {
      return res.status(404).json({ message: "No template found" });
    }

    res.status(200).json({
      message: "Template retrieved successfully",
      template,
    });
  } catch (error) {
    console.error("Error getting template:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
});

// Save TB Symptom Screen form status
router.post("/save-tb-symptom-screen", async (req, res) => {
  try {
    const {
      applicationId,
      employeeId,
      formData = {},
      status = "draft",
      hrFeedback,
    } = req.body;

    if (!applicationId || !employeeId) {
      return res.status(400).json({
        message: "Application ID and Employee ID are required",
      });
    }

    // Map flat form data to nested schema structure
    const mappedFormData = {};

    // Basic Information
    if (formData.name || formData.gender || formData.dateOfBirth) {
      mappedFormData.basicInfo = {
        fullName: formData.name || "",
        sex: formData.gender || "",
        dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth) : null,
      };
    }

    // Last Skin Test
    if (formData.lastSkinTest || formData.testDate || formData.testResults ||
        formData.positive !== undefined || formData.negative !== undefined ||
        formData.chestXRayNormal !== undefined || formData.chestXRayAbnormal !== undefined) {
      mappedFormData.lastSkinTest = {
        facilityName: formData.lastSkinTest || "",
        testDate: formData.testDate ? new Date(formData.testDate) : null,
        resultMM: formData.testResults || "",
        resultPositive: formData.positive || false,
        resultNegative: formData.negative || false,
        chestXrayNormal: formData.chestXRayNormal || false,
        chestXrayAbnormal: formData.chestXRayAbnormal || false,
      };
    }

    // Treatment History
    if (formData.treatedForLTBI !== undefined || formData.monthsLTBI ||
        formData.treatedForTB !== undefined || formData.monthsTB ||
        formData.whenTreated || formData.whereTreated || formData.medications) {
      mappedFormData.treatmentHistory = {
        latentTB: formData.treatedForLTBI === 'yes',
        latentMonths: parseInt(formData.monthsLTBI) || 0,
        tbDisease: formData.treatedForTB === 'yes',
        tbDiseaseMonths: parseInt(formData.monthsTB) || 0,
        treatmentWhen: formData.whenTreated || "",
        treatmentWhere: formData.whereTreated || "",
        medications: formData.medications || "",
      };
    }

    // Screening Date
    if (formData.todaysDate) {
      mappedFormData.screeningDate = new Date(formData.todaysDate);
    }

    // Symptom Assessment
    if (Object.keys(formData).some(key => key.includes('Cough') || key.includes('cough') ||
        key.includes('Sweats') || key.includes('sweats') || key.includes('fevers') ||
        key.includes('weight') || key.includes('tired') || key.includes('chest') ||
        key.includes('breath') || key.includes('contact'))) {
      mappedFormData.symptoms = {
        cough: formData.hasCough === 'yes',
        coughDurationDays: parseInt(formData.coughDurationDays) || 0,
        coughDurationWeeks: parseInt(formData.coughDurationWeeks) || 0,
        coughDurationMonths: parseInt(formData.coughDurationMonths) || 0,
        mucusColor: formData.mucusColor || "",
        coughingBlood: formData.coughingUpBlood === 'yes',
        nightSweats: formData.hasNightSweats === 'yes',
        fevers: formData.hasFevers === 'yes',
        weightLoss: formData.lostWeight === 'yes',
        weightLossPounds: parseInt(formData.weightLost) || 0,
        fatigue: formData.tiredOrWeak === 'yes',
        fatigueDurationDays: parseInt(formData.tirednessDurationDays) || 0,
        fatigueDurationWeeks: parseInt(formData.tirednessDurationWeeks) || 0,
        fatigueDurationMonths: parseInt(formData.tirednessDurationMonths) || 0,
        chestPain: formData.hasChestPain === 'yes',
        chestPainDurationDays: parseInt(formData.chestPainDurationDays) || 0,
        chestPainDurationWeeks: parseInt(formData.chestPainDurationWeeks) || 0,
        chestPainDurationMonths: parseInt(formData.chestPainDurationMonths) || 0,
        shortnessOfBreath: formData.hasShortnessOfBreath === 'yes',
        shortnessBreathDurationDays: parseInt(formData.shortnessOfBreathDurationDays) || 0,
        shortnessBreathDurationWeeks: parseInt(formData.shortnessOfBreathDurationWeeks) || 0,
        shortnessBreathDurationMonths: parseInt(formData.shortnessOfBreathDurationMonths) || 0,
        knowsSomeoneWithSymptoms: formData.knowsSomeoneWithSymptoms === 'yes',
        contactName: formData.contactName || "",
        contactAddress: formData.contactAddress || "",
        contactPhone: formData.contactPhone || "",
      };
    }

    // Action Taken
    if (Object.keys(formData).some(key => key.includes('SignOf') || key.includes('Xray') ||
        key.includes('discussed') || key.includes('client') || key.includes('further') ||
        key.includes('isolated') || key.includes('mask') || key.includes('sputum') ||
        key.includes('referred') || key.includes('other'))) {
      mappedFormData.actionTaken = {
        noSignOfTB: formData.noSignOfActiveTB || false,
        chestXrayNotNeeded: formData.chestXRayNotNeeded || false,
        discussedSigns: formData.discussedSignsAndSymptoms || false,
        clientAware: formData.clientKnowsToSeekCare || false,
        furtherActionNeeded: formData.furtherActionNeeded || false,
        isolated: formData.isolated || false,
        givenMask: formData.givenSurgicalMask || false,
        chestXrayNeeded: formData.chestXRayNeeded || false,
        sputumSamplesNeeded: formData.sputumSamplesNeeded || false,
        referredToDoctor: formData.referredToDoctorClinic ? "Yes" : "",
        other: formData.otherAction ? "Yes" : "",
      };
    }

    // Signatures
    if (formData.assessorSignature || formData.clientSignature || formData.signatureDate) {
      mappedFormData.screenerSignature = formData.assessorSignature || "";
      mappedFormData.clientSignature = formData.clientSignature || "";
      mappedFormData.clientSignatureDate = formData.signatureDate ? new Date(formData.signatureDate) : null;
    }

    const updateData = { status };

    // Only update form data if provided and mapped
    if (Object.keys(mappedFormData).length > 0) {
      Object.assign(updateData, mappedFormData);
    }

    if (hrFeedback) {
      updateData.hrFeedback = hrFeedback;
    }

    const tbSymptomScreen = await TBSymptomScreen.findOneAndUpdate(
      { applicationId, employeeId },
      updateData,
      { new: true, upsert: true, validateBeforeSave: status !== "draft" }
    );

    // Update application completion if status is completed
    if (status === "completed") {
      const application = await OnboardingApplication.findById(applicationId);
      if (application) {
        if (!application.completedForms) application.completedForms = [];
        if (!application.completedForms.includes("tbSymptomScreen")) {
          application.completedForms.push("tbSymptomScreen");
        }
        application.completionPercentage = application.calculateCompletionPercentage();
        await application.save();
      }
    }

    res.status(200).json({
      success: true,
      message: "TB Symptom Screen form saved successfully",
      tbSymptomScreen,
    });
  } catch (error) {
    console.error("Error saving TB Symptom Screen form:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
});

// Get TB Symptom Screen form
router.get("/get-tb-symptom-screen/:applicationId", async (req, res) => {
  try {
    const { applicationId } = req.params;

    const tbSymptomScreen = await TBSymptomScreen.findOne({ applicationId });

    if (!tbSymptomScreen) {
      return res.status(404).json({
        message: "TB Symptom Screen form not found",
      });
    }

    res.status(200).json({
      success: true,
      tbSymptomScreen,
    });
  } catch (error) {
    console.error("Error getting TB Symptom Screen form:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
});

// Employee upload signed TB Symptom Screen
router.post(
  "/employee-upload-signed-tb-symptom-screen",
  upload.single("file"),
  async (req, res) => {
    try {
      const { applicationId, employeeId } = req.body;

      if (!applicationId || !employeeId) {
        return res.status(400).json({
          message: "Application ID and Employee ID are required",
        });
      }

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const tbSymptomScreen = await TBSymptomScreen.findOneAndUpdate(
        { applicationId, employeeId },
        {
          employeeUploadedForm: {
            filename: req.file.originalname,
            filePath: req.file.path,
            uploadedAt: new Date(),
          },
          status: "submitted",
        },
        { new: true, upsert: true }
      );

      res.status(200).json({
        success: true,
        message: "TB Symptom Screen document uploaded successfully",
        tbSymptomScreen,
      });
    } catch (error) {
      console.error("Error uploading TB Symptom Screen document:", error);
      res.status(500).json({
        message: "Internal server error",
        error: error.message,
      });
    }
  }
);

// Remove uploaded TB Symptom Screen document
router.post("/remove-tb-symptom-screen-upload", async (req, res) => {
  try {
    const { applicationId, employeeId } = req.body;

    if (!applicationId || !employeeId) {
      return res.status(400).json({
        message: "Application ID and Employee ID are required",
      });
    }

    const tbSymptomScreen = await TBSymptomScreen.findOne({
      applicationId,
      employeeId,
    });

    if (!tbSymptomScreen) {
      return res.status(404).json({
        message: "TB Symptom Screen form not found",
      });
    }

    // Delete the file from the file system
    if (tbSymptomScreen.employeeUploadedForm?.filePath) {
      try {
        const filePath = path.join(
          __dirname,
          "../../",
          tbSymptomScreen.employeeUploadedForm.filePath
        );
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (fileError) {
        console.warn(
          "Warning: Could not delete file from disk:",
          fileError.message
        );
      }
    }

    // Clear the uploaded form from the database
    tbSymptomScreen.employeeUploadedForm = null;
    tbSymptomScreen.status = "draft";

    await tbSymptomScreen.save();

    res.status(200).json({
      success: true,
      message: "TB Symptom Screen document removed successfully",
      tbSymptomScreen,
    });
  } catch (error) {
    console.error("Error removing TB Symptom Screen document:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
});

// HR get all TB Symptom Screen submissions
router.get("/hr-get-all-tb-symptom-screen-submissions", async (req, res) => {
  try {
    const submissions = await TBSymptomScreen.find({
      "employeeUploadedForm.filename": { $exists: true },
    })
      .populate("employeeId", "firstName lastName email")
      .sort({ "employeeUploadedForm.uploadedAt": -1 });

    res.status(200).json({
      success: true,
      submissions,
    });
  } catch (error) {
    console.error("Error getting TB Symptom Screen submissions:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
});

// Get individual TB Symptom Screen submission by ID
router.get("/get-tb-symptom-screen-submission/:id", async (req, res) => {
  try {
    const submission = await TBSymptomScreen.findById(req.params.id).populate(
      "employeeId",
      "firstName lastName email"
    );

    if (!submission) {
      return res.status(404).json({
        message: "TB Symptom Screen submission not found",
      });
    }

    res.status(200).json({
      success: true,
      submission,
    });
  } catch (error) {
    console.error("Error getting TB Symptom Screen submission:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
});

// HR clear/delete TB Symptom Screen submission
router.delete(
  "/hr-clear-tb-symptom-screen-submission/:id",
  async (req, res) => {
    try {
      const submission = await TBSymptomScreen.findById(req.params.id);

      if (!submission) {
        return res.status(404).json({
          message: "TB Symptom Screen submission not found",
        });
      }

      // Delete the file from the file system
      if (submission.employeeUploadedForm?.filePath) {
        try {
          const filePath = path.join(
            __dirname,
            "../../",
            submission.employeeUploadedForm.filePath
          );
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch (fileError) {
          console.warn(
            "Warning: Could not delete file from disk:",
            fileError.message
          );
        }
      }

      // Clear the uploaded form from the database
      submission.employeeUploadedForm = null;
      submission.status = "draft";

      await submission.save();

      res.status(200).json({
        success: true,
        message: "TB Symptom Screen submission cleared successfully",
      });
    } catch (error) {
      console.error("Error clearing TB Symptom Screen submission:", error);
      res.status(500).json({
        message: "Internal server error",
        error: error.message,
      });
    }
  }
);

// Save CPR/First Aid Certificate status
router.post("/save-cpr-certificate", async (req, res) => {
  try {
    const { applicationId, employeeId, status = "draft" } = req.body;

    if (!applicationId) {
      return res.status(400).json({ message: "Application ID is required" });
    }

    let backgroundCheck = await BackgroundCheck.findOne({ applicationId });

    if (!backgroundCheck) {
      backgroundCheck = new BackgroundCheck({
        applicationId,
        employeeId,
        status,
      });
    } else {
      backgroundCheck.status = status;
    }

    await backgroundCheck.save();

    res.status(200).json({
      success: true,
      message: "CPR/First Aid certificate status saved successfully",
      backgroundCheck,
    });
  } catch (error) {
    console.error("Error saving CPR certificate status:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
});

module.exports = router;
