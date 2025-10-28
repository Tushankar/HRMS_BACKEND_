const mongoose = require("mongoose");

const EducationSchema = new mongoose.Schema(
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
    educations: [
      {
        type: {
          type: String,
          default: "",
        },
        institutionName: {
          type: String,
        },
        address: {
          type: String,
        },
        from: {
          type: Date,
        },
        to: {
          type: Date,
        },
        didGraduate: {
          type: String,
          enum: ["YES", "NO"],
        },
        degree: {
          type: String,
        },
        diploma: {
          type: String,
        },
        // Legacy fields for backward compatibility
        location: {
          type: String,
        },
        startDate: {
          type: Date,
        },
        endDate: {
          type: Date,
        },
        currentlyStudying: {
          type: Boolean,
          default: false,
        },
        grade: {
          type: String,
        },
        certificate: {
          type: String,
        },
        fieldOfStudy: {
          type: String,
        },
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

module.exports = mongoose.model("Education", EducationSchema);
