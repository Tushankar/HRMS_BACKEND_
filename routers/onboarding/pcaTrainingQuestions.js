const express = require("express");
const router = express.Router();
const PCATrainingQuestions = require("../../database/Models/PCATrainingQuestions");
const PCATrainingQuestionsTemplate = require("../../database/Models/PCATrainingQuestionsTemplate");
const OnboardingApplication = require("../../database/Models/OnboardingApplication");
const EmploymentApplication = require("../../database/Models/EmploymentApplication");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const authMiddleware = require("../auth/authMiddleware");

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, "../../uploads/pca-training");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "pca-training-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|doc|docx|jpg|jpeg|png/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(
        new Error(
          "Invalid file type. Only PDF, DOC, DOCX, JPG, JPEG, PNG are allowed."
        )
      );
    }
  },
});

// Check if employee is eligible for PCA Training Questions (based on positionType)
router.get(
  "/check-eligibility/:employeeId",
  authMiddleware,
  async (req, res) => {
    try {
      const { employeeId } = req.params;

      console.log(
        `[PCA Training] Checking eligibility for employee: ${employeeId}`
      );

      // Find the onboarding application
      const application = await OnboardingApplication.findOne({ employeeId });

      if (!application) {
        // Return not eligible if no application exists yet (instead of 404)
        console.log(
          "[PCA Training] No onboarding application found - not eligible yet"
        );
        return res.status(200).json({
          success: true,
          data: {
            isEligible: false,
            positionType: null,
            message: "No employment application submitted yet",
          },
        });
      }

      // Find the employment application to check positionType
      const employmentApp = await EmploymentApplication.findOne({
        applicationId: application._id,
        employeeId,
      });

      console.log("[PCA Training] Employment App Found:", !!employmentApp);
      if (employmentApp) {
        console.log(
          "[PCA Training] Full applicantInfo:",
          JSON.stringify(employmentApp.applicantInfo, null, 2)
        );
      }

      if (!employmentApp) {
        // Return not eligible if no employment application exists yet (instead of 404)
        console.log(
          "[PCA Training] No employment application found - not eligible yet"
        );
        return res.status(200).json({
          success: true,
          data: {
            isEligible: false,
            positionType: null,
            message: "No employment application submitted yet",
          },
        });
      }

      // Check if positionType is PCA
      const positionType =
        employmentApp.applicantInfo?.positionType?.toUpperCase();
      const isEligible = positionType === "PCA";

      console.log(
        `[PCA Training] Raw positionType: "${employmentApp.applicantInfo?.positionType}"`
      );
      console.log(`[PCA Training] Uppercase positionType: "${positionType}"`);
      console.log(`[PCA Training] Is Eligible: ${isEligible}`);

      res.status(200).json({
        success: true,
        data: {
          isEligible,
          positionType: employmentApp.applicantInfo?.positionType,
          applicationId: application._id,
        },
      });
    } catch (error) {
      console.error("[PCA Training] Error checking eligibility:", error);
      res.status(500).json({
        success: false,
        message: "Failed to check eligibility",
        error: error.message,
      });
    }
  }
);

// Get PCA Training Questions data for an employee
router.get("/get/:employeeId", authMiddleware, async (req, res) => {
  try {
    const { employeeId } = req.params;

    console.log(`[PCA Training] Fetching data for employee: ${employeeId}`);

    // Find the onboarding application
    const application = await OnboardingApplication.findOne({ employeeId });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Onboarding application not found",
      });
    }

    // Find or create PCA Training Questions record
    let pcaTraining = await PCATrainingQuestions.findOne({
      applicationId: application._id,
      employeeId,
    });

    if (!pcaTraining) {
      // Create new record if it doesn't exist
      pcaTraining = new PCATrainingQuestions({
        applicationId: application._id,
        employeeId,
        status: "pending",
      });
      await pcaTraining.save();
    }

    res.status(200).json({
      success: true,
      data: pcaTraining,
    });
  } catch (error) {
    console.error("[PCA Training] Error fetching data:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch PCA training data",
      error: error.message,
    });
  }
});

