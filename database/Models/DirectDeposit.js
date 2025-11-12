const mongoose = require("mongoose");

// Standard Form 1199A - Direct Deposit Sign-Up Form
const DirectDepositFormSchema = new mongoose.Schema(
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

    // Company and Employee Information
    companyName: { type: String },
    employeeName: { type: String },
    employeeNumber: { type: String },

    // Account 1
    accounts_1_action: { type: String },
    accounts_1_accountType: { type: String },
    accounts_1_accountHolderName: { type: String },
    accounts_1_routingNumber: { type: String },
    accounts_1_accountNumber: { type: String },
    accounts_1_bankName: { type: String },
    accounts_1_depositType: { type: String },
    accounts_1_depositPercent: { type: String },
    accounts_1_depositAmount: { type: String },
    accounts_1_depositRemainder: { type: Boolean, default: false },
    accounts_1_lastFourDigits: { type: String },

    // Account 2
    accounts_2_action: { type: String },
    accounts_2_accountType: { type: String },
    accounts_2_accountHolderName: { type: String },
    accounts_2_routingNumber: { type: String },
    accounts_2_accountNumber: { type: String },
    accounts_2_bankName: { type: String },
    accounts_2_depositType: { type: String },
    accounts_2_depositPercent: { type: String },
    accounts_2_depositAmount: { type: String },
    accounts_2_depositRemainder: { type: Boolean, default: false },
    accounts_2_lastFourDigits: { type: String },

    // Account 3
    accounts_3_action: { type: String },
    accounts_3_accountType: { type: String },
    accounts_3_accountHolderName: { type: String },
    accounts_3_routingNumber: { type: String },
    accounts_3_accountNumber: { type: String },
    accounts_3_bankName: { type: String },
    accounts_3_depositType: { type: String },
    accounts_3_depositPercent: { type: String },
    accounts_3_depositAmount: { type: String },
    accounts_3_depositRemainder: { type: Boolean, default: false },
    accounts_3_lastFourDigits: { type: String },

    // Signature fields
    employeeSignature: { type: String },
    employeeDate: { type: String },
    employerName: { type: String },
    employerSignature: { type: String },
    employerDate: { type: String },

    // Internal status tracking
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

    // Document Upload Fields
    employeeUploadedForm: {
      fileName: { type: String },
      filePath: { type: String },
      uploadedAt: { type: Date },
      fileSize: { type: Number },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("DirectDepositForm", DirectDepositFormSchema);
