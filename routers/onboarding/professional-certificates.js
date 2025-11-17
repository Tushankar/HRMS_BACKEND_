const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const OnboardingApplication = require("../../database/Models/OnboardingApplication");
const mongoose = require("mongoose");

const router = express.Router();

// Create uploads directory for Professional Certificates
const uploadsDir = path.join(
  __dirname,
  "../../uploads/professional-certificates"
);
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for document uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `certificate-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (req, file, cb) => {
  // Allow PDF and image files
  const allowedMimes = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/gif",
  ];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only PDF and image files are allowed"), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: fileFilter,
});

// Employee upload multiple professional certificate documents
router.post(
  "/employee-upload-multiple-documents",
  upload.array("files", 10), // Allow up to 10 files
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No files uploaded",
        });
      }

      const { applicationId, employeeId, positionType } = req.body;

      if (!applicationId || !positionType) {
        return res.status(400).json({
          success: false,
          message: "Application ID and Position Type are required",
        });
      }

      // Validate position type for professional certificates
      const validPositionTypes = ["PCA", "CNA", "LPN", "RN"];
      if (!validPositionTypes.includes(positionType.toUpperCase())) {
        return res.status(400).json({
          success: false,
          message: `Invalid position type. Must be one of: ${validPositionTypes.join(
            ", "
          )}`,
        });
      }

      // Find or create application
      const application = await OnboardingApplication.findById(applicationId);
      if (!application) {
        return res.status(404).json({
          success: false,
          message: "Application not found",
        });
      }
      
      console.log("📋 Found application:", application._id);
      console.log("📋 Current professionalCertificates:", application.professionalCertificates);

      // Initialize professionalCertificates object if it doesn't exist
      if (!application.professionalCertificates) {
        application.professionalCertificates = {};
      }

      // Initialize array for this position type if it doesn't exist
      if (!application.professionalCertificates[positionType]) {
        application.professionalCertificates[positionType] = [];
      }
      
      // Mark the field as modified for Mongoose
      application.markModified('professionalCertificates');

      // Add each uploaded file to the array
      const uploadedDocuments = [];
      console.log(`📁 Processing ${req.files.length} files for position ${positionType}`);
      
      req.files.forEach((file, index) => {
        console.log(`📄 Processing file ${index + 1}:`, {
          originalname: file.originalname,
          path: file.path,
          size: file.size,
          mimetype: file.mimetype
        });
        
        const document = {
          _id: new mongoose.Types.ObjectId(),
          filename: file.originalname,
          filePath: file.path.replace(/\\/g, "/"), // Normalize path separators
          fileSize: file.size,
          mimeType: file.mimetype,
          uploadedAt: new Date(),
          fullUrl: `${req.protocol}://${req.get("host")}/${file.path.replace(
            /\\/g,
            "/"
          )}`,
        };
        
        application.professionalCertificates[positionType].push(document);
        uploadedDocuments.push(document);
        console.log(`✅ Added document: ${document.filename} to ${positionType}`);
        console.log(`📊 Current array length: ${application.professionalCertificates[positionType].length}`);
      });

      // Mark as modified and save
      application.markModified('professionalCertificates');
      await application.save();
      
      console.log("✅ Application saved successfully");
      console.log("📋 Updated professionalCertificates:", application.professionalCertificates);
      console.log("📊 Total documents for position:", application.professionalCertificates[positionType].length);

      res.status(200).json({
        success: true,
        message: `${req.files.length} professional certificate(s) uploaded successfully`,
        data: {
          uploadedDocuments,
          totalDocuments:
            application.professionalCertificates[positionType].length,
        },
      });
    } catch (error) {
      console.error(
        "Error uploading multiple professional certificates:",
        error
      );
      res.status(500).json({
        success: false,
        message: "Failed to upload documents",
        error: error.message,
      });
    }
  }
);

// Get all uploaded professional certificate documents
router.get(
  "/get-uploaded-documents/:applicationId/:positionType",
  async (req, res) => {
    try {
      const { applicationId, positionType } = req.params;

      // Validate position type
      const validPositionTypes = ["PCA", "CNA", "LPN", "RN"];
      if (!validPositionTypes.includes(positionType.toUpperCase())) {
        return res.status(400).json({
          success: false,
          message: `Invalid position type for professional certificates. Must be one of: ${validPositionTypes.join(
            ", "
          )}`,
        });
      }

      console.log(
        `📂 Fetching professional certificates for app: ${applicationId}, position: ${positionType}`
      );

      // Find application
      const application = await OnboardingApplication.findById(
        applicationId
      ).lean();

      if (!application) {
        return res.status(404).json({
          success: false,
          message: "Application not found",
        });
      }
      
      console.log("🔍 Application found:", application._id);
      console.log("📋 Full professionalCertificates object:", application.professionalCertificates);
      console.log("🔑 Available position keys:", Object.keys(application.professionalCertificates || {}));
      console.log("🎯 Looking for position:", positionType);

      const documents =
        application.professionalCertificates?.[positionType] || [];

      console.log("📋 Documents array:", documents);
      console.log("📊 Document count:", documents.length);

      res.status(200).json({
        success: true,
        data: {
          documents,
          count: documents.length,
        },
      });
    } catch (error) {
      console.error("Error fetching professional certificates:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching documents",
        error: error.message,
      });
    }
  }
);

// Remove specific professional certificate document
router.post("/remove-document", async (req, res) => {
  try {
    const { applicationId, documentId, positionType } = req.body;

    // Validation
    if (!applicationId || !documentId) {
      return res.status(400).json({
        success: false,
        message: "Application ID and Document ID are required",
      });
    }

    if (!positionType) {
      return res.status(400).json({
        success: false,
        message: "Position type is required",
      });
    }

    // Validate position type
    const validPositionTypes = ["PCA", "CNA", "LPN", "RN"];
    if (!validPositionTypes.includes(positionType.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: `Invalid position type. Must be one of: ${validPositionTypes.join(
          ", "
        )}`,
      });
    }

    // Find application
    const application = await OnboardingApplication.findById(applicationId);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    // Get documents for this position type
    const documents =
      application.professionalCertificates?.[positionType] || [];

    // Find document to delete
    const documentIndex = documents.findIndex(
      (doc) => doc._id.toString() === documentId
    );

    if (documentIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    // Get file path for deletion
    const filePath = documents[documentIndex].filePath;

    // Delete the file from disk if it exists
    if (filePath && fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        console.log("✅ File deleted successfully:", filePath);
      } catch (err) {
        console.error("Error deleting file:", err);
      }
    }

    // Remove document from array
    documents.splice(documentIndex, 1);

    // Update application
    if (!application.professionalCertificates) {
      application.professionalCertificates = {};
    }
    application.professionalCertificates[positionType] = documents;
    await application.save();

    console.log("✅ Professional certificate document removed successfully");

    res.status(200).json({
      success: true,
      message: "Document removed successfully",
    });
  } catch (error) {
    console.error("Error removing professional certificate:", error);
    res.status(500).json({
      success: false,
      message: "Error removing document",
      error: error.message,
    });
  }
});

// Save professional certificate status (Save & Next)
router.post("/save-status", async (req, res) => {
  try {
    const { applicationId, employeeId, positionType, status } = req.body;

    // Validation
    if (!applicationId || !employeeId || !positionType || !status) {
      return res.status(400).json({
        success: false,
        message:
          "Application ID, Employee ID, Position Type, and Status are required",
      });
    }

    // Validate position type
    const validPositionTypes = ["PCA", "CNA", "LPN", "RN"];
    if (!validPositionTypes.includes(positionType.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: `Invalid position type. Must be one of: ${validPositionTypes.join(
          ", "
        )}`,
      });
    }

    // Find application
    const application = await OnboardingApplication.findById(applicationId);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    // Check if documents were uploaded
    const documents =
      application.professionalCertificates?.[positionType] || [];
    if (documents.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please upload a document before saving",
      });
    }

    // Initialize formsCompleted if needed
    if (!Array.isArray(application.formsCompleted)) {
      application.formsCompleted = [];
    }

    // Add to completed forms
    const formKey = `professionalCertificate${positionType.toUpperCase()}`;
    if (!application.formsCompleted.includes(formKey)) {
      application.formsCompleted.push(formKey);
    }
    
    // Also add to completedForms array for consistency
    if (!application.completedForms) {
      application.completedForms = [];
    }
    if (!application.completedForms.includes(formKey)) {
      application.completedForms.push(formKey);
    }

    // Update completion percentage if available
    if (application.calculateCompletionPercentage) {
      application.completionPercentage =
        application.calculateCompletionPercentage();
    }

    // Mark arrays as modified
    application.markModified('formsCompleted');
    application.markModified('completedForms');
    await application.save();

    console.log("✅ Professional certificate status saved successfully");

    res.status(200).json({
      success: true,
      message: "Professional certificate saved successfully",
      data: {
        applicationId,
        positionType,
        status,
        documentsCount: documents.length,
      },
    });
  } catch (error) {
    console.error("Error saving professional certificate status:", error);
    res.status(500).json({
      success: false,
      message: "Error saving form status",
      error: error.message,
    });
  }
});

// Debug endpoint to check application data
router.get("/debug-application/:applicationId", async (req, res) => {
  try {
    const { applicationId } = req.params;
    const application = await OnboardingApplication.findById(applicationId);
    
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }
    
    res.json({
      applicationId: application._id,
      professionalCertificates: application.professionalCertificates,
      completedForms: application.completedForms,
      formsCompleted: application.formsCompleted
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
