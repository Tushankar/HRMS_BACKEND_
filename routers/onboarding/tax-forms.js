const express = require("express");
const W4Form = require("../../database/Models/W4Form");
const W9Form = require("../../database/Models/W9Form");
const OnboardingApplication = require("../../database/Models/OnboardingApplication");

const router = express.Router();

// Helper function to map frontend filing status to schema enum values
function mapFilingStatus(status) {
  const mapping = {
    'single': 'single_or_married_filing_separately',
    'married': 'married_filing_jointly_or_qualifying_surviving_spouse',
    'headOfHousehold': 'head_of_household'
  };
  return mapping[status] || status;
}

// Helper function to map frontend tax classification to schema enum values
function mapTaxClassification(classification) {
  const mapping = {
    'individual': 'individual_sole_proprietor',
    'c-corporation': 'c_corporation',
    's-corporation': 's_corporation',
    'partnership': 'partnership',
    'trust-estate': 'trust_estate',
    'llc': 'llc',
    'other': 'other'
  };
  return mapping[classification] || classification;
}

// Helper function to map schema enum values back to frontend format
function mapTaxClassificationToFrontend(classification) {
  const mapping = {
    'individual_sole_proprietor': 'individual',
    'c_corporation': 'c-corporation',
    's_corporation': 's-corporation',
    'partnership': 'partnership',
    'trust_estate': 'trust-estate',
    'llc': 'llc',
    'other': 'other'
  };
  return mapping[classification] || classification;
}

