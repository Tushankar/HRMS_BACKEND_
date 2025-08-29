const mongoose = require("mongoose");

// W-4 Tax Form Schema based on the 2025 IRS PDF (Exhibit 12a)
const W4FormSchema = new mongoose.Schema(
  {
    // Meta information, not part of the visual form but useful for tracking
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "OnboardingApplication",
      required: true,
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },

    // Step 1: Personal Information
    personalInfo: {
      firstName: { type: String },
      middleInitial: { type: String },
      lastName: { type: String },
      address: { type: String },
      cityStateZip: { type: String },
      socialSecurityNumber: { type: String },
      filingStatus: {
        type: String,
        enum: [
          "single_or_married_filing_separately",
          "married_filing_jointly_or_qualifying_surviving_spouse",
          "head_of_household",
        ],
      },
    },

    // Step 2: Multiple Jobs or Spouse Works
    multipleJobsOption: { type: String },

    // Step 3: Claim Dependents and Other Credits
    dependents: {
      qualifyingChildren: { type: String }, // Direct input from form
      otherDependents: { type: String }, // Direct input from form
      totalCredits: { type: String }, // Direct input from form
    },

    // Step 4: Other Adjustments (Optional)
    otherAdjustments: {
      otherIncome: { type: String }, // 4(a)
      deductions: { type: String }, // 4(b)
      extraWithholding: { type: String }, // 4(c)
    },
    
    // Exemption from withholding
    exempt: { type: Boolean, default: false },

    // Step 5: Sign Here
    employeeSignature: { type: String },
    signatureDate: { type: String },

    // Employer Use Only Section
    employerInfo: {
      employerName: { type: String },
      employerAddress: { type: String },
      firstDateOfEmployment: { type: String },
      employerEIN: { type: String },
    },
    
    // Internal status tracking
    status: {
      type: String,
      enum: ["draft", "completed", "submitted", "approved", "rejected"],
      default: "draft",
    },

    // HR Review and Feedback
    hrFeedback: {
      comment: {
        type: String,
      },
      reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
      },
      reviewedAt: {
        type: Date,
      },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("W4Form", W4FormSchema);
