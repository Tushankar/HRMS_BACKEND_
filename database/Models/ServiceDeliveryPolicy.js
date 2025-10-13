const mongoose = require("mongoose");

// Service Delivery Policies Form Schema (Exhibit 4)
const ServiceDeliveryPolicySchema = new mongoose.Schema(
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

    // Policy Acknowledgments (5 fixed statements)
    policy1Acknowledged: { type: Boolean, default: false }, // No “EVV Login, No pay” + payroll submission
    policy2Acknowledged: { type: Boolean, default: false }, // No Call, No Show = termination
    policy3Acknowledged: { type: Boolean, default: false }, // Must inform supervisor for off-duty needs
    policy4Acknowledged: { type: Boolean, default: false }, // No borrowing money / personal challenges with clients
    policy5Acknowledged: { type: Boolean, default: false }, // Must seek approval before driving client

    // Employee Signature
    employeeSignature: { type: String },
    employeeSignatureDate: { type: Date },

    // Agency (Supervisor) Signature
    supervisorSignature: { type: String },
    supervisorSignatureDate: { type: Date },

    // Employee uploaded signed document
    employeeUploadedForm: {
      filename: { type: String },
      filePath: { type: String },
      uploadedAt: { type: Date },
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
  "ServiceDeliveryPolicy",
  ServiceDeliveryPolicySchema
);
