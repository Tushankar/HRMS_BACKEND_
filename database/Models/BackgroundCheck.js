const mongoose = require("mongoose");

// Background Check Form Schema (Exhibit 7)
const BackgroundCheckSchema = new mongoose.Schema(
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

    // Applicant Information
    applicantInfo: {
      lastName: { type: String },
      firstName: { type: String },
      middleInitial: { type: String },
      socialSecurityNumber: { type: String },
      dateOfBirth: { type: Date },
      height: { type: String },
      weight: { type: String },
      sex: { type: String },
      eyeColor: { type: String },
      hairColor: { type: String },
      race: { type: String },
      address: {
        street: { type: String },
        city: { type: String },
        state: { type: String },
        zipCode: { type: String },
      },
    },

    // Employment Information
    employmentInfo: {
      provider: { type: String },
      positionAppliedFor: { type: String },
    },

    // Applicant Consent / Acknowledgment
    consentAcknowledgment: {
      awareOfFingerprintCheck: { type: Boolean, default: false },
      acceptedPrivacyRights: { type: Boolean, default: false },
      understoodApprovalProcess: { type: Boolean, default: false },
    },

    // Signatures
    applicantSignature: { type: String },
    applicantSignatureDate: { type: Date },

    // DBHDD Notification Cover Sheet
    notification: {
      providerName: { type: String },
      applicantName: { type: String },
      directContactName: { type: String },
      contactPhone: { type: String },
      contactEmail: { type: String },
    },

    status: {
      type: String,
      enum: ["draft", "completed", "submitted", "under_review", "approved", "rejected"],
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
  "BackgroundCheck",
  BackgroundCheckSchema
);
