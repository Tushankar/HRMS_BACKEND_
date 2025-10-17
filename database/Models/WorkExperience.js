const mongoose = require("mongoose");

const WorkExperienceSchema = new mongoose.Schema(
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
    hasPreviousWorkExperience: {
      type: Boolean,
      default: false,
    },
    workExperiences: [
      {
        companyName: {
          type: String,
          required: false, // Changed to false since it's optional when no experience
        },
        jobTitle: {
          type: String,
          required: false, // Changed to false since it's optional when no experience
        },
        employmentType: {
          type: String,
          enum: [
            "Full-time",
            "Part-time",
            "Contract",
            "Internship",
            "Freelance",
          ],
          required: false, // Changed to false since it's optional when no experience
        },
        startDate: {
          type: Date,
          required: false, // Changed to false since it's optional when no experience
        },
        endDate: {
          type: Date,
        },
        currentlyWorkingHere: {
          type: Boolean,
          default: false,
        },
        location: {
          type: String,
          required: false, // Changed to false since it's optional when no experience
        },
        supervisorName: {
          type: String,
        },
        supervisorContact: {
          type: String,
        },
        keyResponsibilities: {
          type: String,
          required: false, // Changed to false since it's optional when no experience
        },
        reasonForLeaving: {
          type: String,
        },
        proofDocument: {
          type: String, // File path for uploaded proof
        },
      },
    ],

    // Job Preferences (shown only if hasPreviousWorkExperience is true)
    expectedSalary: { type: String },
    salaryType: {
      type: String,
      enum: ["per hour", "per annum"],
      default: "per annum",
    },
    preferredWorkLocation: { type: String },
    willingToRelocate: { type: Boolean },
    availabilityToStart: { type: Date },
    employmentTypePreference: {
      type: String,
      enum: ["Full-time", "Part-time", "Contract", "Remote"],
    },

    // References (shown only if hasPreviousWorkExperience is true)
    references: [
      {
        name: { type: String },
        relationship: { type: String },
        company: { type: String },
        contactNumber: { type: String },
        email: { type: String },
      },
    ],

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

module.exports = mongoose.model("WorkExperience", WorkExperienceSchema);
