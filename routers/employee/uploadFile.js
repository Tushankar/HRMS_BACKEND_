const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const Mongoose = require("mongoose");
const FileUpload = require("../../database/Models/Fileupload");

const appRouter = express.Router();

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

// File Upload API
appRouter.post("/file-upload", upload.array("docs", 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    const { employee_id } = req.body;
    if (!employee_id) {
      return res.status(400).json({ message: "Employee ID is required" });
    }

    const files = req.files.map((file) => ({
      filename: file.filename,
      filePath: file.path.replace(/\\/g, "/"), // Convert backslashes to forward slashes
      fileType: file.mimetype.includes("pdf") ? "pdf" : "image",
    }));

    const fileUpload = new FileUpload({
      employee_id: employee_id,
      doc: files,
    });

    await fileUpload.save();
    res.status(201).json({ message: "Files uploaded successfully", data: fileUpload });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get Uploaded Files by Employee ID
appRouter.get("/file-upload/:employee_id", async (req, res) => {
  try {
    const { employee_id } = req.params;

    if (!Mongoose.Types.ObjectId.isValid(employee_id)) {
      return res.status(400).json({ message: "Invalid Employee ID" });
    }

    const files = await FileUpload.find({ employee_id });

    if (!files) {
      return res.status(404).json({ message: "No files found for this Employee ID" });
    }

    res.status(200).json({ message: "Files retrieved successfully", data: files });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Delete File Record by ID (Removes from DB + Uploads Folder)
appRouter.delete("/file-upload/:file_id", async (req, res) => {
  try {
    const { file_id } = req.params;

    // Find the document by ID
    const fileDoc = await FileUpload.findById(file_id);

    if (!fileDoc) {
      return res.status(404).json({ message: "File record not found" });
    }

    // Get absolute path to the project root (go up **two levels** from /routers/)
    const rootPath = path.resolve(__dirname, "..", ".."); // Moves two levels up to project root

    // Iterate through all files and delete them from the "uploads" folder
    fileDoc.doc.forEach((file) => {
      const filePath = path.join(rootPath, file.filePath); // Correct file path

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath); // Remove the file from the server
        console.log(`✅ Deleted file: ${filePath}`);
      } else {
        console.warn(`⚠️ File not found: ${filePath}`);
      }
    });

    // Delete the document from MongoDB
    await FileUpload.deleteOne({ _id: file_id });

    res.status(200).json({ message: "File record and all associated files deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting file:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = appRouter;
