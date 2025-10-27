const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const OrientationPresentation = require("../../database/Models/OrientationPresentation");
const OrientationDocument = require("../../database/Models/OrientationDocument");
const OnboardingApplication = require("../../database/Models/OnboardingApplication");

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(
  __dirname,
  "../../uploads/orientation-presentation"
);
console.log("📁 Orientation presentation uploads directory path:", uploadsDir);

if (!fs.existsSync(uploadsDir)) {
  console.log("📁 Creating uploads/orientation-presentation directory...");
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log("✅ Directory created successfully");
} else {
  console.log("✅ Uploads/orientation-presentation directory already exists");
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// Upload orientation presentation (HR only)
router.post(
  "/orientation-presentation/upload",
  upload.single("file"),
  async (req, res) => {
    try {
      const { uploadedBy } = req.body;

      if (!req.file) {
        return res
          .status(400)
          .json({ success: false, message: "No file uploaded" });
      }

      if (!uploadedBy) {
        return res
          .status(400)
          .json({ success: false, message: "Uploaded by is required" });
      }

      // Deactivate previous documents
      await OrientationDocument.updateMany({}, { isActive: false });

      const document = new OrientationDocument({
        fileName: req.file.originalname,
        filePath: `uploads/orientation-presentation/${req.file.filename}`,
        fileSize: req.file.size,
        uploadedBy,
        isActive: true,
      });

      await document.save();

      res.status(200).json({
        success: true,
        message: "Orientation presentation uploaded successfully",
        data: document,
      });
    } catch (error) {
      console.error("Error uploading orientation presentation:", error);
      res
        .status(500)
        .json({
          success: false,
          message: "Failed to upload",
          error: error.message,
        });
    }
  }
);

// Get active orientation document
router.get("/orientation-presentation/document", async (req, res) => {
  try {
    const document = await OrientationDocument.findOne({ isActive: true }).sort(
      { createdAt: -1 }
    );

    if (!document) {
      return res
        .status(404)
        .json({ success: false, message: "No orientation presentation found" });
    }

    res.status(200).json({ success: true, data: document });
  } catch (error) {
    console.error("Error fetching orientation document:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to fetch document",
        error: error.message,
      });
  }
});

// Mark as viewed and save
router.post("/orientation-presentation/save", async (req, res) => {
  try {
    let { applicationId, employeeId, status, viewed } = req.body;

    if (!employeeId) {
      return res
        .status(400)
        .json({ success: false, message: "Employee ID is required" });
    }

    if (!applicationId || !applicationId.match(/^[0-9a-fA-F]{24}$/)) {
      let application = await OnboardingApplication.findOne({ employeeId });
      if (!application) {
        application = new OnboardingApplication({
          employeeId,
          applicationStatus: "draft",
        });
        await application.save();
      }
      applicationId = application._id;
    }

    let presentation = await OrientationPresentation.findOne({ applicationId });

    if (presentation) {
      if (viewed) {
        presentation.viewed = true;
        presentation.viewedAt = new Date();
      }
      presentation.status = status || presentation.status;
      await presentation.save();
    } else {
      presentation = new OrientationPresentation({
        applicationId,
        employeeId,
        viewed: viewed || false,
        viewedAt: viewed ? new Date() : null,
        status: status || "draft",
      });
      await presentation.save();
    }

    if (status === "completed") {
      const application = await OnboardingApplication.findById(applicationId);
      if (application) {
        if (!application.completedForms.includes("orientationPresentation")) {
          application.completedForms.push("orientationPresentation");
        }
        application.completionPercentage =
          application.calculateCompletionPercentage();
        await application.save();
      }
    }

    res.status(200).json({
      success: true,
      message: "Orientation presentation saved successfully",
      data: { applicationId, ...presentation.toObject() },
    });
  } catch (error) {
    console.error("Error saving orientation presentation:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to save",
        error: error.message,
      });
  }
});

// Get employee's orientation presentation status
router.get("/orientation-presentation/get/:applicationId", async (req, res) => {
  try {
    const { applicationId } = req.params;
    const presentation = await OrientationPresentation.findOne({
      applicationId,
    });

    if (!presentation) {
      return res
        .status(404)
        .json({
          success: false,
          message: "Orientation presentation not found",
        });
    }

    res.status(200).json({ success: true, data: presentation });
  } catch (error) {
    console.error("Error fetching orientation presentation:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to fetch",
        error: error.message,
      });
  }
});

// Save HR feedback for orientation presentation
router.post("/save-orientation-presentation", async (req, res) => {
  try {
    let { applicationId, employeeId, hrFeedback, status } = req.body;

    if (!employeeId) {
      return res
        .status(400)
        .json({ success: false, message: "Employee ID is required" });
    }

    if (!applicationId || !applicationId.match(/^[0-9a-fA-F]{24}$/)) {
      let application = await OnboardingApplication.findOne({ employeeId });
      if (!application) {
        application = new OnboardingApplication({
          employeeId,
          applicationStatus: "draft",
        });
        await application.save();
      }
      applicationId = application._id;
    }

    let presentation = await OrientationPresentation.findOne({ applicationId });

    if (presentation) {
      if (hrFeedback) {
        presentation.hrFeedback = hrFeedback;
      }
      if (status) {
        presentation.status = status;
      }
      await presentation.save();
    } else {
      presentation = new OrientationPresentation({
        applicationId,
        employeeId,
        hrFeedback: hrFeedback || {},
        status: status || "draft",
      });
      await presentation.save();
    }

    res.status(200).json({
      success: true,
      message: "HR feedback saved successfully",
      data: presentation,
    });
  } catch (error) {
    console.error("Error saving HR feedback:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to save HR feedback",
        error: error.message,
      });
  }
});

module.exports = router;
