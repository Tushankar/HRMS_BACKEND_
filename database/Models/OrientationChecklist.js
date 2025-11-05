const mongoose = require("mongoose");

// Orientation Checklist Schema (Exhibit 6b)
const OrientationChecklistSchema = new mongoose.Schema(
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

    // Orientation Acknowledgments (checkboxes)
    policies: { type: Boolean, default: false }, // policies/procedures + scope of services & clients
    duties: { type: Boolean, default: false }, // assigned duties/responsibilities
    emergencies: { type: Boolean, default: false }, // report emergencies/problems/progress to nurse
    tbExposure: { type: Boolean, default: false }, // must report TB exposure
    clientRights: { type: Boolean, default: false }, // client rights
    complaints: { type: Boolean, default: false }, // handling complaints, emergencies, incidents
    documentation: { type: Boolean, default: false }, // daily documentation
    handbook: { type: Boolean, default: false }, // received Employee Handbook

    // Signatures - matching LegalDisclosures pattern
    applicantSignature: { type: String },
    signatureDate: { type: Date },
    agencySignature: { type: String },
    agencySignatureDate: { type: Date },

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
  { timestamps: true }
);

module.exports = mongoose.model(
  "OrientationChecklist",
  OrientationChecklistSchema
);
