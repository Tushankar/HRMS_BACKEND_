const mongoose = require("mongoose");

// I-9 Employment Eligibility Verification Schema (Exhibit 11)
const I9FormSchema = new mongoose.Schema(
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

    // Section 1: Employee Information and Attestation
    section1: {
      lastName: { type: String },
      firstName: { type: String },
      middleInitial: { type: String },
      otherLastNames: { type: String },
      address: { type: String },
      aptNumber: { type: String },
      cityOrTown: { type: String },
      state: { type: String },
      zipCode: { type: String },
      dateOfBirth: { type: String },
      socialSecurityNumber: { type: String },
      employeeEmail: { type: String },
      employeePhone: { type: String },

      citizenshipStatus: {
        type: String,
        enum: [
          "us_citizen",
          "non_citizen_national",
          "lawful_permanent_resident",
          "authorized_alien",
        ],
      },
      // for lawful permanent resident
      uscisNumber: { type: String },
      // for authorized alien  
      formI94Number: { type: String },
      foreignPassportNumber: { type: String },
      countryOfIssuance: { type: String },
      expirationDate: { type: String },

      // Employee Signature
      employeeSignature: { type: String },
      employeeSignatureDate: { type: String },

      // Preparer/Translator (if applicable)
      preparerTranslator: {
        preparerUsed: { type: Boolean, default: false },
        preparerLastName: { type: String },
        preparerFirstName: { type: String },
        preparerAddress: { type: String },
        preparerSignature: { type: String },
        preparerDate: { type: String },
      },
    },

    // Section 2: Employer Review and Verification
    section2: {
      employmentStartDate: { type: String },

      // Document verification (numbered fields matching frontend)
      documentTitle1: { type: String },
      issuingAuthority1: { type: String },
      documentNumber1: { type: String },
      expirationDate1: { type: String },
      
      documentTitle2: { type: String },
      issuingAuthority2: { type: String },
      documentNumber2: { type: String },
      expirationDate2: { type: String },
      
      documentTitle3: { type: String },
      issuingAuthority3: { type: String },
      documentNumber3: { type: String },
      expirationDate3: { type: String },

      // Additional Information
      additionalInfo: { type: String },

      // Certification
      employerSignature: { type: String },
      employerSignatureDate: { type: String },
      employerName: { type: String },
      employerTitle: { type: String },
      employerBusinessName: { type: String },
      employerBusinessAddress: { type: String },
    },

    // Section 3: Reverification and Rehires (Supplement B)
    section3: {
      dateOfRehire: { type: Date },
      newName: { type: String },
      documentTitle: { type: String },
      documentNumber: { type: String },
      expirationDate: { type: Date },
      employerSignature: { type: String },
      signatureDate: { type: Date },
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

module.exports = mongoose.model("I9Form", I9FormSchema);
