const express = require("express");
const router = express.Router();
const PositionType = require("../../database/Models/PositionType");
const OnboardingApplication = require("../../database/Models/OnboardingApplication");

router.post("/position-type/save", async (req, res) => {
  try {
    let { applicationId, employeeId, status, positionAppliedFor } = req.body;

    if (!employeeId) {
      return res.status(400).json({
        success: false,
        message: "Employee ID is required",
      });
    }

    if (!applicationId || applicationId === 'position-type' || !applicationId.match(/^[0-9a-fA-F]{24}$/)) {
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

    let positionType = await PositionType.findOne({ applicationId });

    if (positionType) {
      positionType.positionAppliedFor = positionAppliedFor;
      positionType.status = status || "draft";
      await positionType.save();
    } else {
      positionType = new PositionType({
        applicationId,
        employeeId,
        positionAppliedFor,
        status: status || "draft",
      });
      await positionType.save();
    }

    if (status === "completed") {
      const application = await OnboardingApplication.findById(applicationId);
      if (application) {
        if (!application.completedForms.includes("positionType")) {
          application.completedForms.push("positionType");
        }
        application.completionPercentage = application.calculateCompletionPercentage();
        await application.save();
      }
    }

    res.status(200).json({
      success: true,
      message: "Position type saved successfully",
      data: { applicationId, ...positionType.toObject() },
    });
  } catch (error) {
    console.error("Error saving position type:", error);
    res.status(500).json({
      success: false,
      message: "Failed to save position type",
      error: error.message,
    });
  }
});

router.get("/position-type/get/:applicationId", async (req, res) => {
  try {
    const { applicationId } = req.params;
    const positionType = await PositionType.findOne({ applicationId });

    if (!positionType) {
      return res.status(404).json({
        success: false,
        message: "Position type not found",
      });
    }

    res.status(200).json({
      success: true,
      positionType,
    });
  } catch (error) {
    console.error("Error fetching position type:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch position type",
      error: error.message,
    });
  }
});

module.exports = router;
