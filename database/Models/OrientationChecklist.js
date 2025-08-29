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
    readPoliciesAndScope: { type: Boolean, default: false },        // policies/procedures + scope of services & clients
    understandDuties: { type: Boolean, default: false },            // assigned duties/responsibilities
    reportEmergencies: { type: Boolean, default: false },           // report emergencies/problems/progress to nurse
    reportTBExposure: { type: Boolean, default: false },            // must report TB exposure
    understandClientRights: { type: Boolean, default: false },      // client rights
    readProcedures: { type: Boolean, default: false },              // handling complaints, emergencies, incidents
    understandDocumentation: { type: Boolean, default: false },     // daily documentation
    receivedHandbook: { type: Boolean, default: false },            // received Employee Handbook

    // Signatures
    employeeSignature: { type: String },
    employeeSignatureDate: { type: Date },
    agencySignature: { type: String },
    agencySignatureDate: { type: Date },

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
  { timestamps: true }
);

module.exports = mongoose.model(
  "OrientationChecklist",
  OrientationChecklistSchema
);
