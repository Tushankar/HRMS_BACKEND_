const mongoose = require("mongoose");

const LegalDisclosuresSchema = new mongoose.Schema(
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
    employmentAtWill: {
      type: Boolean,
      required: true,
      default: false,
    },
    backgroundCheckConsent: {
      type: Boolean,
      required: true,
      default: false,
    },
    drugTestingConsent: {
      type: Boolean,
      required: true,
      default: false,
    },
    accuracyDeclaration: {
      type: Boolean,
      required: true,
      default: false,
    },
    contactReferencesAuth: {
      type: Boolean,
      required: true,
      default: false,
    },
    eeoStatement: {
      type: Boolean,
      required: true,
      default: false,
    },
    dataPrivacyConsent: {
      type: Boolean,
      required: true,
      default: false,
    },
    i9Acknowledgment: {
      type: Boolean,
      required: true,
      default: false,
    },
    eSignatureAgreement: {
      type: Boolean,
      required: true,
      default: false,
    },
    // Legal Questions
    usaCitizen: {
      type: Boolean,
      default: false,
    },
    workedForCompanyBefore: {
      type: Boolean,
      default: false,
    },
    workedForCompanyWhen: {
      type: String,
      default: "",
    },
    legallyAuthorizedToWorkUS: {
      type: Boolean,
      default: false,
    },
    requiresVisaSponsorship: {
      type: Boolean,
      default: false,
    },
    convictedOfFelony: {
      type: Boolean,
      default: false,
    },
    convictionExplanation: {
      type: String,
      default: "",
    },
    applicantSignature: {
      type: String,
      required: true,
    },
    signatureDate: {
      type: Date,
      required: true,
    },
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

module.exports = mongoose.model("LegalDisclosures", LegalDisclosuresSchema);
