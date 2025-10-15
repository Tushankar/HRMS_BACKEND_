const mongoose = require("mongoose");

// PCA Training Questions Schema
const PCATrainingQuestionsSchema = new mongoose.Schema(
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

    // Admin uploaded template/questions file
    adminUploadedFile: {
      filename: { type: String },
      originalName: { type: String },
      path: { type: String },
      mimeType: { type: String },
      uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
      },
      uploadedAt: { type: Date },
    },

    // Employee's downloaded and scanned/filled file
    employeeUploadedFile: {
      filename: { type: String },
      originalName: { type: String },
      path: { type: String },
      mimeType: { type: String },
      uploadedAt: { type: Date },
    },

    // Track employee's download activity
    downloadedAt: { type: Date },
    downloadCount: { type: Number, default: 0 },

    // Status tracking
    status: {
      type: String,
      enum: [
        "pending",
        "downloaded",
        "in_progress",
        "submitted",
        "under_review",
        "approved",
        "rejected",
      ],
      default: "pending",
    },

    // HR Feedback
    hrNotes: [
      {
        note: { type: String },
        addedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "user",
        },
        addedAt: { type: Date, default: Date.now },
      },
    ],

    // Submission tracking
    submittedAt: { type: Date },
    reviewedAt: { type: Date },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "PCATrainingQuestions",
  PCATrainingQuestionsSchema
);
