const mongoose = require("mongoose");

// Main Onboarding Application Schema
const OnboardingApplicationSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    applicationStatus: {
      type: String,
      enum: ["draft", "submitted", "under_review", "approved", "rejected"],
      default: "draft",
    },
    submittedAt: {
      type: Date,
    },
    reviewedAt: {
      type: Date,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    reviewComments: {
      type: String,
    },
    completionPercentage: {
      type: Number,
      default: 0,
    },
    // Forms completion tracking
    completedForms: [{
      type: String,
    }],
  },
  {
    timestamps: true,
  }
);

// Method to calculate completion percentage
OnboardingApplicationSchema.methods.calculateCompletionPercentage = function() {
  // Total forms: 13 interactive forms + 4 job description acknowledgments = 17 forms
  const totalForms = 17; 
  const completedFormsCount = this.completedForms.length;
  this.completionPercentage = Math.round((completedFormsCount / totalForms) * 100);
  return this.completionPercentage;
};

module.exports = mongoose.model("OnboardingApplication", OnboardingApplicationSchema);
