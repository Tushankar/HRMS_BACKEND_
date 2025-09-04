const mongoose = require("mongoose");

// PCA Job Description Schema (Exhibit 1a)
const PCAJobDescriptionSchema = new mongoose.Schema(
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
    // Job Description Specific Info
    jobTitle: {
      type: String,
      default: "Personal Care Assistant",
    },
    exhibitNumber: {
      type: String,
      default: "1a",
    },
    // Employee Information
    employeeInfo: {
      employeeName: { type: String },
      employeeId: { type: String },
      department: { type: String, default: "Personal Care" },
      hireDate: { type: Date },
    },
    // Job Description Content
    jobDescriptionContent: {
      positionSummary: { type: String },
      keyResponsibilities: [{ type: String }],
      qualifications: [{ type: String }],
      workingConditions: { type: String },
      reportingStructure: { type: String },
    },
    // Acknowledgment
    acknowledgment: {
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
      enum: ["draft", "staff_signed", "completed", "submitted", "under_review", "approved", "rejected"],
      default: "draft",
    },
    // HR Review and Feedback
    hrFeedback: {
      notes: { type: String },
      reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
      },
      timestamp: { type: Date, default: Date.now },
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

module.exports = mongoose.model("PCAJobDescription", PCAJobDescriptionSchema);
