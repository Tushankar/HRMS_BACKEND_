const express = require("express");
const router = express.Router();
const PCAJobDescription = require("../../database/Models/PCAJobDescription");
const CNAJobDescription = require("../../database/Models/CNAJobDescription");
const LPNJobDescription = require("../../database/Models/LPNJobDescription");
const RNJobDescription = require("../../database/Models/RNJobDescription");
const OnboardingApplication = require("../../database/Models/OnboardingApplication");

// Helper function to get the correct model based on job type
const getJobDescriptionModel = (jobType) => {
  switch (jobType.toUpperCase()) {
    case "PCA":
      return PCAJobDescription;
    case "CNA":
      return CNAJobDescription;
    case "LPN":
      return LPNJobDescription;
    case "RN":
      return RNJobDescription;
    default:
      throw new Error(`Invalid job description type: ${jobType}`);
  }
};

// Save Job Description Acknowledgment (Draft or Complete)
router.post("/save-job-description", async (req, res) => {
  try {
    const { applicationId, employeeId, formData, status } = req.body;

    // Validate required fields
    if (!applicationId || !employeeId) {
      return res.status(400).json({
        success: false,
        message: "Application ID and Employee ID are required",
      });
    }

    const jobType = formData?.jobDescriptionType || "RN";
    const JobModel = getJobDescriptionModel(jobType);

    // Check if job description already exists
    let jobDesc = await JobModel.findOne({
      applicationId,
    });

    if (jobDesc) {
      // Update existing record - only update signature fields
      if (formData) {
        // Update staff signature if provided
        if (formData.staffSignature !== undefined) {
          jobDesc.staffSignature = {
            signature: formData.staffSignature.signature || "",
            date: formData.staffSignature.date
              ? new Date(formData.staffSignature.date)
              : null,
            digitalSignature: formData.staffSignature.digitalSignature || true,
          };
        }

        // Update supervisor signature if provided
        if (formData.supervisorSignature !== undefined) {
          jobDesc.supervisorSignature = {
            signature: formData.supervisorSignature.signature || "",
            supervisorName: formData.supervisorSignature.supervisorName || "",
            supervisorTitle: formData.supervisorSignature.supervisorTitle || "",
            date: formData.supervisorSignature.date
              ? new Date(formData.supervisorSignature.date)
              : null,
            digitalSignature:
              formData.supervisorSignature.digitalSignature || true,
          };
        }

        // Update acknowledgment if provided
        if (formData.acknowledgment) {
          jobDesc.acknowledgment = formData.acknowledgment;
        }

        // Update comments if provided
        if (formData.comments) {
          jobDesc.comments = formData.comments;
        }

        // Update other basic fields if provided
        if (formData.jobTitle) {
          jobDesc.jobTitle = formData.jobTitle;
        }
      }

      jobDesc.status = status || jobDesc.status;
      await jobDesc.save();
    } else {
      // Create new record with minimal data
      const newJobDescData = {
        applicationId,
        employeeId,
        status: status || "draft",
      };

      // Add signature data if provided
      if (formData) {
        if (formData.staffSignature !== undefined) {
          newJobDescData.staffSignature = {
            signature: formData.staffSignature.signature || "",
            date: formData.staffSignature.date
              ? new Date(formData.staffSignature.date)
              : null,
            digitalSignature: formData.staffSignature.digitalSignature || true,
          };
        }

        if (formData.supervisorSignature !== undefined) {
          newJobDescData.supervisorSignature = {
            signature: formData.supervisorSignature.signature || "",
            supervisorName: formData.supervisorSignature.supervisorName || "",
            supervisorTitle: formData.supervisorSignature.supervisorTitle || "",
            date: formData.supervisorSignature.date
              ? new Date(formData.supervisorSignature.date)
              : null,
            digitalSignature:
              formData.supervisorSignature.digitalSignature || true,
          };
        }

        // Add acknowledgment if provided
        if (formData.acknowledgment) {
          newJobDescData.acknowledgment = formData.acknowledgment;
        }

        // Add comments if provided
        if (formData.comments) {
          newJobDescData.comments = formData.comments;
        }

        // Add other fields if provided
        if (formData.jobTitle) {
          newJobDescData.jobTitle = formData.jobTitle;
        }
      }

      jobDesc = new JobModel(newJobDescData);
      await jobDesc.save();
    }

    // Update main application completion if completed
    if (status === "completed") {
      const application = await OnboardingApplication.findById(applicationId);
      if (application) {
        // Add to completed forms if not already there
        const formKey = `jobDescription${jobType}`;
        if (!application.completedForms.includes(formKey)) {
          application.completedForms.push(formKey);
        }

        application.completionPercentage =
          application.calculateCompletionPercentage();
        await application.save();

        return res.status(200).json({
          success: true,
          message: `${jobType} Job description completed successfully`,
          completionPercentage: application.completionPercentage,
          data: { jobDescription: jobDesc },
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `${jobType} Job description saved as ${status || "draft"}`,
      data: { jobDescription: jobDesc },
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

// Get Job Description by Application ID and Type
router.get("/get-job-description/:applicationId/:jobType", async (req, res) => {
  try {
    const { applicationId, jobType } = req.params;

    const JobModel = getJobDescriptionModel(jobType);
    const jobDesc = await JobModel.findOne({
      applicationId,
    });

    if (!jobDesc) {
      return res.status(404).json({
        success: false,
        message: `${jobType} Job description not found`,
      });
    }

    res.status(200).json({
      success: true,
      data: { jobDescription: jobDesc },
    });
  } catch (error) {
    console.error("Error retrieving job description:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

// Get All Job Descriptions for an Application
router.get("/get-all-job-descriptions/:applicationId", async (req, res) => {
  try {
    const { applicationId } = req.params;

    // Query all 4 job description models
    const [pcaJobDesc, cnaJobDesc, lpnJobDesc, rnJobDesc] = await Promise.all([
      PCAJobDescription.findOne({ applicationId }).lean(),
      CNAJobDescription.findOne({ applicationId }).lean(),
      LPNJobDescription.findOne({ applicationId }).lean(),
      RNJobDescription.findOne({ applicationId }).lean(),
    ]);

    const jobDescriptions = [];
    if (pcaJobDesc) jobDescriptions.push({ type: "PCA", ...pcaJobDesc });
    if (cnaJobDesc) jobDescriptions.push({ type: "CNA", ...cnaJobDesc });
    if (lpnJobDesc) jobDescriptions.push({ type: "LPN", ...lpnJobDesc });
    if (rnJobDesc) jobDescriptions.push({ type: "RN", ...rnJobDesc });

    res.status(200).json({
      success: true,
      count: jobDescriptions.length,
      data: { jobDescriptions },
    });
  } catch (error) {
    console.error("Error retrieving job descriptions:", error);
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

    // Try to find the job description in each model to determine the type
    let jobDesc = null;
    let jobType = null;

    const models = [
      { model: PCAJobDescription, type: "PCA" },
      { model: CNAJobDescription, type: "CNA" },
      { model: LPNJobDescription, type: "LPN" },
      { model: RNJobDescription, type: "RN" },
    ];

    for (const { model, type } of models) {
      jobDesc = await model.findById(id);
      if (jobDesc) {
        jobType = type;
        break;
      }
    }

    if (!jobDesc) {
      return res.status(404).json({
        success: false,
        message: "Job description not found",
      });
    }

    // Update supervisor signature
    jobDesc.supervisorSignature = supervisorSignature;
    jobDesc.status = "completed";
    await jobDesc.save();

    // Update main application
    const application = await OnboardingApplication.findById(
      jobDesc.applicationId
    );
    if (application) {
      const formKey = `jobDescription${jobType}`;
      if (!application.completedForms.includes(formKey)) {
        application.completedForms.push(formKey);
      }

      application.completionPercentage =
        application.calculateCompletionPercentage();
      await application.save();
    }

    res.status(200).json({
      success: true,
      message: `${jobType} Job description completed with supervisor signature`,
      data: { jobDescription: jobDesc },
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

// NEW SIMPLIFIED API - For direct job description form submission
router.post("/:applicationId/:jobType", async (req, res) => {
  try {
    const { applicationId, jobType } = req.params;
    const {
      staffSignature,
      supervisorSignature,
      status = "draft",
      employeeId,
    } = req.body;

    console.log("Received job description submission:", {
      applicationId,
      jobType,
      staffSignature,
      supervisorSignature,
      status,
      employeeId,
    });

    // Validate job type
    const validJobTypes = ["PCA", "CNA", "LPN", "RN"];
    if (!validJobTypes.includes(jobType.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: `Invalid job type. Must be one of: ${validJobTypes.join(
          ", "
        )}`,
      });
    }

    const JobModel = getJobDescriptionModel(jobType);

    // Check if job description already exists
    let jobDesc = await JobModel.findOne({ applicationId });

    if (jobDesc) {
      // Update existing record
      if (staffSignature) {
        jobDesc.staffSignature = staffSignature;
      }
      // Supervisor signature is HR-only. Ignore any supervisorSignature provided by employee submissions to prevent unauthorized overwrites.
      if (supervisorSignature) {
        console.log(
          "⚠️  Ignoring supervisorSignature from employee submission - supervisor signatures must be set via HR workflows"
        );
      }
      jobDesc.status = status;
      await jobDesc.save();
    } else {
      // For new records, we need employeeId
      let finalEmployeeId = employeeId;

      if (!finalEmployeeId) {
        // Try to get employeeId from the OnboardingApplication
        const application = await OnboardingApplication.findById(applicationId);
        if (application && application.employeeId) {
          finalEmployeeId = application.employeeId;
        } else {
          // Use a default test employeeId for development
          finalEmployeeId = "67e0f8770c6feb6ba99d11d2";
          console.log(
            "Using default employeeId for development:",
            finalEmployeeId
          );
        }
      }

      // Create new record - MUST include employeeId. Do NOT initialize supervisorSignature here; keep DB schema intact but let HR set it later.
      const newJobDescData = {
        applicationId,
        employeeId: finalEmployeeId,
        staffSignature: staffSignature || {
          signature: "",
          date: null,
          digitalSignature: false,
        },
        status,
      };

      jobDesc = new JobModel(newJobDescData);
      await jobDesc.save();
    }

    // Update main application if completed
    if (status === "completed") {
      const application = await OnboardingApplication.findById(applicationId);
      if (application) {
        const formKey = `jobDescription${jobType.toUpperCase()}`;
        if (!application.completedForms.includes(formKey)) {
          application.completedForms.push(formKey);
        }
        application.completionPercentage =
          application.calculateCompletionPercentage();
        await application.save();
      }
    }

    res.status(200).json({
      success: true,
      message: `${jobType.toUpperCase()} Job Description ${
        status === "completed" ? "submitted" : "saved"
      } successfully`,
      data: jobDesc,
    });
  } catch (error) {
    console.error("Error saving job description:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

// GET Job Description by Application ID and Type - Simplified
router.get("/:applicationId/:jobType", async (req, res) => {
  try {
    const { applicationId, jobType } = req.params;

    console.log("Fetching job description:", { applicationId, jobType });

    const JobModel = getJobDescriptionModel(jobType);
    const jobDesc = await JobModel.findOne({ applicationId });

    if (!jobDesc) {
      return res.status(404).json({
        success: false,
        message: `${jobType.toUpperCase()} Job Description not found`,
      });
    }

    res.status(200).json({
      success: true,
      data: jobDesc,
    });
  } catch (error) {
    console.error("Error retrieving job description:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

module.exports = router;
