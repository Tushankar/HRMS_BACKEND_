const mongoose = require("mongoose");

// TB Symptom Screen Form Schema (Exhibit 9)
const TBSymptomScreenSchema = new mongoose.Schema(
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

    // Basic Information
    basicInfo: {
      fullName: { type: String },
      sex: { type: String, enum: ["M", "F"] },
      dateOfBirth: { type: Date },
    },

    // Last Skin Test
    lastSkinTest: {
      facilityName: { type: String },
      facilityAddress: { type: String },
      facilityPhone: { type: String },
      testDate: { type: Date },
      resultMM: { type: String },
      resultPositive: { type: Boolean },
      resultNegative: { type: Boolean },
      chestXrayNormal: { type: Boolean },
      chestXrayAbnormal: { type: Boolean },
    },

    // Treatment History
    treatmentHistory: {
      latentTB: { type: Boolean },
      latentMonths: { type: Number },
      tbDisease: { type: Boolean },
      tbDiseaseMonths: { type: Number },
      treatmentWhen: { type: String },
      treatmentWhere: { type: String },
      medications: { type: String },
    },

    // Screening Date
    screeningDate: { type: Date },

    // Symptom Assessment
    symptoms: {
      cough: { type: Boolean },
      coughDurationDays: { type: Number },
      coughDurationWeeks: { type: Number },
      coughDurationMonths: { type: Number },
      mucusColor: { type: String },
      coughingBlood: { type: Boolean },
      nightSweats: { type: Boolean },
      fevers: { type: Boolean },
      weightLoss: { type: Boolean },
      weightLossPounds: { type: Number },
      fatigue: { type: Boolean },
      fatigueDurationDays: { type: Number },
      fatigueDurationWeeks: { type: Number },
      fatigueDurationMonths: { type: Number },
      chestPain: { type: Boolean },
      chestPainDurationDays: { type: Number },
      chestPainDurationWeeks: { type: Number },
      chestPainDurationMonths: { type: Number },
      shortnessOfBreath: { type: Boolean },
      shortnessBreathDurationDays: { type: Number },
      shortnessBreathDurationWeeks: { type: Number },
      shortnessBreathDurationMonths: { type: Number },
      knowsSomeoneWithSymptoms: { type: Boolean },
      contactName: { type: String },
      contactAddress: { type: String },
      contactPhone: { type: String },
    },

    // Action Taken
    actionTaken: {
      noSignOfTB: { type: Boolean },
      chestXrayNotNeeded: { type: Boolean },
      discussedSigns: { type: Boolean },
      clientAware: { type: Boolean },
      furtherActionNeeded: { type: Boolean },
      isolated: { type: Boolean },
      givenMask: { type: Boolean },
      chestXrayNeeded: { type: Boolean },
      sputumSamplesNeeded: { type: Boolean },
      referredToDoctor: { type: String }, // specify doctor/clinic
      other: { type: String },
    },

    // Signatures
    screenerSignature: { type: String },
    clientSignature: { type: String },
    clientSignatureDate: { type: Date },

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

module.exports = mongoose.model("TBSymptomScreen", TBSymptomScreenSchema);
