const { default: mongoose } = require("mongoose");
const Mongoose = require("mongoose");

const TaskSchema = new Mongoose.Schema(
  {
    employeeName: {
      type: String,
      require: true,
    },
    taskTitle: {
      type: String,
      require: true,
    },
    taskPriority: {
      type: String,
      require: true,
    },
    deadLine: {
      type: Date,
    },
    taskDescription: {
      type: String,
      require: true,
    },
    assignedToID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      require: true,
    },
    assignedByID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      require: true,
    },
    doc: [
      {
        filename: { type: String, },
        filePath: { type: String, },
        fileType: {
          type: String,
          enum: ["image", "pdf"],
        },
      },
    ],
    taskUpdate: {
      type: String,
    },
    taskType: {
      type: String,
      enum: ["Onboarding", "Daily",],
    },
    taskStatus: {
      type: String,
      default: "To Do",
      enum: ["To Do"," In Progress", "In Review", "Complete" , "Reject"],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = Mongoose.model("task", TaskSchema);
