const mongoose = require("mongoose");

// Staff Misconduct Abuse Statement Form Schema (Exhibit 2)
const MisconductStatementSchema = new mongoose.Schema(
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

    // Staff Information
    staffInfo: {
      staffTitle: { type: String },
      employeeName: { type: String },
      employmentPosition: { type: String },
    },

    // Employee Acknowledgment / Statement
    acknowledgment: {
      understandsCodeOfConduct: { type: Boolean, default: false }, // "I must comply with ... Code of Conduct"
      noMisconductHistory: { type: Boolean, default: false }, // "I have never shown misconduct or abuse"
      formReadAndUnderstood: { type: Boolean, default: false }, // "I acknowledge ... read and understood"
    },

    // Employee Signature Section
    employeeSignature: {
      printedName: { type: String },
      position: { type: String },
      signature: { type: String },
      date: { type: Date },
    },

    // Witness / Verifier Statement
    verifier: {
      statement: { type: String }, // e.g., "has never been shown to have exhibited..."
      printedName: { type: String },
      signature: { type: String },
      date: { type: Date },
    },

    // Notary Affidavit
    notaryInfo: {
      state: { type: String, default: "Georgia" }, // fixed in form
      day: { type: Number },
      month: { type: String },
      year: { type: Number },
      notarySignature: { type: String },
      notarySeal: { type: String }, // optional (digital seal path/reference)
    },

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
  "MisconductStatement",
  MisconductStatementSchema
);
