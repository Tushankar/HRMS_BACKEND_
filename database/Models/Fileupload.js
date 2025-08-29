const { default: mongoose } = require("mongoose");
const Mongoose = require("mongoose");

const FileuploadSchema = new Mongoose.Schema(
  {
    employee_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    doc: [
      {
        filename: { type: String, required: true },
        filePath: { type: String, required: true },
        fileType: {
          type: String,
          enum: ["image", "pdf"],
          required: true,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = Mongoose.model("fileupload", FileuploadSchema);