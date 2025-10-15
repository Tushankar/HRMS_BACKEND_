const express = require("express");
const router = express.Router();
const TrainingVideo = require("../../database/Models/TrainingVideo");
const OnboardingApplication = require("../../database/Models/OnboardingApplication");
const authMiddleware = require("../auth/authMiddleware");

// HR: Upload training video URL
router.post("/hr-upload-training-video", authMiddleware, async (req, res) => {
  try {
    const { title, description, videoUrl, thumbnailUrl, duration } = req.body;
    const adminId = req.user._id;

    if (!title || !videoUrl) {
      return res.status(400).json({
        success: false,
        message: "Title and video URL are required",
      });
    }

    console.log(`[Training Video] Admin uploading video: ${title}`);

    // Deactivate all previous videos
    await TrainingVideo.updateMany({}, { isActive: false });

    // Create and save new video
    const video = new TrainingVideo({
      title,
      description: description || "",
      videoUrl,
      thumbnailUrl: thumbnailUrl || "",
      duration: duration || "",
      uploadedBy: adminId,
      isActive: true,
    });

    await video.save();

    console.log(`[Training Video] Video saved to database: ${video._id}`);

    res.status(200).json({
      success: true,
      message: "Training video uploaded successfully",
      video: video,
    });
  } catch (error) {
    console.error("[Training Video] Error uploading video:", error);
    res.status(500).json({
      success: false,
      message: "Failed to upload video",
      error: error.message,
    });
  }
});

// HR: Get training video
router.get("/get-training-video", authMiddleware, async (req, res) => {
  try {
    const video = await TrainingVideo.findOne({
      isActive: true,
    })
      .sort({ createdAt: -1 })
      .populate("uploadedBy", "userName email");

    if (!video) {
      return res.status(404).json({
        success: false,
        message: "No training video found",
      });
    }

    res.status(200).json({
      success: true,
      video: video,
      message: "Training video retrieved successfully",
    });
  } catch (error) {
    console.error("[Training Video] Error fetching video:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch video",
      error: error.message,
    });
  }
});

// Employee: Check if all forms are submitted (access control)
router.get(
  "/check-video-access/:employeeId",
  authMiddleware,
  async (req, res) => {
    try {
      const { employeeId } = req.params;

      console.log(
        `[Training Video] Checking access for employee: ${employeeId}`
      );

      // Find the onboarding application
      const application = await OnboardingApplication.findOne({ employeeId });

      if (!application) {
        return res.status(200).json({
          success: true,
          data: {
            hasAccess: false,
            completedForms: 0,
            totalForms: 23,
            message: "No onboarding application found",
          },
        });
      }

      // Count completed forms (status: "submitted")
      const formFields = [
        "personalInformation",
        "emergencyContact",
        "employmentApplication",
        "references",
        "professionalExperience",
        "education",
        "backgroundCheck",
        "i9Form",
        "w4Form",
        "directDeposit",
        "eSignature",
        "codeOfEthics",
        "nonCompeteAgreement",
        "legalDisclosures",
        "serviceDeliveryPolicy",
        "misconductStatement",
        "orientationChecklist",
        "rnJobDescription",
        "lpnJobDescription",
        "cnaJobDescription",
        "pcaJobDescription",
        "jobDescriptionAcknowledgment",
        "pcaTrainingQuestions",
      ];

      let completedForms = 0;
      const formStatus = {};

      formFields.forEach((field) => {
        const formData = application[field];
        const isCompleted = formData?.status === "submitted";
        formStatus[field] = isCompleted;
        if (isCompleted) {
          completedForms++;
        }
      });

      const totalForms = formFields.length;
      const hasAccess = completedForms === totalForms;

      console.log(
        `[Training Video] Completed: ${completedForms}/${totalForms}, Access: ${hasAccess}`
      );

      res.status(200).json({
        success: true,
        data: {
          hasAccess,
          completedForms,
          totalForms,
          formStatus,
          message: hasAccess
            ? "All forms completed. Access granted."
            : `Complete all ${totalForms} forms to access the training video. Current progress: ${completedForms}/${totalForms}`,
        },
      });
    } catch (error) {
      console.error("[Training Video] Error checking access:", error);
      res.status(500).json({
        success: false,
        message: "Failed to check video access",
        error: error.message,
      });
    }
  }
);

module.exports = router;
