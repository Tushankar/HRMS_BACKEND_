const { model } = require("mongoose");
const Tasks = require("../../database/Models/Tasks");
const authMiddleware = require("../auth/authMiddleware");
const multer = require("multer");
const path = require("path");

const appRouter = require("express").Router();

// Configure Multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // Ensure this directory exists
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    const fileTypes = /jpeg|jpg|png|pdf/;
    const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = fileTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      return cb(new Error("Only images and PDFs are allowed"));
    }
  },
});

// Route to update task (doc, taskUpdate, taskStatus only)
appRouter.put("/update-task", upload.array("docs", 10), async (req, res) => {
  try {
    const { taskId, taskUpdate, taskStatus } = req.body;
    const user = req.user;

    if (!taskId) {
      return res.status(400).json({
        message: "Task ID is required",
        status: "Error",
      });
    }

    // Validate taskStatus if provided
    if (taskStatus && !["In Progress", "In Review", "Complete", "Reject"].includes(taskStatus)) {
      return res.status(400).json({
        message: "Invalid task status",
        status: "Error",
      });
    }

    // Prepare update object
    const updateData = {};

    if (taskUpdate) {
      updateData.taskUpdate = taskUpdate;
    }

    if (taskStatus) {
      updateData.taskStatus = taskStatus;
    }

    // Handle file uploads for doc
    if (req.files && req.files.length > 0) {
      const files = req.files.map((file) => ({
        filename: file.filename,
        filePath: file.path.replace(/\\/g, "/"), // Convert backslashes to forward slashes
        fileType: file.mimetype.includes("pdf") ? "pdf" : "image",
      }));

      // Append new files to existing doc array
      updateData.$push = { doc: { $each: files } };
    }

    // Update the task
    const updatedTask = await Tasks.findByIdAndUpdate(
      taskId,
      updateData,
      { new: true }
    );

    if (!updatedTask) {
      return res.status(404).json({
        message: "Task not found",
        status: "Error",
      });
    }

    return res.status(200).json({
      message: "Task updated successfully",
      status: "Success",
      task: updatedTask,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Internal server error",
      status: "Error",
    });
  }
});

// Route to delete a specific document from a task
appRouter.delete("/delete-document", authMiddleware, async (req, res) => {
  try {
    const { taskId, docId } = req.body;

    // Validate input
    if (!taskId || !docId) {
      return res.status(400).json({
        message: "Task ID and Document ID are required",
        status: "Error",
      });
    }

    // Find the task and get the document to delete
    const task = await Tasks.findById(taskId);
    if (!task) {
      return res.status(404).json({
        message: "Task not found",
        status: "Error",
      });
    }

    const doc = task.doc.find((d) => d._id.toString() === docId);
    if (!doc) {
      return res.status(404).json({
        message: "Document not found",
        status: "Error",
      });
    }

    // Remove the document from the doc array
    const updatedTask = await Tasks.findByIdAndUpdate(
      taskId,
      { $pull: { doc: { _id: docId } } },
      { new: true }
    );

    // Delete the file from the server
    const filePath = path.resolve(doc.filePath);
    try {
      await fs.unlink(filePath);
    } catch (fileError) {
      console.error(`Failed to delete file ${filePath}:`, fileError);
      // Optionally, proceed even if file deletion fails (e.g., file already deleted)
    }

    return res.status(200).json({
      message: "Document deleted successfully",
      status: "Success",
      task: updatedTask,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Internal server error",
      status: "Error",
    });
  }
});

module.exports = appRouter;