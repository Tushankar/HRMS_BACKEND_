const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const W4FormTemplate = require("../../database/Models/W4FormTemplate");
const W9FormTemplate = require("../../database/Models/W9FormTemplate");
const I9FormTemplate = require("../../database/Models/I9FormTemplate");
const W4Form = require("../../database/Models/W4Form");
const W9Form = require("../../database/Models/W9Form");
const I9Form = require("../../database/Models/I9Form");
const DirectDepositTemplate = require("../../database/Models/DirectDepositTemplate");
const DirectDepositForm = require("../../database/Models/DirectDeposit");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

// ========== W4 FORM ENDPOINTS ==========

// HR upload W4 template
router.post(
  "/hr-upload-w4-template",
  upload.single("file"),
  async (req, res) => {
    try {
      await W4FormTemplate.updateMany({}, { isActive: false });
      const template = new W4FormTemplate({
        filename: req.file.originalname,
        filePath: req.file.path,
        uploadedBy: req.body.uploadedBy,
        isActive: true,
      });
      await template.save();
      res.json({ success: true, template });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Get active W4 template
router.get("/get-w4-template", async (req, res) => {
  try {
    const template = await W4FormTemplate.findOne({ isActive: true });
    res.json({ template });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Serve W4 PDF without CSP restrictions
router.get("/serve-w4-pdf", async (req, res) => {
  try {
    const template = await W4FormTemplate.findOne({ isActive: true });
    if (!template) {
      return res.status(404).json({ message: "Template not found" });
    }
    const filePath = path.join(__dirname, "../../", template.filePath);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("X-Frame-Options", "ALLOWALL");
    res.sendFile(filePath);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Save W4 form status
router.post("/save-w4-form", async (req, res) => {
  try {
    const {
      applicationId,
      employeeId,
      formData,
      status = "draft",
      hrFeedback,
    } = req.body;

    // Handle HR feedback-only update
    if (!formData && hrFeedback) {
      let w4Form = await W4Form.findOne({ applicationId });
      if (!w4Form) {
        return res.status(404).json({ message: "W4 form not found" });
      }
      w4Form.hrFeedback = hrFeedback;
      w4Form.status = status || "under_review";
      await w4Form.save();
      return res.status(200).json({
        success: true,
        message: "HR feedback saved successfully",
        w4Form,
      });
    }

    if (!applicationId || !employeeId) {
      return res
        .status(400)
        .json({ message: "Application ID and Employee ID are required" });
    }

    // Check if application exists
    const OnboardingApplication = require("../../database/Models/OnboardingApplication");
    const application = await OnboardingApplication.findById(applicationId);
    if (!application) {
      return res
        .status(404)
        .json({ message: "Onboarding application not found" });
    }

    // Map flat form data to nested schema structure
    const mappedData = {
      // Step 1: Personal Information
      personalInfo: {
        firstName: formData.firstName || "",
        lastName: formData.lastName || "",
        address: formData.address || "",
        cityStateZip: formData.city || "",
        socialSecurityNumber: formData.ssn || "",
        filingStatus: formData.filingStatus || "",
      },

      // Step 2: Multiple Jobs or Spouse Works
      multipleJobsOption: formData.twoJobs ? "two_jobs" : "",

      // Step 3: Claim Dependents and Other Credits
      dependents: {
        qualifyingChildren: formData.childrenAmount || "",
        otherDependents: formData.otherDependents || "",
        totalCredits: formData.step3Total || "",
      },

      // Step 4: Other Adjustments
      otherAdjustments: {
        otherIncome: formData.step4a || "",
        deductions: formData.step4b || "",
        extraWithholding: formData.step4c || "",
      },

      // Step 5: Sign Here
      employeeSignature: formData.signature || "",
      signatureDate: formData.signatureDate
        ? new Date(formData.signatureDate)
        : null,

      // Employer Use Only Section
      employerInfo: {
        employerName: formData.employerName || "",
        firstDateOfEmployment: formData.employmentDate || "",
        employerEIN: formData.ein || "",
      },

      // Multiple Jobs Worksheet data
      multipleJobsWorksheet: {
        twoJobs: {
          amount: formData.multipleJobs1 || "",
        },
        threeJobs: {
          firstTwoJobs: formData.multipleJobs2a || "",
          thirdJob: formData.multipleJobs2b || "",
          total: formData.multipleJobs2c || "",
        },
        payPeriods: formData.multipleJobs3 || "",
        extraWithholding: formData.multipleJobs4 || "",
      },

      // Deductions Worksheet data
      deductionsWorksheet: {
        itemizedDeductions: formData.deductions1 || "",
        standardDeduction: formData.deductions2 || "",
        difference: formData.deductions3 || "",
        otherAdjustments: formData.deductions4 || "",
        total: formData.deductions5 || "",
      },

      status,
    };

    // Find existing form or create new one
    let w4Form = await W4Form.findOne({ applicationId });

    if (w4Form) {
      // Update existing form with mapped data
      Object.assign(w4Form, mappedData);
    } else {
      // Create new form with mapped data
      w4Form = new W4Form({
        applicationId,
        employeeId,
        ...mappedData,
      });
    }

    await w4Form.save({ validateBeforeSave: status !== "draft" });

    // Update application progress
    if (status === "completed") {
      // Ensure completedForms array exists
      if (!application.completedForms) {
        application.completedForms = [];
      }

      // Check if W-4 Form is already marked as completed
      if (!application.completedForms.includes("W-4 Form")) {
        application.completedForms.push("W-4 Form");
      }

      application.completionPercentage =
        application.calculateCompletionPercentage();
      await application.save();
    }

    const message =
      status === "draft" ? "W-4 form saved as draft" : "W-4 form completed";

    res.status(200).json({
      message,
      w4Form,
      completionPercentage: application.completionPercentage,
    });
  } catch (error) {
    console.error("Error saving W4 form:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
});

// Get W4 form
router.get("/get-w4-form/:applicationId", async (req, res) => {
  try {
    const { applicationId } = req.params;

    const w4Form = await W4Form.findOne({ applicationId });

    if (!w4Form) {
      return res.status(404).json({ message: "W4 form not found" });
    }

    // Map database fields to frontend field names
    const mappedData = {
      ...w4Form.toObject(),
      // Personal Info
      firstName: w4Form.personalInfo?.firstName || "",
      lastName: w4Form.personalInfo?.lastName || "",
      address: w4Form.personalInfo?.address || "",
      city: w4Form.personalInfo?.cityStateZip || "",
      ssn: w4Form.personalInfo?.socialSecurityNumber || "",
      filingStatus: w4Form.personalInfo?.filingStatus || "",

      // Dependents
      childrenAmount: w4Form.dependents?.qualifyingChildren || "",
      otherDependents: w4Form.dependents?.otherDependents || "",
      step3Total: w4Form.dependents?.totalCredits || "",

      // Multiple Jobs
      twoJobs: w4Form.multipleJobsOption === "two_jobs",

      // Other Adjustments
      step4a: w4Form.otherAdjustments?.otherIncome || "",
      step4b: w4Form.otherAdjustments?.deductions || "",
      step4c: w4Form.otherAdjustments?.extraWithholding || "",

      // Signature
      signature: w4Form.employeeSignature || "",
      signatureDate: w4Form.signatureDate || null,

      // Employer Info
      employerName: w4Form.employerInfo?.employerName || "",
      employmentDate: w4Form.employerInfo?.firstDateOfEmployment || "",
      ein: w4Form.employerInfo?.employerEIN || "",

      // Worksheets
      multipleJobs1: w4Form.multipleJobsWorksheet?.twoJobs?.amount || "",
      multipleJobs2a:
        w4Form.multipleJobsWorksheet?.threeJobs?.firstTwoJobs || "",
      multipleJobs2b: w4Form.multipleJobsWorksheet?.threeJobs?.thirdJob || "",
      multipleJobs2c: w4Form.multipleJobsWorksheet?.threeJobs?.total || "",
      multipleJobs3: w4Form.multipleJobsWorksheet?.payPeriods || "",
      multipleJobs4: w4Form.multipleJobsWorksheet?.extraWithholding || "",

      deductions1: w4Form.deductionsWorksheet?.itemizedDeductions || "",
      deductions2: w4Form.deductionsWorksheet?.standardDeduction || "",
      deductions3: w4Form.deductionsWorksheet?.difference || "",
      deductions4: w4Form.deductionsWorksheet?.otherAdjustments || "",
      deductions5: w4Form.deductionsWorksheet?.total || "",
    };

    res.status(200).json({
      message: "W4 form retrieved successfully",
      w4Form: mappedData,
    });
  } catch (error) {
    console.error("Error getting W4 form:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
});

// Get individual W9 submission by ID
router.get("/get-w9-submission/:id", async (req, res) => {
  try {
    const submission = await W9Form.findById(req.params.id).populate(
      "employeeId",
      "firstName lastName email"
    );
    res.json({ success: true, submission });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get individual W4 submission by ID
router.get("/get-w4-submission/:id", async (req, res) => {
  try {
    const submission = await W4Form.findById(req.params.id).populate(
      "employeeId",
      "firstName lastName email"
    );
    res.json({ success: true, submission });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Alias endpoint for clarity
router.get("/get-w4-submission-by-id/:id", async (req, res) => {
  try {
    const submission = await W4Form.findById(req.params.id).populate(
      "employeeId",
      "firstName lastName email"
    );
    res.json({ success: true, submission });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Employee upload signed W4
router.post(
  "/employee-upload-signed-w4",
  upload.single("file"),
  async (req, res) => {
    try {
      const { applicationId, employeeId } = req.body;
      const w4Form = await W4Form.findOneAndUpdate(
        { applicationId, employeeId },
        {
          employeeUploadedForm: {
            filename: req.file.originalname,
            filePath: req.file.path,
            uploadedAt: new Date(),
          },
          status: "submitted",
        },
        { new: true, upsert: true }
      );
      res.json({ success: true, w4Form });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// HR get all W4 submissions
router.get("/hr-get-all-w4-submissions", async (req, res) => {
  try {
    const submissions = await W4Form.find({
      "employeeUploadedForm.filename": { $exists: true },
    })
      .populate("employeeId", "firstName lastName email")
      .sort({ "employeeUploadedForm.uploadedAt": -1 });
    res.json({ success: true, submissions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ========== W9 FORM ENDPOINTS ==========

// HR upload W9 template
router.post(
  "/hr-upload-w9-template",
  upload.single("file"),
  async (req, res) => {
    try {
      await W9FormTemplate.updateMany({}, { isActive: false });
      const template = new W9FormTemplate({
        filename: req.file.originalname,
        filePath: req.file.path,
        uploadedBy: req.body.uploadedBy,
        isActive: true,
      });
      await template.save();
      res.json({ success: true, template });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Get active W9 template
router.get("/get-w9-template", async (req, res) => {
  try {
    const template = await W9FormTemplate.findOne({ isActive: true });
    res.json({ template });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Serve W9 PDF without CSP restrictions
router.get("/serve-w9-pdf", async (req, res) => {
  try {
    const template = await W9FormTemplate.findOne({ isActive: true });
    if (!template) {
      return res.status(404).json({ message: "Template not found" });
    }
    const filePath = path.join(__dirname, "../../", template.filePath);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("X-Frame-Options", "ALLOWALL");
    res.sendFile(filePath);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Save W9 form status
router.post("/save-w9-form", async (req, res) => {
  try {
    const {
      applicationId,
      employeeId,
      formData,
      status = "draft",
      hrFeedback,
    } = req.body;

    // Handle HR feedback-only update
    if (!formData && hrFeedback) {
      let w9Form = await W9Form.findOne({ applicationId });
      if (!w9Form) {
        return res.status(404).json({ message: "W9 form not found" });
      }
      w9Form.hrFeedback = hrFeedback;
      w9Form.status = status || "under_review";
      await w9Form.save();
      return res.status(200).json({
        success: true,
        message: "HR feedback saved successfully",
        w9Form,
      });
    }

    if (!applicationId || !employeeId) {
      return res
        .status(400)
        .json({ message: "Application ID and Employee ID are required" });
    }

    // Check if application exists
    const OnboardingApplication = require("../../database/Models/OnboardingApplication");
    const application = await OnboardingApplication.findById(applicationId);
    if (!application) {
      return res
        .status(404)
        .json({ message: "Onboarding application not found" });
    }

    // Determine if form has any data filled
    const hasData = formData && (
      formData.name ||
      formData.businessName ||
      formData.taxClassification ||
      formData.address ||
      formData.city ||
      (formData.ssn && formData.ssn.some(d => d)) ||
      (formData.ein && formData.ein.some(d => d)) ||
      formData.signature ||
      formData.signatureDate
    );

    // Map form data to schema
    const mappedData = {
      name: formData?.name || "",
      businessName: formData?.businessName || "",
      taxClassification: formData?.taxClassification || "individual_sole_proprietor",
      llcClassification: formData?.llcClassification || null,
      hasForeignPartnersOrOwners: formData?.foreignPartners || false,
      exemptions: {
        exemptPayeeCode: formData?.exemptPayeeCode || "",
        fatcaExemptionCode: formData?.fatcaCode || "",
      },
      address: {
        street: formData?.address || "",
        city: formData?.city || "",
      },
      accountNumbers: formData?.accountNumbers || "",
      socialSecurityNumber: formData?.ssn ? formData.ssn.join("") : "",
      employerIdentificationNumber: formData?.ein ? formData.ein.join("") : "",
      signature: formData?.signature || "",
      signatureDate: formData?.signatureDate ? new Date(formData.signatureDate) : null,
      status: hasData ? status : "draft",
    };

    // Find existing form or create new one
    let w9Form = await W9Form.findOne({ applicationId });

    if (w9Form) {
      Object.assign(w9Form, mappedData);
    } else {
      w9Form = new W9Form({
        applicationId,
        employeeId,
        ...mappedData,
      });
    }

    await w9Form.save({ validateBeforeSave: status !== "draft" });

    res.status(200).json({
      success: true,
      message: hasData ? "W9 form saved successfully" : "W9 form saved as draft",
      w9Form,
    });
  } catch (error) {
    console.error("Error saving W9 form:", error);
    res.status(500).json({ message: error.message });
  }
});

// Get W9 form
router.get("/get-w9-form/:applicationId", async (req, res) => {
  try {
    const { applicationId } = req.params;

    const w9Form = await W9Form.findOne({ applicationId });

    if (!w9Form) {
      return res.status(404).json({ message: "W9 form not found" });
    }

    // Map database fields to frontend field names
    const mappedData = {
      ...w9Form.toObject(),
      name: w9Form.name || "",
      businessName: w9Form.businessName || "",
      taxClassification: w9Form.taxClassification || "",
      llcClassification: w9Form.llcClassification || "",
      foreignPartners: w9Form.hasForeignPartnersOrOwners || false,
      exemptPayeeCode: w9Form.exemptions?.exemptPayeeCode || "",
      fatcaCode: w9Form.exemptions?.fatcaExemptionCode || "",
      address: w9Form.address?.street || "",
      city: w9Form.address?.city || "",
      accountNumbers: w9Form.accountNumbers || "",
      ssn: w9Form.socialSecurityNumber ? w9Form.socialSecurityNumber.split("") : Array(9).fill(""),
      ein: w9Form.employerIdentificationNumber ? w9Form.employerIdentificationNumber.split("") : Array(9).fill(""),
      signature: w9Form.signature || "",
      signatureDate: w9Form.signatureDate || null,
    };

    res.status(200).json({
      success: true,
      message: "W9 form retrieved successfully",
      w9Form: mappedData,
    });
  } catch (error) {
    console.error("Error getting W9 form:", error);
    res.status(500).json({ message: error.message });
  }
});

// Employee upload signed W9
router.post(
  "/employee-upload-signed-w9",
  upload.single("file"),
  async (req, res) => {
    try {
      const { applicationId, employeeId } = req.body;
      const w9Form = await W9Form.findOneAndUpdate(
        { applicationId, employeeId },
        {
          employeeUploadedForm: {
            filename: req.file.originalname,
            filePath: req.file.path,
            uploadedAt: new Date(),
          },
          status: "submitted",
        },
        { new: true, upsert: true }
      );
      res.json({ success: true, w9Form });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// HR get all W9 submissions
router.get("/hr-get-all-w9-submissions", async (req, res) => {
  try {
    const submissions = await W9Form.find({
      "employeeUploadedForm.filename": { $exists: true },
    })
      .populate("employeeId", "firstName lastName email")
      .sort({ "employeeUploadedForm.uploadedAt": -1 });
    res.json({ success: true, submissions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ========== I9 FORM ENDPOINTS ==========

// HR upload I9 template
router.post(
  "/hr-upload-i9-template",
  upload.single("file"),
  async (req, res) => {
    try {
      await I9FormTemplate.updateMany({}, { isActive: false });
      const template = new I9FormTemplate({
        filename: req.file.originalname,
        filePath: req.file.path,
        uploadedBy: req.body.uploadedBy,
        isActive: true,
      });
      await template.save();
      res.json({ success: true, template });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Get active I9 template
router.get("/get-i9-template", async (req, res) => {
  try {
    const template = await I9FormTemplate.findOne({ isActive: true });
    res.json({ template });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Serve I9 PDF without CSP restrictions
router.get("/serve-i9-pdf", async (req, res) => {
  try {
    const template = await I9FormTemplate.findOne({ isActive: true });
    if (!template) {
      return res.status(404).json({ message: "Template not found" });
    }
    const filePath = path.join(__dirname, "../../", template.filePath);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("X-Frame-Options", "ALLOWALL");
    res.sendFile(filePath);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Save I9 form status
router.post("/save-i9-form", async (req, res) => {
  try {
    const {
      applicationId,
      employeeId,
      status = "draft",
      hrFeedback,
    } = req.body;
    console.log("I9 Form save request:", {
      applicationId,
      employeeId,
      status,
      hrFeedback,
    });
    const updateData = { status };
    if (hrFeedback) {
      updateData.hrFeedback = hrFeedback;
    }
    const i9Form = await I9Form.findOneAndUpdate(
      { applicationId, employeeId },
      updateData,
      { new: true, upsert: true, validateBeforeSave: status !== "draft" }
    );
    res.json({ success: true, i9Form });
  } catch (error) {
    console.error("Error saving I9 form:", error);
    res.status(500).json({ message: error.message, stack: error.stack });
  }
});

// Employee upload signed I9
router.post(
  "/employee-upload-signed-i9",
  upload.single("file"),
  async (req, res) => {
    try {
      const { applicationId, employeeId } = req.body;
      const i9Form = await I9Form.findOneAndUpdate(
        { applicationId, employeeId },
        {
          employeeUploadedForm: {
            filename: req.file.originalname,
            filePath: req.file.path,
            uploadedAt: new Date(),
          },
          status: "submitted",
        },
        { new: true, upsert: true }
      );
      res.json({ success: true, i9Form });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// HR get all I9 submissions
router.get("/hr-get-all-i9-submissions", async (req, res) => {
  try {
    const submissions = await I9Form.find({
      "employeeUploadedForm.filename": { $exists: true },
    })
      .populate("employeeId", "firstName lastName email")
      .sort({ "employeeUploadedForm.uploadedAt": -1 });
    res.json({ success: true, submissions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Remove I9 upload
router.post("/remove-i9-upload", async (req, res) => {
  try {
    const { applicationId, employeeId } = req.body;

    if (!applicationId) {
      return res.status(400).json({ message: "Application ID is required" });
    }

    const i9Form = await I9Form.findOne({ applicationId });

    if (!i9Form || !i9Form.employeeUploadedForm) {
      return res.status(404).json({ message: "No uploaded form found" });
    }

    // Delete the file from the file system
    if (i9Form.employeeUploadedForm.filePath) {
      try {
        const filePath = path.join(
          __dirname,
          "../../",
          i9Form.employeeUploadedForm.filePath
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

    // Clear the uploaded form from the database
    i9Form.employeeUploadedForm = null;
    i9Form.status = "draft";

    await i9Form.save();

    res.status(200).json({
      message: "Uploaded form removed successfully",
      i9Form,
    });
  } catch (error) {
    console.error("Error removing uploaded form:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
});

// Remove W4 upload
router.post("/remove-w4-upload", async (req, res) => {
  try {
    const { applicationId, employeeId } = req.body;

    if (!applicationId) {
      return res.status(400).json({ message: "Application ID is required" });
    }

    const w4Form = await W4Form.findOne({ applicationId });

    if (!w4Form || !w4Form.employeeUploadedForm) {
      return res.status(404).json({ message: "No uploaded form found" });
    }

    // Delete the file from the file system
    if (w4Form.employeeUploadedForm.filePath) {
      try {
        const filePath = path.join(
          __dirname,
          "../../",
          w4Form.employeeUploadedForm.filePath
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

    // Clear the uploaded form from the database
    w4Form.employeeUploadedForm = null;
    w4Form.status = "draft";

    await w4Form.save();

    res.status(200).json({
      message: "Uploaded form removed successfully",
      w4Form,
    });
  } catch (error) {
    console.error("Error removing uploaded form:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
});

// Remove W9 upload
router.post("/remove-w9-upload", async (req, res) => {
  try {
    const { applicationId, employeeId } = req.body;

    if (!applicationId) {
      return res.status(400).json({ message: "Application ID is required" });
    }

    const w9Form = await W9Form.findOne({ applicationId });

    if (!w9Form || !w9Form.employeeUploadedForm) {
      return res.status(404).json({ message: "No uploaded form found" });
    }

    // Delete the file from the file system
    if (w9Form.employeeUploadedForm.filePath) {
      try {
        const filePath = path.join(
          __dirname,
          "../../",
          w9Form.employeeUploadedForm.filePath
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

    // Clear the uploaded form from the database
    w9Form.employeeUploadedForm = null;
    w9Form.status = "draft";

    await w9Form.save();

    res.status(200).json({
      message: "Uploaded form removed successfully",
      w9Form,
    });
  } catch (error) {
    console.error("Error removing uploaded form:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
});

// HR clear W4 submission
router.delete("/hr-clear-w4-submission/:id", async (req, res) => {
  try {
    await W4Form.findByIdAndUpdate(req.params.id, {
      $unset: { employeeUploadedForm: "" },
      status: "draft",
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// HR clear W9 submission
router.delete("/hr-clear-w9-submission/:id", async (req, res) => {
  try {
    await W9Form.findByIdAndUpdate(req.params.id, {
      $unset: { employeeUploadedForm: "" },
      status: "draft",
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// HR clear I9 submission
router.delete("/hr-clear-i9-submission/:id", async (req, res) => {
  try {
    await I9Form.findByIdAndUpdate(req.params.id, {
      $unset: { employeeUploadedForm: "" },
      status: "draft",
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ========== DIRECT DEPOSIT FORM ENDPOINTS ==========

// HR upload Direct Deposit template
router.post(
  "/hr-upload-direct-deposit-template",
  upload.single("file"),
  async (req, res) => {
    try {
      await DirectDepositTemplate.updateMany({}, { isActive: false });
      const template = new DirectDepositTemplate({
        fileName: req.file.originalname,
        filePath: req.file.path,
        uploadedBy: req.body.uploadedBy,
        isActive: true,
      });
      await template.save();
      res.json({ success: true, template });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Get active Direct Deposit template
router.get("/get-direct-deposit-template", async (req, res) => {
  try {
    const template = await DirectDepositTemplate.findOne({ isActive: true });
    res.json({ template });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Serve Direct Deposit PDF for inline viewing/editing
router.get("/serve-direct-deposit-pdf", async (req, res) => {
  try {
    const template = await DirectDepositTemplate.findOne({ isActive: true });
    if (!template) {
      return res.status(404).json({ message: "Template not found" });
    }
    const filePath = path.join(__dirname, "../../", template.filePath);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("X-Frame-Options", "ALLOWALL");
    res.sendFile(filePath);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Save Direct Deposit form status
router.post("/save-direct-deposit-form", async (req, res) => {
  try {
    const {
      applicationId,
      employeeId,
      status = "draft",
      hrFeedback,
    } = req.body;
    const updateData = { status };
    if (hrFeedback) {
      updateData.hrFeedback = hrFeedback;
    }
    const directDepositForm = await DirectDepositForm.findOneAndUpdate(
      { applicationId, employeeId },
      updateData,
      { new: true, upsert: true, validateBeforeSave: status !== "draft" }
    );
    res.json({ success: true, directDepositForm });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Employee upload signed Direct Deposit form
router.post(
  "/employee-upload-signed-direct-deposit",
  upload.single("file"),
  async (req, res) => {
    try {
      const { applicationId, employeeId } = req.body;
      const directDepositForm = await DirectDepositForm.findOneAndUpdate(
        { applicationId, employeeId },
        {
          employeeUploadedForm: {
            fileName: req.file.originalname,
            filePath: req.file.path,
            uploadedAt: new Date(),
            fileSize: req.file.size,
          },
          status: "submitted",
        },
        { new: true, upsert: true }
      );
      res.json({ success: true, directDepositForm });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// HR get all Direct Deposit submissions
router.get("/hr-get-all-direct-deposit-submissions", async (req, res) => {
  try {
    const submissions = await DirectDepositForm.find({
      "employeeUploadedForm.fileName": { $exists: true },
    })
      .populate("employeeId", "firstName lastName email")
      .sort({ "employeeUploadedForm.uploadedAt": -1 });
    res.json({ success: true, submissions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Remove Direct Deposit upload
router.post("/remove-direct-deposit-upload", async (req, res) => {
  try {
    const { applicationId, employeeId } = req.body;

    if (!applicationId) {
      return res.status(400).json({ message: "Application ID is required" });
    }

    const directDepositForm = await DirectDepositForm.findOne({
      applicationId,
    });

    if (!directDepositForm || !directDepositForm.employeeUploadedForm) {
      return res.status(404).json({ message: "No uploaded form found" });
    }

    // Delete the file from the file system
    if (directDepositForm.employeeUploadedForm.filePath) {
      try {
        const filePath = path.join(
          __dirname,
          "../../",
          directDepositForm.employeeUploadedForm.filePath
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

    // Clear the uploaded form from the database
    directDepositForm.employeeUploadedForm = null;
    directDepositForm.status = "draft";

    await directDepositForm.save();

    res.status(200).json({
      message: "Uploaded form removed successfully",
      directDepositForm,
    });
  } catch (error) {
    console.error("Error removing uploaded form:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
});

// HR clear Direct Deposit submission
router.delete("/hr-clear-direct-deposit-submission/:id", async (req, res) => {
  try {
    await DirectDepositForm.findByIdAndUpdate(req.params.id, {
      $unset: { employeeUploadedForm: "" },
      status: "draft",
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