// HR: Upload global PCA Training Questions template (for document management)
router.post(
  "/hr-upload-pca-training-template",
  authMiddleware,
  upload.single("file"),
  async (req, res) => {
    try {
      const adminId = req.user._id;

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No file uploaded",
        });
      }

      console.log(`[PCA Training] Admin uploading global template`);

      // Deactivate all previous templates
      await PCATrainingQuestionsTemplate.updateMany({}, { isActive: false });

      // Create and save new template
      const template = new PCATrainingQuestionsTemplate({
        filename: req.file.originalname,
        filePath: req.file.path,
        uploadedBy: adminId,
        isActive: true,
      });

      await template.save();

      console.log(`[PCA Training] Template saved to database: ${template._id}`);

      res.status(200).json({
        success: true,
        message: "PCA Training Questions template uploaded successfully",
        template: template,
      });
    } catch (error) {
      console.error("[PCA Training] Error uploading template:", error);
      res.status(500).json({
        success: false,
        message: "Failed to upload template",
        error: error.message,
      });
    }
  }
);

// HR: Get global PCA Training Questions template
router.get("/get-pca-training-template", authMiddleware, async (req, res) => {
  try {
    const template = await PCATrainingQuestionsTemplate.findOne({
      isActive: true,
    })
      .sort({ createdAt: -1 })
      .populate("uploadedBy", "firstName lastName");

    if (!template) {
      return res.status(404).json({
        success: false,
        message: "No template found",
      });
    }

    res.status(200).json({
      success: true,
      template: template,
      message: "Template retrieved successfully",
    });
  } catch (error) {
    console.error("[PCA Training] Error fetching template:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch template",
      error: error.message,
    });
  }
});

// Download global PCA Training Questions template file
router.get(
  "/download-template/:templateId",
  authMiddleware,
  async (req, res) => {
    try {
      const { templateId } = req.params;

      const template = await PCATrainingQuestionsTemplate.findById(templateId);

      if (!template) {
        return res.status(404).json({
          success: false,
          message: "Template not found",
        });
      }

      // Check if file exists
      if (!fs.existsSync(template.filePath)) {
        return res.status(404).json({
          success: false,
          message: "Template file not found on server",
        });
      }

      console.log(`[PCA Training] Downloading template: ${template.filename}`);

      // Send the file
      res.download(template.filePath, template.filename, (err) => {
        if (err) {
          console.error("[PCA Training] Error sending file:", err);
          if (!res.headersSent) {
            res.status(500).json({
              success: false,
              message: "Error downloading file",
            });
          }
        }
      });
    } catch (error) {
      console.error("[PCA Training] Download error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to download template",
        error: error.message,
      });
    }
  }
);

// Admin: Upload PCA Training Questions template for specific employee
router.post(
  "/admin/upload-template/:employeeId",
  authMiddleware,
  upload.single("file"),
  async (req, res) => {
    try {
      const { employeeId } = req.params;
      const adminId = req.user._id;

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No file uploaded",
        });
      }

      console.log(
        `[PCA Training] Admin uploading template for employee: ${employeeId}`
      );

      // Find the onboarding application
      const application = await OnboardingApplication.findOne({ employeeId });

      if (!application) {
        return res.status(404).json({
          success: false,
          message: "Onboarding application not found",
        });
      }

      // Find or create PCA Training Questions record
      let pcaTraining = await PCATrainingQuestions.findOne({
        applicationId: application._id,
        employeeId,
      });

      if (!pcaTraining) {
        pcaTraining = new PCATrainingQuestions({
          applicationId: application._id,
          employeeId,
        });
      }

      // Update admin uploaded file info
      pcaTraining.adminUploadedFile = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        path: req.file.path,
        mimeType: req.file.mimetype,
        uploadedBy: adminId,
        uploadedAt: new Date(),
      };

      pcaTraining.status = "pending";

      await pcaTraining.save();

      res.status(200).json({
        success: true,
        message: "PCA Training Questions template uploaded successfully",
        data: pcaTraining,
      });
    } catch (error) {
      console.error("[PCA Training] Error uploading template:", error);
      res.status(500).json({
        success: false,
        message: "Failed to upload template",
        error: error.message,
      });
    }
  }
);

