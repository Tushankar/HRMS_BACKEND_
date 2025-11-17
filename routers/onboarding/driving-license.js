const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const DrivingLicense = require("../../database/Models/DrivingLicense");
const OnboardingApplication = require("../../database/Models/OnboardingApplication");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

const router = express.Router();

// Get driving license form
router.get("/get-driving-license/:applicationId", async (req, res) => {
  try {
    const { applicationId } = req.params;

    if (!applicationId) {
      return res.status(400).json({ message: "Application ID is required" });
    }

    let drivingLicense = await DrivingLicense.findOne({
      applicationId,
    }).populate("employeeId", "firstName lastName email phone");

    if (!drivingLicense) {
      // Create a new one if it doesn't exist
      const application = await OnboardingApplication.findById(applicationId);
      if (!application) {
        return res
          .status(404)
          .json({ message: "Onboarding application not found" });
      }

      drivingLicense = new DrivingLicense({
        applicationId,
        employeeId: application.employeeId,
      });
      await drivingLicense.save();
    }

    res.status(200).json({
      success: true,
      drivingLicense,
    });
  } catch (error) {
    console.error("Error fetching driving license form:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
});

// Save driving license form data
router.post("/save-driving-license", async (req, res) => {
  try {
    const {
      applicationId,
      employeeId,
      formData,
      status = "draft",
      hrFeedback,
    } = req.body;

    if (!applicationId || !employeeId) {
      return res
        .status(400)
        .json({ message: "Application ID and Employee ID are required" });
    }

    const application = await OnboardingApplication.findById(applicationId);
    if (!application) {
      return res
        .status(404)
        .json({ message: "Onboarding application not found" });
    }

    let drivingLicense = await DrivingLicense.findOne({ applicationId });

    if (!drivingLicense) {
      drivingLicense = new DrivingLicense({
        applicationId,
        employeeId,
      });
    }

    // Update form data if provided
    if (formData) {
      drivingLicense.licenseNumber = formData.licenseNumber || "";
      drivingLicense.licenseState = formData.licenseState || "";
      drivingLicense.expirationDate = formData.expirationDate || null;
      drivingLicense.licenseClass = formData.licenseClass || "";
    }

    // Update HR feedback if provided
    if (hrFeedback) {
      drivingLicense.hrFeedback = {
        comment: hrFeedback.comment || "",
        reviewedBy: hrFeedback.reviewedBy,
        reviewedAt: hrFeedback.reviewedAt || new Date(),
      };
    }

    drivingLicense.status = status;
    await drivingLicense.save();

    // Update application form status
    if (application.forms) {
      application.forms.drivingLicense = drivingLicense._id;
    }
    await application.save();

    res.status(200).json({
      success: true,
      message: "Driving license form saved successfully",
      drivingLicense,
    });
  } catch (error) {
    console.error("Error saving driving license form:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
});

// Employee upload driving license
router.post(
  "/employee-upload-driving-license",
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

      let drivingLicense = await DrivingLicense.findOne({ applicationId });

      if (!drivingLicense) {
        drivingLicense = new DrivingLicense({
          applicationId,
          employeeId,
        });
      }

      drivingLicense.employeeUploadedForm = {
        filename: req.file.originalname,
        filePath: req.file.path,
        uploadedAt: new Date(),
      };
      drivingLicense.status = "submitted";

      await drivingLicense.save();

      res.status(200).json({
        message: "Driving license uploaded successfully",
        drivingLicense,
      });
    } catch (error) {
      console.error("Error uploading driving license:", error);
      res
        .status(500)
        .json({ message: "Internal server error", error: error.message });
    }
  }
);

// Remove driving license upload
router.post("/remove-driving-license-upload", async (req, res) => {
  try {
    const { applicationId, employeeId } = req.body;

    if (!applicationId) {
      return res.status(400).json({ message: "Application ID is required" });
    }

    const drivingLicense = await DrivingLicense.findOne({ applicationId });

    if (!drivingLicense || !drivingLicense.employeeUploadedForm) {
      return res.status(404).json({ message: "No uploaded form found" });
    }

    // Delete the file from the file system
    if (drivingLicense.employeeUploadedForm.filePath) {
      try {
        const filePath = path.join(
          __dirname,
          "../../",
          drivingLicense.employeeUploadedForm.filePath
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

    drivingLicense.employeeUploadedForm = null;
    drivingLicense.status = "draft";
    await drivingLicense.save();

    res.status(200).json({
      message: "Driving license removed successfully",
      drivingLicense,
    });
  } catch (error) {
    console.error("Error removing driving license:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
});

// Download driving license
router.get("/download-driving-license/:applicationId", async (req, res) => {
  try {
    const { applicationId } = req.params;

    if (!applicationId) {
      return res.status(400).json({ message: "Application ID is required" });
    }

    const drivingLicense = await DrivingLicense.findOne({ applicationId });

    if (
      !drivingLicense ||
      !drivingLicense.employeeUploadedForm ||
      !drivingLicense.employeeUploadedForm.filePath
    ) {
      return res.status(404).json({ message: "No uploaded form found" });
    }

    const filePath = path.join(
      __dirname,
      "../../",
      drivingLicense.employeeUploadedForm.filePath
    );

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File not found" });
    }

    res.download(filePath, drivingLicense.employeeUploadedForm.filename);
  } catch (error) {
    console.error("Error downloading driving license:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
});

// Save driving license form status
router.post("/driving-license/save-status", async (req, res) => {
  try {
    const { applicationId, employeeId, status } = req.body;

    if (!applicationId) {
      return res.status(400).json({ message: "Application ID is required" });
    }

    let drivingLicense = await DrivingLicense.findOne({ applicationId });

    if (!drivingLicense) {
      drivingLicense = new DrivingLicense({
        applicationId,
        employeeId,
        status,
      });
    } else {
      drivingLicense.status = status;
    }

    await drivingLicense.save();

    // Update application progress if status is completed
    if (status === "completed") {
      const application = await OnboardingApplication.findById(applicationId);
      if (application) {
        // Ensure completedForms array exists
        if (!application.completedForms) {
          application.completedForms = [];
        }

        // Check if Driving License is already marked as completed
        if (!application.completedForms.includes("drivingLicense")) {
          application.completedForms.push("drivingLicense");
        }

        application.completionPercentage =
          application.calculateCompletionPercentage();
        await application.save();
      }
    }

    res.status(200).json({
      success: true,
      message: "Status saved successfully",
      drivingLicense,
    });
  } catch (error) {
    console.error("Error saving driving license status:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
});

// HR get all driving license submissions
router.get("/hr-get-all-driving-license-submissions", async (req, res) => {
  try {
    const submissions = await DrivingLicense.find({
      employeeUploadedForm: { $exists: true, $ne: null },
    })
      .populate("employeeId", "firstName lastName email phone")
      .sort({ "employeeUploadedForm.uploadedAt": -1 });

    res.status(200).json({
      success: true,
      submissions,
    });
  } catch (error) {
    console.error("Error fetching driving license submissions:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
});

// HR delete driving license submission
router.post("/delete-driving-license-submission", async (req, res) => {
  try {
    const { submissionId } = req.body;

    if (!submissionId) {
      return res.status(400).json({ message: "Submission ID is required" });
    }

    const drivingLicense = await DrivingLicense.findById(submissionId);

    if (!drivingLicense) {
      return res.status(404).json({ message: "Submission not found" });
    }

    // Delete the file from the file system
    if (drivingLicense.employeeUploadedForm?.filePath) {
      try {
        const filePath = path.join(
          __dirname,
          "../../",
          drivingLicense.employeeUploadedForm.filePath
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

    drivingLicense.employeeUploadedForm = null;
    drivingLicense.status = "draft";
    await drivingLicense.save();

    res.status(200).json({
      success: true,
      message: "Submission deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting submission:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
});

module.exports = router;
