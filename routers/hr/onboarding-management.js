const express = require("express");
const OnboardingApplication = require("../../database/Models/OnboardingApplication");
const User = require("../../database/Models/Users");

const router = express.Router();

// Get all submitted onboarding applications for HR review
router.get("/onboarding-candidates", async (req, res) => {
  try {
    const applications = await OnboardingApplication.find({
      applicationStatus: "submitted"
    })
    .populate('employeeId', 'firstName lastName email')
    .sort({ submittedAt: -1 });

    res.status(200).json({
      message: "Onboarding candidates retrieved successfully",
      applications
    });

  } catch (error) {
    console.error("Error fetching onboarding candidates:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

// HR Accept onboarding application (moves to kanban)
router.post("/accept-onboarding/:applicationId", async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { hrId, comments } = req.body;

    const application = await OnboardingApplication.findById(applicationId);
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    if (application.applicationStatus !== "submitted") {
      return res.status(400).json({ message: "Application is not in submitted status" });
    }

    // Update application status to hr_accepted (moves to kanban)
    application.applicationStatus = "hr_accepted";
    application.hrAcceptedAt = new Date();
    application.hrAcceptedBy = hrId;
    application.reviewComments = comments || "Accepted by HR for review";

    await application.save();

    res.status(200).json({
      message: "Application accepted and moved to kanban board",
      application
    });

  } catch (error) {
    console.error("Error accepting onboarding application:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

// HR Cancel onboarding application 
router.post("/cancel-onboarding/:applicationId", async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { hrId, comments } = req.body;

    const application = await OnboardingApplication.findById(applicationId);
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    if (application.applicationStatus !== "submitted") {
      return res.status(400).json({ message: "Application is not in submitted status" });
    }

    // Update application status to rejected
    application.applicationStatus = "rejected";
    application.reviewedAt = new Date();
    application.reviewedBy = hrId;
    application.reviewComments = comments || "Cancelled by HR";

    await application.save();

    res.status(200).json({
      message: "Application cancelled",
      application
    });

  } catch (error) {
    console.error("Error cancelling onboarding application:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

// HR Final Decision (Accept/Reject from Kanban modal)
router.post("/final-decision/:applicationId", async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { decision, hrId, comments } = req.body; // decision: "accept" | "reject"

    if (!["accept", "reject"].includes(decision)) {
      return res.status(400).json({ message: "Decision must be 'accept' or 'reject'" });
    }

    const application = await OnboardingApplication.findById(applicationId);
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    if (application.applicationStatus !== "hr_accepted") {
      return res.status(400).json({ message: "Application is not in the correct status for final decision" });
    }

    // Update application with final decision
    application.applicationStatus = "completed";
    application.finalDecision = decision;
    application.finalDecisionAt = new Date();
    application.finalDecisionBy = hrId;
    application.finalDecisionComments = comments || `${decision === 'accept' ? 'Accepted' : 'Rejected'} by HR`;

    await application.save();

    res.status(200).json({
      message: `Application ${decision}ed and moved to completed`,
      application
    });

  } catch (error) {
    console.error("Error making final decision:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

// Get applications for kanban board (hr_accepted status)
router.get("/kanban-applications", async (req, res) => {
  try {
    const applications = await OnboardingApplication.find({
      applicationStatus: "hr_accepted"
    })
    .populate('employeeId', 'firstName lastName email')
    .populate('hrAcceptedBy', 'firstName lastName')
    .sort({ hrAcceptedAt: -1 });

    res.status(200).json({
      message: "Kanban applications retrieved successfully",
      applications
    });

  } catch (error) {
    console.error("Error fetching kanban applications:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

// Get hired candidates (completed status with finalDecision = accept)
router.get("/hired-candidates", async (req, res) => {
  try {
    const applications = await OnboardingApplication.find({
      applicationStatus: "completed",
      finalDecision: "accept"
    })
    .populate('employeeId', 'firstName lastName email phoneNumber position')
    .populate('finalDecisionBy', 'firstName lastName')
    .populate('hrAcceptedBy', 'firstName lastName')
    .sort({ finalDecisionAt: -1 });

    res.status(200).json({
      message: "Hired candidates retrieved successfully",
      applications
    });

  } catch (error) {
    console.error("Error fetching hired candidates:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

// Get completed applications
router.get("/completed-applications", async (req, res) => {
  try {
    const applications = await OnboardingApplication.find({
      applicationStatus: "completed"
    })
    .populate('employeeId', 'firstName lastName email')
    .populate('finalDecisionBy', 'firstName lastName')
    .sort({ finalDecisionAt: -1 });

    res.status(200).json({
      message: "Completed applications retrieved successfully",
      applications
    });

  } catch (error) {
    console.error("Error fetching completed applications:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

module.exports = router;
