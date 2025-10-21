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

module.exports = mongoose.model("DrivingLicense", DrivingLicenseSchema);
