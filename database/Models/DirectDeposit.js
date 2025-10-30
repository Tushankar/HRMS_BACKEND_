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

    // Section 1 - Payee Information
    name: { type: String },
    address: { type: String },
    city: { type: String },
    state: { type: String },
    zipCode: { type: String },
    telephone: { type: String },
    areaCode: { type: String },
    personEntitled: { type: String },
    claimId: { type: String },
    accountType: { type: String },
    paymentType: [{ type: String }],
    accountNumber: { type: String },
    allotmentType: { type: String },
    allotmentAmount: { type: String },
    
    // Section 2 - Government Agency
    govAgencyName: { type: String },
    govAgencyAddress: { type: String },
    
    // Section 3 - Financial Institution
    financialInstitution: { type: String },
    routingNumber: { type: String },
    checkDigit: { type: String },
    accountTitle: { type: String },
    repName: { type: String },
    repTelephone: { type: String },
    
    // Signatures
    payeeSignature1: { type: String },
    payeeDate1: { type: String },
    payeeSignature2: { type: String },
    payeeDate2: { type: String },
    jointSignature1: { type: String },
    jointDate1: { type: String },
    jointSignature2: { type: String },
    jointDate2: { type: String },

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
