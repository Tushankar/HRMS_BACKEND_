const mongoose = require("mongoose");

// Driving License Upload Schema
const DrivingLicenseSchema = new mongoose.Schema(
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

    // License Information
    licenseNumber: { type: String },
    licenseState: { type: String },
    expirationDate: { type: Date },
    licenseClass: { type: String },

    // Employee uploaded signed form (kept for backward compatibility)
    employeeUploadedForm: {
      filename: { type: String },
      filePath: { type: String },
      uploadedAt: { type: Date },
    },

    // Multiple uploaded files (new structure for multiple file support)
    uploadedFiles: [
      {
        filename: { type: String },
        filePath: { type: String },
        uploadedAt: { type: Date },
        fileType: { type: String, default: "document" }, // 'front', 'back', 'document', etc.
        originalName: { type: String },
      },
    ],

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

module.exports = mongoose.model("DrivingLicense", DrivingLicenseSchema);
