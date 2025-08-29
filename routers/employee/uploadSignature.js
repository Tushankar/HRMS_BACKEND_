const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const FileUpload = require("../../database/Models/eSignature");

const appRouter = express.Router();

// Configure Multer storage with unique filenames
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // Ensure this directory exists
  },
  filename: function (req, file, cb) {
    const employeeId = req.body.employeeId || Date.now().toString(); // Fallback to timestamp if no employeeId
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9); // Generate unique suffix
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `signature_${employeeId}_${uniqueSuffix}${ext}`); // Unique filename per user
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
  limits: { files: 1 } // Limit to 1 file
});

// File Upload API
appRouter.post("/upload-signature", 
  upload.single('signature'), 
  async (req, res) => {
    try {
      // Check if file was uploaded
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const { path: filePath, filename, mimetype } = req.file;
      const employeeId = req.body.employeeId; // Ensure this matches what the frontend sends

      // Validate employeeId is provided
      if (!employeeId) {
        throw new Error("employeeId is required");
      }

      // Determine file type
      let fileType;
      if (mimetype.startsWith('image')) {
        fileType = "image";
      } else if (mimetype === 'application/pdf') {
        fileType = "pdf";
      } else {
        throw new Error("Invalid file type");
      }

      // Check if employee already has a signature
      let existingSignature = await FileUpload.findOne({ employee_id: employeeId });

      if (existingSignature) {
        // Remove old file if it exists
        if (fs.existsSync(existingSignature.signature.filePath)) {
          fs.unlinkSync(existingSignature.signature.filePath);
        }

        // Update existing record
        existingSignature.signature = {
          filename: filename, // Updated to new unique filename
          filePath: filePath, // Updated to new file path
          fileType: fileType
        };
        await existingSignature.save();
      } else {
        // Create new signature record
        const newSignature = new FileUpload({
          employee_id: employeeId,
          signature: {
            filename: filename, // Unique filename
            filePath: filePath, // New file path
            fileType: fileType
          }
        });

        await newSignature.save();
      }

      // Send success response
      res.status(200).json({
        message: "Signature uploaded successfully",
        filename: filename,
        filePath: filePath,
        fileType: fileType
      });

    } catch (error) {
      console.error("Upload error:", error);

      // If it's a Multer error, send appropriate message
      if (error instanceof multer.MulterError) {
        return res.status(400).json({ message: error.message });
      }

      // For other validation or server errors
      res.status(500).json({ message: error.message || "Server error during upload" });
    }
  }
);

module.exports = appRouter;