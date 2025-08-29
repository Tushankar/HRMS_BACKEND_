const mongoose = require("mongoose");

// Main Schema for the Direct Deposit Enrollment/Change Form (Exhibit 14)
const DirectDepositFormSchema = new mongoose.Schema(
  {
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "OnboardingApplication",
      required: true,
    },
    // Link to the employee/user record
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },

    // Header Information
    companyName: { type: String },
    clientNumber: { type: String },
    employeeName: { type: String },
    employeeNumber: { type: String },

    // Account 1
    account1Action: { type: String },
    account1Type: { type: String },
    account1HolderName: { type: String },
    account1RoutingNumber: { type: String },
    account1Number: { type: String },
    account1Institution: { type: String },
    account1DepositType: { type: String },
    account1PercentageNet: { type: String },
    account1SpecificAmount: { type: String },
    
    // Account 2
    account2Action: { type: String },
    account2Type: { type: String },
    account2HolderName: { type: String },
    account2RoutingNumber: { type: String },
    account2Number: { type: String },
    account2Institution: { type: String },
    account2DepositType: { type: String },
    account2PercentageNet: { type: String },
    account2SpecificAmount: { type: String },
    
    // Account 3
    account3Action: { type: String },
    account3Type: { type: String },
    account3HolderName: { type: String },
    account3RoutingNumber: { type: String },
    account3Number: { type: String },
    account3Institution: { type: String },
    account3DepositType: { type: String },
    account3PercentageNet: { type: String },
    account3SpecificAmount: { type: String },

    // Authorization and Signatures
    employeeSignature: { type: String },
    employeeSignatureDate: { type: String },
    employerRepName: { type: String },
    employerRepSignature: { type: String },
    employerRepDate: { type: String },

    // Internal status tracking
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
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("DirectDepositForm", DirectDepositFormSchema);
