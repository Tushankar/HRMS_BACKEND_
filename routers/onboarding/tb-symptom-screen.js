const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const TBSymptomScreen = require("../../database/Models/TBSymptomScreen");
const OnboardingApplication = require("../../database/Models/OnboardingApplication");
const mongoose = require("mongoose");

const router = express.Router();

// Create uploads directory for TB Symptom Screen documents
const uploadsDir = path.join(__dirname, "../../uploads/tb-symptom-screen");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for document uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `tb-symptom-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (req, file, cb) => {
  // Allow PDF and image files
  const allowedMimes = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/gif",
  ];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only PDF and image files are allowed"), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: fileFilter,
});

// Employee upload TB Symptom Screen document
router.post(
  "/employee-upload-document",
  upload.single("file"),
  async (req, res) => {
    try {
      const { applicationId, employeeId, positionType } = req.body;

      // Validation
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      if (!applicationId || !employeeId) {
        return res.status(400).json({
          message: "Application ID and Employee ID are required",
        });
      }

      // Verify positionType is tbSymptomScreen
      if (positionType !== "tbSymptomScreen") {
        return res.status(400).json({
          message: "Invalid position type for this endpoint",
        });
      }

      // Find or create TB Symptom Screen form
      let tbSymptomScreen = await TBSymptomScreen.findOne({
        applicationId,
        employeeId,
      });

      if (!tbSymptomScreen) {
        tbSymptomScreen = new TBSymptomScreen({
          applicationId,
          employeeId,
          status: "draft",
        });
      }

      // Store uploaded document information
      tbSymptomScreen.employeeUploadedForm = {
        filename: req.file.originalname,
        filePath: `uploads/tb-symptom-screen/${req.file.filename}`,
        uploadedAt: new Date(),
      };

      // Update status to completed when document is uploaded
      tbSymptomScreen.status = "completed";

      await tbSymptomScreen.save();

      console.log("✅ TB Symptom Screen document uploaded successfully");

      res.status(200).json({
        success: true,
        message: "Document uploaded successfully",
        document: {
          _id: tbSymptomScreen._id,
          filename: req.file.originalname,
          filePath: tbSymptomScreen.employeeUploadedForm.filePath,
          uploadedAt: tbSymptomScreen.employeeUploadedForm.uploadedAt,
        },
      });
    } catch (error) {
      // Clean up uploaded file if there was an error
      if (req.file) {
        fs.unlink(req.file.path, (err) => {
          if (err) console.error("Error deleting file:", err);
        });
      }

      console.error("Error uploading TB Symptom Screen document:", error);
      res.status(500).json({
        message: "Error uploading document",
        error: error.message,
      });
    }
  }
);

// Get uploaded TB Symptom Screen documents
router.get(
  "/get-uploaded-documents/:applicationId/:positionType",
  async (req, res) => {
    try {
      const { applicationId, positionType } = req.params;

      console.log(
        `Fetching TB Symptom Screen documents for app: ${applicationId}`
      );

      // Validate positionType
      if (positionType !== "tbSymptomScreen") {
        return res.status(400).json({
          message: "Invalid position type",
        });
      }

      // Find TB Symptom Screen form
      const tbSymptomScreen = await TBSymptomScreen.findOne({
        applicationId,
      }).lean();

      if (!tbSymptomScreen || !tbSymptomScreen.employeeUploadedForm) {
        console.log("No TB Symptom Screen form found for app:", applicationId);
        return res.status(200).json({
          data: {
            documents: [],
          },
        });
      }

      // Return documents array format for consistency with frontend expectations
      const documents = [
        {
          _id: tbSymptomScreen._id,
          filename: tbSymptomScreen.employeeUploadedForm.filename,
          filePath: tbSymptomScreen.employeeUploadedForm.filePath,
          uploadedAt: tbSymptomScreen.employeeUploadedForm.uploadedAt,
          size: 0, // Size info not available from schema
        },
      ];

      console.log("✅ Documents found:", documents);

      res.status(200).json({
        data: {
          documents: documents,
          totalCount: documents.length,
        },
      });
    } catch (error) {
      console.error("Error fetching TB Symptom Screen documents:", error);
      res.status(500).json({
        message: "Error fetching documents",
        error: error.message,
      });
    }
  }
);

// Remove TB Symptom Screen document
router.post("/remove-document", async (req, res) => {
  try {
    const { applicationId, documentId, positionType } = req.body;

    // Validation
    if (!applicationId || !documentId) {
      return res.status(400).json({
        message: "Application ID and Document ID are required",
      });
    }

    // Validate positionType
    if (positionType !== "tbSymptomScreen") {
      return res.status(400).json({
        message: "Invalid position type",
      });
    }

    // Find TB Symptom Screen form
    const tbSymptomScreen = await TBSymptomScreen.findById(documentId);
    if (!tbSymptomScreen) {
      return res.status(404).json({
        message: "TB Symptom Screen form not found",
      });
    }

    // Delete the file from disk if it exists
    if (
      tbSymptomScreen.employeeUploadedForm &&
      tbSymptomScreen.employeeUploadedForm.filePath
    ) {
      const filePath = path.join(
        __dirname,
        "../../",
        tbSymptomScreen.employeeUploadedForm.filePath
      );
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
          console.log("✅ File deleted successfully:", filePath);
        } catch (err) {
          console.error("Error deleting file:", err);
        }
      }
    }

    // Remove document from form
    tbSymptomScreen.employeeUploadedForm = null;
    tbSymptomScreen.status = "draft";

    await tbSymptomScreen.save();

    console.log("✅ TB Symptom Screen document removed successfully");

    res.status(200).json({
      success: true,
      message: "Document removed successfully",
    });
  } catch (error) {
    console.error("Error removing TB Symptom Screen document:", error);
    res.status(500).json({
      message: "Error removing document",
      error: error.message,
    });
  }
});

// Save TB Symptom Screen status (Save & Next)
router.post("/tb-symptom-screen/save-status", async (req, res) => {
  try {
    const { applicationId, employeeId, status } = req.body;

    // Validation
    if (!applicationId || !employeeId || !status) {
      return res.status(400).json({
        message: "Application ID, Employee ID, and Status are required",
      });
    }

    // Find or create TB Symptom Screen form
    let tbSymptomScreen = await TBSymptomScreen.findOne({
      applicationId,
      employeeId,
    });

    if (!tbSymptomScreen) {
      return res.status(404).json({
        message: "TB Symptom Screen form not found",
      });
    }

    // Check if document was uploaded
    if (!tbSymptomScreen.employeeUploadedForm) {
      return res.status(400).json({
        message: "Please upload a document before saving",
      });
    }

    // Update status
    tbSymptomScreen.status = status === "completed" ? "submitted" : status;

    await tbSymptomScreen.save();

    // Update application completion tracking
    const application = await OnboardingApplication.findById(applicationId);
    if (application) {
      // Ensure formsCompleted is an array
      if (!Array.isArray(application.formsCompleted)) {
        application.formsCompleted = [];
      }
      if (!application.formsCompleted.includes("tbSymptomScreen")) {
        application.formsCompleted.push("tbSymptomScreen");
      }
      await application.save();
    }

    console.log("✅ TB Symptom Screen status saved successfully");

    res.status(200).json({
      success: true,
      message: "TB Symptom Screen form saved successfully",
      form: {
        _id: tbSymptomScreen._id,
        status: tbSymptomScreen.status,
      },
    });
  } catch (error) {
    console.error("Error saving TB Symptom Screen status:", error);
    res.status(500).json({
      message: "Error saving form status",
      error: error.message,
    });
  }
});

module.exports = router;