// Employee: Download PCA Training Questions (track download)
router.post("/download/:employeeId", authMiddleware, async (req, res) => {
  try {
    const { employeeId } = req.params;

    console.log(`[PCA Training] Employee downloading questions: ${employeeId}`);

    // Find the onboarding application
    const application = await OnboardingApplication.findOne({ employeeId });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Onboarding application not found",
      });
    }

    // Find PCA Training Questions record
    const pcaTraining = await PCATrainingQuestions.findOne({
      applicationId: application._id,
      employeeId,
    });

    if (!pcaTraining || !pcaTraining.adminUploadedFile) {
      return res.status(404).json({
        success: false,
        message: "PCA Training Questions template not available yet",
      });
    }

    // Update download tracking
    pcaTraining.downloadedAt = new Date();
    pcaTraining.downloadCount += 1;
    if (pcaTraining.status === "pending") {
      pcaTraining.status = "downloaded";
    }

    await pcaTraining.save();

    // Send file
    const filePath = pcaTraining.adminUploadedFile.path;
    res.download(filePath, pcaTraining.adminUploadedFile.originalName);
  } catch (error) {
    console.error("[PCA Training] Error downloading file:", error);
    res.status(500).json({
      success: false,
      message: "Failed to download file",
      error: error.message,
    });
  }
});

// Employee: Upload completed PCA Training Questions
router.post(
  "/upload/:employeeId",
  authMiddleware,
  upload.single("file"),
  async (req, res) => {
    try {
      const { employeeId } = req.params;

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No file uploaded",
        });
      }

      console.log(
        `[PCA Training] Employee uploading completed questions: ${employeeId}`
      );

      // Find the onboarding application
      const application = await OnboardingApplication.findOne({ employeeId });

      if (!application) {
        return res.status(404).json({
          success: false,
          message: "Onboarding application not found",
        });
      }

      // Find PCA Training Questions record
      let pcaTraining = await PCATrainingQuestions.findOne({
        applicationId: application._id,
        employeeId,
      });

      if (!pcaTraining) {
        return res.status(404).json({
          success: false,
          message: "PCA Training Questions record not found",
        });
      }

      // Update employee uploaded file info
      pcaTraining.employeeUploadedFile = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        path: req.file.path,
        mimeType: req.file.mimetype,
        uploadedAt: new Date(),
      };

      pcaTraining.status = "submitted";
      pcaTraining.submittedAt = new Date();

      await pcaTraining.save();

      // Update onboarding application completed forms
      if (!application.completedForms.includes("pca-training-questions")) {
        application.completedForms.push("pca-training-questions");
        application.calculateCompletionPercentage();
        await application.save();
      }

      res.status(200).json({
        success: true,
        message: "PCA Training Questions submitted successfully",
        data: pcaTraining,
      });
    } catch (error) {
      console.error("[PCA Training] Error uploading file:", error);
      res.status(500).json({
        success: false,
        message: "Failed to upload file",
        error: error.message,
      });
    }
  }
);

// HR: Get all PCA Training submissions
router.get("/hr/all-submissions", authMiddleware, async (req, res) => {
  try {
    console.log("[PCA Training] HR fetching all submissions");

    const submissions = await PCATrainingQuestions.find()
      .populate("employeeId", "firstName lastName email")
      .populate("applicationId")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: submissions,
    });
  } catch (error) {
    console.error("[PCA Training] Error fetching submissions:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch submissions",
      error: error.message,
    });
  }
});

// HR: Add notes to PCA Training submission
router.post("/hr/add-note/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body;
    const hrId = req.user._id;

    const pcaTraining = await PCATrainingQuestions.findById(id);

    if (!pcaTraining) {
      return res.status(404).json({
        success: false,
        message: "PCA Training record not found",
      });
    }

    pcaTraining.hrNotes.push({
      note,
      addedBy: hrId,
      addedAt: new Date(),
    });

    await pcaTraining.save();

    res.status(200).json({
      success: true,
      message: "Note added successfully",
      data: pcaTraining,
    });
  } catch (error) {
    console.error("[PCA Training] Error adding note:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add note",
      error: error.message,
    });
  }
});

// HR: Update status of PCA Training submission
router.put("/hr/update-status/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const hrId = req.user._id;

    const pcaTraining = await PCATrainingQuestions.findById(id);

    if (!pcaTraining) {
      return res.status(404).json({
        success: false,
        message: "PCA Training record not found",
      });
    }

    pcaTraining.status = status;
    pcaTraining.reviewedAt = new Date();
    pcaTraining.reviewedBy = hrId;

    await pcaTraining.save();

    res.status(200).json({
      success: true,
      message: "Status updated successfully",
      data: pcaTraining,
    });
  } catch (error) {
    console.error("[PCA Training] Error updating status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update status",
      error: error.message,
    });
  }
});

module.exports = router;
