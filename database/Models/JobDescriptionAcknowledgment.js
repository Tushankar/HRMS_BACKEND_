const mongoose = require("mongoose");

// Job Description Acknowledgment Schema (Exhibits 1a, 1b, 1c, 1d)
const JobDescriptionAcknowledgmentSchema = new mongoose.Schema(
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
    // Job Description Type
    jobDescriptionType: {
      type: String,
      enum: ["PCA", "CNA", "LPN", "RN"],
      required: true,
    },
    jobTitle: {
      type: String,
      required: true,
    },
    // Employee Information
    employeeInfo: {
      employeeName: { type: String },
      employeeId: { type: String },
      department: { type: String },
      hireDate: { type: Date },
    },
    // Job Description Content Reference
    jobDescriptionContent: {
      // Reference to which job description was reviewed
      exhibitNumber: { type: String }, // "1a", "1b", "1c", or "1d"
      jobDescriptionTitle: { type: String },
      reviewedDate: { type: Date },
    },
    // Acknowledgment
    acknowledgment: {
      // Staff acknowledgment
      hasReadJobDescription: { type: Boolean, default: false },
      understandsResponsibilities: { type: Boolean, default: false },
      agreesToPerformDuties: { type: Boolean, default: false },
      acknowledgesQualifications: { type: Boolean, default: false },
      understandsReportingStructure: { type: Boolean, default: false },
    },
    // Signatures
    staffSignature: {
      signature: { type: String },
      date: { type: Date },
      digitalSignature: { type: Boolean, default: false },
    },
    supervisorSignature: {
      signature: { type: String },
      supervisorName: { type: String },
      supervisorTitle: { type: String },
      date: { type: Date },
      digitalSignature: { type: Boolean, default: false },
    },
    // Form Status
    status: {
      type: String,
      enum: ["draft", "staff_signed", "completed", "submitted", "approved", "rejected"],
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
    // Comments
    comments: {
      staffComments: { type: String },
      supervisorComments: { type: String },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("JobDescriptionAcknowledgment", JobDescriptionAcknowledgmentSchema);
