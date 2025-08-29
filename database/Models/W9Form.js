const mongoose = require("mongoose");

// W-9 Tax Form Schema based on the Rev. March 2024 PDF (Exhibit 12b)
const W9FormSchema = new mongoose.Schema(
  {
    applicationId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "OnboardingApplication",
          required: true,
        },
    // Meta information for internal tracking
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },

    // Line 1: Name of entity/individual
    name: {
      type: String,
      required: true,
    },

    // Line 2: Business name/disregarded entity name
    businessName: {
      type: String,
    },

    // Line 3a: Federal Tax Classification
    taxClassification: {
      type: String,
      enum: [
        "individual_sole_proprietor",
        "c_corporation",
        "s_corporation",
        "partnership",
        "trust_estate",
        "llc",
        "other",
      ],
      required: true,
    },

    // For LLCs, specify the tax classification (C, S, or P)
    llcClassification: {
      type: String,
      enum: ["C", "S", "P", null], // Allow null for non-LLC types
      default: null,
    },

    // Line 3b: Checkbox for foreign partners, owners, or beneficiaries
    hasForeignPartnersOrOwners: {
        type: Boolean,
        default: false,
    },

    // Line 4: Exemption codes
    exemptions: {
      exemptPayeeCode: { type: String },
      fatcaExemptionCode: { type: String }, // Exemption from FATCA reporting code
    },

    // Line 5 & 6: Address
    address: {
      street: { type: String },
      cityStateZip: { type: String },
    },

    // Line 7: Account number(s) (optional)
    accountNumbers: {
      type: String,
    },

    // Part I: Taxpayer Identification Number (TIN)
    // Storing both, but typically only one will be filled out.
    socialSecurityNumber: {
      type: String,
    },
    employerIdentificationNumber: {
      type: String,
    },

    // Part II: Certification
    // This boolean represents if the user has crossed out item 2,
    // meaning they ARE subject to backup withholding.
    isSubjectToBackupWithholding: {
        type: Boolean,
        default: false,
    },

    // Signature and Date
    signature: {
      type: String,
    },
    signatureDate: {
      type: Date,
    },

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

module.exports = mongoose.model("W9Form", W9FormSchema);
