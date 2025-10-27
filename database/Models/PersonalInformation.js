const mongoose = require("mongoose");

// Personal Information Form Schema
const PersonalInformationSchema = new mongoose.Schema(
  {
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "OnboardingApplication",
      required: true,
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: false, // Changed to false since it may not always be available
    },

    // Full Name
    lastName: { type: String },
    firstName: { type: String },
    middleInitial: { type: String },

    // Date
    date: { type: Date },

    // Address
    streetAddress: { type: String },
    apartment: { type: String },
    city: { type: String },
    state: { type: String },
    zipCode: { type: String },
    country: { type: String },

    // Contact
    phone: { type: String },
    email: { type: String },

    // Employment Details
    dateAvailable: { type: Date },
    socialSecurityNo: { type: String },
    desiredSalary: { type: String },
    positionAppliedFor: { type: String },

    // Authorization Questions
    isUSCitizen: {
      type: String,
      enum: ["YES", "NO"],
    },
    isAuthorizedToWork: {
      type: String,
      enum: ["YES", "NO"],
    },
    hasWorkedHereBefore: {
      type: String,
      enum: ["YES", "NO"],
    },
    previousWorkDate: { type: String },
    hasBeenConvictedOfFelony: {
      type: String,
      enum: ["YES", "NO"],
    },
    felonyExplanation: { type: String },

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
      comment: { type: String },
      reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
      },
      reviewedAt: { type: Date },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "PersonalInformation",
  PersonalInformationSchema
);
