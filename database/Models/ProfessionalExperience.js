const mongoose = require("mongoose");

// Professional Experience Form Schema
const ProfessionalExperienceSchema = new mongoose.Schema(
  {
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

    // Military Service
    hasMilitaryService: { type: Boolean, default: false },
    militaryService: {
      branch: { type: String },
      from: { type: String },
      to: { type: String },
      rankAtDischarge: { type: String },
      typeOfDischarge: { type: String },
      otherThanHonorable: { type: String },
      mayContactSupervisor: { type: String },
      reasonForLeaving: { type: String },
    },

    // Documents
    resumePath: { type: String },
    coverLetterPath: { type: String },
    portfolioPath: { type: String },

    // Internal status tracking
    status: {
      type: String,
      enum: [
        "draft",
        "completed",
        "submitted",
        "under_review",
        "approved",
        "rejected",
      ],
      default: "draft",
    },

    // HR Review and Feedback
    hrFeedback: {
      comment: { type: String },
      reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
      },
      reviewedAt: { type: Date },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "ProfessionalExperience",
  ProfessionalExperienceSchema
);
