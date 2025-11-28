const mongoose = require("mongoose");

// Main Onboarding Application Schema
const OnboardingApplicationSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    applicationStatus: {
      type: String,
      enum: [
        "draft",
        "submitted",
        "hr_accepted",
        "under_review",
        "completed",
        "approved",
        "rejected",
      ],
      default: "draft",
    },
    submittedAt: {
      type: Date,
    },
    reviewedAt: {
      type: Date,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    reviewComments: {
      type: String,
    },
    // HR Decision Tracking
    hrAcceptedAt: {
      type: Date,
    },
    hrAcceptedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    finalDecision: {
      type: String,
      enum: ["accept", "reject"],
    },
    finalDecisionAt: {
      type: Date,
    },
    finalDecisionBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    finalDecisionComments: {
      type: String,
    },
    // HR Notes to Employee (visible in employee dashboard)
    hrNotesToEmployee: {
      note: {
        type: String,
      },
      sentAt: {
        type: Date,
      },
      sentBy: {
        type: String,
        default: "HR",
      },
    },
    completionPercentage: {
      type: Number,
      default: 0,
    },
    // Forms completion tracking
    completedForms: [
      {
        type: String,
      },
    ],
    // Employment type selection
    employmentType: {
      type: String,
      enum: ["W-2", "1099"],
      default: null,
    },
    // Professional certificates storage
    professionalCertificates: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Method to calculate completion percentage
OnboardingApplicationSchema.methods.calculateCompletionPercentage =
  function () {
    const totalForms = 20;
    const completedFormsCount = this.completedForms.length;
    this.completionPercentage = Math.round(
      (completedFormsCount / totalForms) * 100
    );

    if (
      this.completionPercentage === 100 &&
      this.applicationStatus === "draft"
    ) {
      this.applicationStatus = "submitted";
      this.submittedAt = new Date();
    }

    return this.completionPercentage;
  };

module.exports = mongoose.model(
  "OnboardingApplication",
  OnboardingApplicationSchema
);
