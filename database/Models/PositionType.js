const mongoose = require("mongoose");

const PositionTypeSchema = new mongoose.Schema(
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
    positionAppliedFor: {
      type: String,
      required: true,
      trim: true,
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

module.exports = mongoose.model("PositionType", PositionTypeSchema);
