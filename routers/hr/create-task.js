const express = require("express");
const appRouter = express.Router();
const Task = require("../../database/Models/Tasks");
const Users = require("../../database/Models/Users");
const multer = require("multer");
const path = require("path");

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // Ensure this folder exists
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

// Multer Middleware to Allow Multiple Uploads
const upload = multer({ storage: storage });

appRouter.post("/create-task", upload.array("docs", 10), async (req, res) => {
  try {
    const {
      employeeName,
      taskTitle,
      priority,
      deadLine,
      description,
      assignedToID,
      assignedByID,
      taskType,
    } = req.body;

    // Process uploaded files if any
    let uploadedDocs = [];
    if (req.files && req.files.length > 0) {
      uploadedDocs = req.files.map((file) => ({
        filename: file.filename,
        filePath: file.path,
        fileType: getFileType(file.mimetype),
      }));
    }

    // Create new task
    const createNewTask = new Task({
      employeeName,
      taskTitle,
      taskPriority: priority,
      deadLine,
      taskDescription: description,
      assignedToID,
      assignedByID,
      taskType,
      doc: uploadedDocs,
    });

    const createdTaskId = await createNewTask.save();

    if (createNewTask) {
      const getEmployee = await Users.findById(assignedToID);
      getEmployee.tasks.push(createdTaskId._id);
      await getEmployee.save();

      return res.status(200).json({
        message: "Task created successfully",
        status: "Success",
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal server error",
      status: "Error",
    });
  }
});

// Helper to determine file type from MIME
function getFileType(mimeType) {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType === "application/pdf") return "pdf";
  return "other";
}

module.exports = appRouter;