// Save or update W-4 form
router.post("/save-w4-form", async (req, res) => {
  try {
    const { applicationId, employeeId, formData, status = "draft" } = req.body;

    console.log("W4 Form Save Request:");
    console.log("- ApplicationID:", applicationId);
    console.log("- EmployeeID:", employeeId);
    console.log("- Status:", status);
    console.log("- FormData:", JSON.stringify(formData, null, 2));

    if (!applicationId || !employeeId) {
      return res.status(400).json({ message: "Application ID and Employee ID are required" });
    }

    // Check if application exists
    const application = await OnboardingApplication.findById(applicationId);
    if (!application) {
      return res.status(404).json({ message: "Onboarding application not found" });
    }

    // Find existing form or create new one
    let w4Form = await W4Form.findOne({ applicationId });
    
    // Map frontend flat structure to backend nested structure
    const mappedData = {
      personalInfo: {
        firstName: formData.firstName,
        middleInitial: formData.middleInitial,
        lastName: formData.lastName,
        address: formData.address,
        cityStateZip: formData.cityStateZip,
        socialSecurityNumber: formData.socialSecurityNumber,
        filingStatus: mapFilingStatus(formData.filingStatus)
      },
      multipleJobsOption: formData.multipleJobsOption,
      dependents: {
        qualifyingChildren: formData.qualifyingChildren,
        otherDependents: formData.otherDependents,
        totalCredits: formData.totalCredits
      },
      otherAdjustments: {
        otherIncome: formData.otherIncome,
        deductions: formData.deductions,
        extraWithholding: formData.extraWithholding
      },
      employeeSignature: formData.employeeSignature,
      signatureDate: formData.signatureDate,
      employerInfo: {
        employerName: formData.employerName,
        employerAddress: formData.employerAddress,
        firstDateOfEmployment: formData.firstDateOfEmployment,
        employerEIN: formData.employerEIN
      },
      exempt: formData.exempt || false
    };
    
    console.log("Mapped Data Structure:", JSON.stringify(mappedData, null, 2));
    
    if (w4Form) {
      // Update existing form
      Object.assign(w4Form, mappedData);
      w4Form.status = status;
    } else {
      // Create new form
      w4Form = new W4Form({
        applicationId,
        employeeId,
        ...mappedData,
        status
      });
    }

    await w4Form.save();

    console.log("Saved W4 Form:", JSON.stringify(w4Form.toObject(), null, 2));

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
      
      application.completionPercentage = application.calculateCompletionPercentage();
      await application.save();
    }

    const message = status === "draft" ? "W-4 form saved as draft" : "W-4 form completed";

    res.status(200).json({
      message,
      w4Form,
      completionPercentage: application.completionPercentage
    });

  } catch (error) {
    console.error("Error saving W-4 form:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

// Get W-4 form
router.get("/get-w4-form/:applicationId", async (req, res) => {
  try {
    const { applicationId } = req.params;

    const w4Form = await W4Form.findOne({ applicationId });
    
    if (!w4Form) {
      return res.status(404).json({ message: "W-4 form not found" });
    }

    // Flatten the nested structure for frontend compatibility
    const flattenedW4Form = {
      _id: w4Form._id,
      applicationId: w4Form.applicationId,
      employeeId: w4Form.employeeId,
      // Personal Information (Step 1)
      firstName: w4Form.personalInfo?.firstName || "",
      middleInitial: w4Form.personalInfo?.middleInitial || "",
      lastName: w4Form.personalInfo?.lastName || "",
      address: w4Form.personalInfo?.address || "",
      cityStateZip: w4Form.personalInfo?.cityStateZip || "",
      socialSecurityNumber: w4Form.personalInfo?.socialSecurityNumber || "",
      filingStatus: w4Form.personalInfo?.filingStatus || "",
      // Multiple Jobs Option (Step 2)
      multipleJobsOption: w4Form.multipleJobsOption || "",
      // Dependents (Step 3)
      qualifyingChildren: w4Form.dependents?.qualifyingChildren || "",
      otherDependents: w4Form.dependents?.otherDependents || "",
      totalCredits: w4Form.dependents?.totalCredits || "",
      // Other Adjustments (Step 4)
      otherIncome: w4Form.otherAdjustments?.otherIncome || "",
      deductions: w4Form.otherAdjustments?.deductions || "",
      extraWithholding: w4Form.otherAdjustments?.extraWithholding || "",
      // Employee Signature (Step 5)
      employeeSignature: w4Form.employeeSignature || "",
      signatureDate: w4Form.signatureDate || "",
      exempt: w4Form.exempt || false,
      // Employer Information
      employerName: w4Form.employerInfo?.employerName || "",
      employerAddress: w4Form.employerInfo?.employerAddress || "",
      firstDateOfEmployment: w4Form.employerInfo?.firstDateOfEmployment || "",
      employerEIN: w4Form.employerInfo?.employerEIN || "",
      // Metadata
      createdAt: w4Form.createdAt,
      updatedAt: w4Form.updatedAt,
      status: w4Form.status
    };

    res.status(200).json({
      message: "W-4 form retrieved successfully",
      w4Form: flattenedW4Form
    });

  } catch (error) {
    console.error("Error getting W-4 form:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

// Save or update W-9 form
router.post("/save-w9-form", async (req, res) => {
  try {
    console.log("🔄 Processing W9 form save request...");
    console.log("Request body:", JSON.stringify(req.body, null, 2));
    
    const { applicationId, employeeId, formData, status = "draft" } = req.body;

    if (!applicationId || !employeeId) {
      console.log("❌ Missing required fields: applicationId or employeeId");
      return res.status(400).json({ message: "Application ID and Employee ID are required" });
    }

    console.log("✅ Required fields present:", { applicationId, employeeId, status });

    // Check if application exists
    const application = await OnboardingApplication.findById(applicationId);
    if (!application) {
      console.log("❌ Application not found:", applicationId);
      return res.status(404).json({ message: "Onboarding application not found" });
    }

    console.log("✅ Application found:", application._id);

    // Find existing form or create new one
    let w9Form = await W9Form.findOne({ applicationId });
    
    console.log("📋 Form Data received:", JSON.stringify(formData, null, 2));
    
    // Map frontend data to backend schema format
    const mappedFormData = {
      ...formData,
      taxClassification: mapTaxClassification(formData.taxClassification)
    };
    
    console.log("🔄 Mapped form data:", JSON.stringify(mappedFormData, null, 2));
    
    if (w9Form) {
      console.log("📝 Updating existing W9 form:", w9Form._id);
      // Update existing form
      Object.assign(w9Form, mappedFormData);
      w9Form.status = status;
    } else {
      console.log("✨ Creating new W9 form");
      // Create new form
      w9Form = new W9Form({
        applicationId,
        employeeId,
        ...mappedFormData,
        status
      });
    }

    console.log("💾 Attempting to save W9 form...");
    await w9Form.save();
    console.log("✅ W9 form saved successfully:", w9Form._id);

    // Update application progress
    if (status === "completed") {
      // Ensure completedForms array exists
      if (!application.completedForms) {
        application.completedForms = [];
      }
      
      // Check if W-9 Form is already marked as completed
      if (!application.completedForms.includes("W-9 Form")) {
        application.completedForms.push("W-9 Form");
      }
      
      application.completionPercentage = application.calculateCompletionPercentage();
      await application.save();
    }

    const message = status === "draft" ? "W-9 form saved as draft" : "W-9 form completed";

    res.status(200).json({
      message,
      w9Form,
      completionPercentage: application.completionPercentage
    });

  } catch (error) {
    console.error("❌ Error saving W-9 form:");
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    
    // If it's a validation error, provide more specific details
    if (error.name === 'ValidationError') {
      console.error("Validation errors:", error.errors);
      const validationMessages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: "Validation failed", 
        errors: validationMessages,
        details: error.errors 
      });
    }
    
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

// Get W-9 form
router.get("/get-w9-form/:applicationId", async (req, res) => {
  try {
    const { applicationId } = req.params;

    const w9Form = await W9Form.findOne({ applicationId });
    
    if (!w9Form) {
      return res.status(404).json({ message: "W-9 form not found" });
    }

    // Map backend schema values to frontend format
    const frontendW9Form = {
      ...w9Form.toObject(),
      taxClassification: mapTaxClassificationToFrontend(w9Form.taxClassification)
    };

    res.status(200).json({
      message: "W-9 form retrieved successfully",
      w9Form: frontendW9Form
    });

  } catch (error) {
    console.error("Error getting W-9 form:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

module.exports = router;
