const mongoose = require("mongoose");

const OrientationPresentationSchema = new mongoose.Schema(
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
    viewed: {
      type: Boolean,
      default: false,
    },
    viewedAt: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["draft", "completed", "submitted", "under_review", "approved", "rejected"],
      default: "draft",
    },
    hrFeedback: {
      comment: String,
      reviewedBy: mongoose.Schema.Types.ObjectId,
      reviewedAt: Date,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("OrientationPresentation", OrientationPresentationSchema);
