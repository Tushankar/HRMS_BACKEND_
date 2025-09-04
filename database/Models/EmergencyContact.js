const mongoose = require("mongoose");

// Main Schema for the Emergency Contact Information Form (Exhibit 13)
const EmergencyContactFormSchema = new mongoose.Schema(
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

    // Staff member's information
    staffName: { type: String },
    title: { type: String },

    // Emergency Contact 1
    employeeName1: { type: String },
    contactAddress1: { type: String },
    phoneNumber1: { type: String },
    
    // Emergency Contact 2 (Optional)
    employeeName2: { type: String },
    contactAddress2: { type: String },
    phoneNumber2: { type: String },
    
    // Emergency Contact 3 (Optional)
    employeeName3: { type: String },
    contactAddress3: { type: String },
    phoneNumber3: { type: String },

    // Internal status tracking
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

module.exports = mongoose.model(
  "EmergencyContactForm",
  EmergencyContactFormSchema
);
