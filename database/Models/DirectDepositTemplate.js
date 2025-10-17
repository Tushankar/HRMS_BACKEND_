const mongoose = require("mongoose");

// Template Schema for the Direct Deposit Enrollment/Change Form
const DirectDepositTemplateSchema = new mongoose.Schema(
  {
    templateName: {
      type: String,
      default: "Direct Deposit Form Template",
    },

    // File information
    filePath: {
      type: String,
      required: true,
    },

    fileName: {
      type: String,
      required: true,
    },

    // Status
    isActive: {
      type: Boolean,
      default: true,
    },

    // Upload information
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },

    uploadedAt: {
      type: Date,
      default: Date.now,
    },

    version: {
      type: String,
      default: "1.0",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "DirectDepositTemplate",
  DirectDepositTemplateSchema
);
