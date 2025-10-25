const mongoose = require("mongoose");

// Non-Compete Agreement Schema (Exhibit 5)
const NonCompeteAgreementSchema = new mongoose.Schema(
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

    // Agreement Effective Date
    effectiveDate: {
      day: { type: Number },
      month: { type: String },
      year: { type: Number },
    },

    // Employee Information
    employeeInfo: {
      employeeName: { type: String },
      address: { type: String },
      position: { type: String },
    },

    // Company Information (fixed in the form, but kept for flexibility)
    companyInfo: {
      companyName: { type: String, default: "Pacific Health Systems LLC" },
      address: {
        street: {
          type: String,
          default: "303 Corporate Center Dr., Suite 325",
        },
        city: { type: String, default: "Stockbridge" },
        state: { type: String, default: "GA" },
        zipCode: { type: String, default: "30281" },
      },
    },

    // Signatures
    employeeSignature: { type: String },
    employeeSignatureDate: { type: Date },
    signedPdfPath: { type: String }, // Path to uploaded signed PDF
    companyRepresentative: {
      name: { type: String },
      title: { type: String },
      signature: { type: String },
      signatureDate: { type: Date },
    },

    // Employee uploaded signed form
    employeeUploadedForm: {
      filename: { type: String },
      filePath: { type: String },
      uploadedAt: { type: Date },
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
  "NonCompeteAgreement",
  NonCompeteAgreementSchema
);
