const mongoose = require("mongoose");

// Code of Ethics Form Schema (Exhibit 3)
const CodeOfEthicsSchema = new mongoose.Schema(
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
    // Employee Information
    // employeeInfo: {
    //   employeeName: { type: String },
    //   position: { type: String },
    //   department: { type: String },
    //   startDate: { type: Date },
    // },
    // Ethics Rules Acknowledgment
    // ethicsAcknowledgment: {
    //   noPersonalUseOfClientCar: { type: Boolean },
    //   noConsumingClientFood: { type: Boolean },
    //   noPersonalPhoneCalls: { type: Boolean },
    //   noPoliticalReligiousDiscussions: { type: Boolean },
    //   noPersonalProblemDiscussion: { type: Boolean },
    //   noAcceptingMoney: { type: Boolean },
    //   noAcceptingGifts: { type: Boolean },
    //   professionalAppearance: { type: Boolean },
    //   respectfulTreatment: { type: Boolean },
    //   confidentialityMaintained: { type: Boolean },
    //   reportSafetyConcerns: { type: Boolean },
    //   followCompanyPolicies: { type: Boolean },
    //   avoidConflictOfInterest: { type: Boolean },
    //   properDocumentation: { type: Boolean },
    //   continuousImprovement: { type: Boolean },
    // },
    // // Additional Commitments
    // additionalCommitments: {
    //   attendTrainingSessions: { type: Boolean },
    //   maintainCertifications: { type: Boolean },
    //   followSafetyProtocols: { type: Boolean },
    //   respectClientRights: { type: Boolean },
    //   maintainBoundaries: { type: Boolean },
    // },
    // // Agreement Statement
    // agreement: {
    //   readAndUnderstood: { type: Boolean },
    //   agreeToComply: { type: Boolean },
    //   understandConsequences: { type: Boolean },
    //   willingToSeekGuidance: { type: Boolean },
    // },
    // Acknowledgment
    acknowledgment: {
      type: Boolean,
      default: false,
    },

    // Signature
    employeeSignature: { type: String },
    signatureDate: { type: Date },
    // Supervisor Acknowledgment
    // supervisorInfo: {
    //   supervisorName: { type: String },
    //   supervisorSignature: { type: String },
    //   supervisorDate: { type: Date },
    // },
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
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("CodeOfEthics", CodeOfEthicsSchema);
