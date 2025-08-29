const express = require("express");
const router = express.Router();
const JobDescriptionAcknowledgment = require("../../database/Models/JobDescriptionAcknowledgment");
const OnboardingApplication = require("../../database/Models/OnboardingApplication");

// Save Job Description Acknowledgment (Draft or Complete)
router.post("/save-job-description", async (req, res) => {
  try {
    const { applicationId, employeeId, formData, status } = req.body;

    // Validate required fields
    if (!applicationId || !employeeId || !formData) {
      return res.status(400).json({
        success: false,
        message: "Application ID, Employee ID, and form data are required",
      });
    }

    // Check if job description acknowledgment already exists
    let jobDescAck = await JobDescriptionAcknowledgment.findOne({
      applicationId,
      jobDescriptionType: formData.jobDescriptionType,
    });

    if (jobDescAck) {
      // Update existing record
      Object.assign(jobDescAck, formData);
      jobDescAck.status = status || jobDescAck.status;
      await jobDescAck.save();
    } else {
      // Create new record
      jobDescAck = new JobDescriptionAcknowledgment({
        applicationId,
        employeeId,
        ...formData,
        status: status || "draft",
      });
      await jobDescAck.save();
    }

    // Update main application completion if completed
    if (status === "completed") {
      const application = await OnboardingApplication.findById(applicationId);
      if (application) {
        // Add to completed forms if not already there
        const formKey = `jobDescription${formData.jobDescriptionType}`;
        if (!application.completedForms.includes(formKey)) {
          application.completedForms.push(formKey);
        }
        
        application.completionPercentage = application.calculateCompletionPercentage();
        await application.save();

        return res.status(200).json({
          success: true,
          message: "Job description acknowledgment completed successfully",
          completionPercentage: application.completionPercentage,
          data: { jobDescriptionAcknowledgment: jobDescAck },
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `Job description acknowledgment saved as ${status || "draft"}`,
      data: { jobDescriptionAcknowledgment: jobDescAck },
    });

  } catch (error) {
    console.error("Error saving job description acknowledgment:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

// Get Job Description Acknowledgment by Application ID and Type
router.get("/get-job-description/:applicationId/:jobType", async (req, res) => {
  try {
    const { applicationId, jobType } = req.params;

    const jobDescAck = await JobDescriptionAcknowledgment.findOne({
      applicationId,
      jobDescriptionType: jobType.toUpperCase(),
    });

    if (!jobDescAck) {
      return res.status(404).json({
        success: false,
        message: "Job description acknowledgment not found",
      });
    }

    res.status(200).json({
      success: true,
      data: { jobDescriptionAcknowledgment: jobDescAck },
    });

  } catch (error) {
    console.error("Error retrieving job description acknowledgment:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

// Get All Job Description Acknowledgments for an Application
router.get("/get-all-job-descriptions/:applicationId", async (req, res) => {
  try {
    const { applicationId } = req.params;

    const jobDescAcks = await JobDescriptionAcknowledgment.find({
      applicationId,
    }).sort({ jobDescriptionType: 1 });

    res.status(200).json({
      success: true,
      count: jobDescAcks.length,
      data: { jobDescriptionAcknowledgments: jobDescAcks },
    });

  } catch (error) {
    console.error("Error retrieving job description acknowledgments:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

// Supervisor Sign Job Description
router.put("/supervisor-sign-job-description/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { supervisorSignature } = req.body;

    const jobDescAck = await JobDescriptionAcknowledgment.findById(id);

    if (!jobDescAck) {
      return res.status(404).json({
        success: false,
        message: "Job description acknowledgment not found",
      });
    }

    // Update supervisor signature
    jobDescAck.supervisorSignature = supervisorSignature;
    jobDescAck.status = "completed";
    await jobDescAck.save();

    // Update main application
    const application = await OnboardingApplication.findById(jobDescAck.applicationId);
    if (application) {
      const formKey = `jobDescription${jobDescAck.jobDescriptionType}`;
      if (!application.completedForms.includes(formKey)) {
        application.completedForms.push(formKey);
      }
      
      application.completionPercentage = application.calculateCompletionPercentage();
      await application.save();
    }

    res.status(200).json({
      success: true,
      message: "Job description acknowledgment completed with supervisor signature",
      data: { jobDescriptionAcknowledgment: jobDescAck },
    });

  } catch (error) {
    console.error("Error with supervisor signature:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

module.exports = router;
