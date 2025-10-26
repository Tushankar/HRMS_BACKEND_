const express = require("express");
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

// Save or update Background Check form
router.post("/save-background-check", async (req, res) => {
  try {
    const {
      applicationId,
      employeeId,
      formData,
      status = "draft",
      hrFeedback,
    } = req.body;

    // Handle HR notes submission
    if (hrFeedback && !formData) {
      if (!employeeId) {
        return res
          .status(400)
          .json({ success: false, message: "Employee ID is required" });
      }

      let appId = applicationId;
      if (!appId || !appId.match(/^[0-9a-fA-F]{24}$/)) {
        let application = await OnboardingApplication.findOne({ employeeId });
        if (!application) {
          return res
            .status(404)
            .json({ success: false, message: "Application not found" });
        }
        appId = application._id;
      }

      let form = await BackgroundCheck.findOne({ applicationId: appId });
      if (!form) {
        return res
          .status(404)
          .json({ success: false, message: "Background check form not found" });
      }

      form.hrFeedback = hrFeedback;
      form.status = status || "under_review";
      await form.save();

      return res.status(200).json({
        success: true,
        backgroundCheck: form,
        message: "HR feedback saved successfully",
      });
    }

    if (!applicationId && !employeeId) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Application ID or Employee ID is required",
        });
    }

    const application = await OnboardingApplication.findById(applicationId);
    if (!application) {
      return res
        .status(404)
        .json({ message: "Onboarding application not found" });
    }

    if (!formData) {
      return res.status(400).json({ message: "Form data is required" });
    }

    let backgroundCheckForm = await BackgroundCheck.findOne({ applicationId });

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

    await backgroundCheckForm.save({ validateBeforeSave: status !== "draft" });

    if (status === "completed") {
      if (!application.completedForms) application.completedForms = [];
      if (!application.completedForms.includes("backgroundCheck")) {
        application.completedForms.push("backgroundCheck");
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
});

module.exports = router;
