const mongoose = require("mongoose");

const TBSymptomScreenTemplateSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true },
    filePath: { type: String, required: true },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "TBSymptomScreenTemplate",
  TBSymptomScreenTemplateSchema
);
