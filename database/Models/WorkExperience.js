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
        company: {
          type: String,
          required: true,
        },
        phone: {
          type: String,
        },
        address: {
          type: String,
        },
        supervisor: {
          type: String,
        },
        jobTitle: {
          type: String,
          required: true,
        },
        startingSalary: {
          type: String,
        },
        endingSalary: {
          type: String,
        },
        responsibilities: {
          type: String,
          required: true,
        },
        from: {
          type: Date,
          required: true,
        },
        to: {
          type: Date,
          required: true,
        },
        reasonForLeaving: {
          type: String,
        },
        contactSupervisor: {
          type: Boolean,
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

module.exports = mongoose.model("WorkExperience", WorkExperienceSchema);
