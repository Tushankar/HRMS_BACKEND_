const mongoose = require("mongoose");

const EmploymentApplicationTemplateSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true },
    filePath: { type: String, required: true },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("EmploymentApplicationTemplate", EmploymentApplicationTemplateSchema);
