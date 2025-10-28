const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const router = express.Router();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, "../uploads");
console.log("📁 Uploads directory path:", uploadsDir);

if (!fs.existsSync(uploadsDir)) {
  console.log("📁 Creating uploads directory...");
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log("✅ Directory created successfully");
} else {
  console.log("✅ Uploads directory already exists");
}

// Configure multer for signature uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `signature-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

// File filter for images only
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed"), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: fileFilter,
});

// Test endpoint to verify route is working
router.get("/test", (req, res) => {
  console.log("✅ GET /upload/test - Route is working");
  res.json({
    success: true,
    message: "Upload route is working",
    uploadsDir: uploadsDir,
    dirExists: fs.existsSync(uploadsDir),
  });
});

// Upload signature endpoint
router.post("/signature", upload.single("signature"), (req, res) => {
  try {
    console.log("📝 POST /upload/signature - Request received");
    console.log("📝 Request body:", req.body);
    console.log("📝 Request file:", req.file);

    if (!req.file) {
      console.error("❌ No file in request");
      return res.status(400).json({
        success: false,
        message: "No signature file uploaded",
      });
    }

    // Return the file path relative to uploads directory
    const filePath = `/uploads/${req.file.filename}`;

    console.log("✅ Signature uploaded successfully");
    console.log("📁 File saved to:", req.file.path);
    console.log("🔗 File URL path:", filePath);

    res.json({
      success: true,
      message: "Signature uploaded successfully",
      filePath: filePath,
      filename: req.file.filename,
    });
  } catch (error) {
    console.error("❌ Error uploading signature:", error);
    res.status(500).json({
      success: false,
      message: "Failed to upload signature",
      error: error.message,
    });
  }
});

// Get signature endpoint
router.get("/signature/:filename", (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(uploadsDir, filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: "Signature file not found",
      });
    }

    // Send file
    res.sendFile(filePath);
  } catch (error) {
    console.error("Error serving signature:", error);
    res.status(500).json({
      success: false,
      message: "Failed to serve signature",
    });
  }
});

// Delete signature endpoint
router.delete("/signature/:filename", (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(uploadsDir, filename);

    // Check if file exists
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({
        success: true,
        message: "Signature deleted successfully",
      });
    } else {
      res.status(404).json({
        success: false,
        message: "Signature file not found",
      });
    }
  } catch (error) {
    console.error("Error deleting signature:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete signature",
    });
  }
});

// Error handling middleware for multer
router.use((error, req, res, next) => {
  console.error("❌ Upload router error:", error);
  if (error instanceof multer.MulterError) {
    // Multer-specific errors
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "File too large. Maximum size is 5MB",
      });
    }
    return res.status(400).json({
      success: false,
      message: `Upload error: ${error.message}`,
    });
  }

  // Other errors
  res.status(500).json({
    success: false,
    message: error.message || "An error occurred during upload",
  });
});

module.exports = router;
