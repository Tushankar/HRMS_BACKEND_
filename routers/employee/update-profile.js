const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const User = require("../../database/Models/Users");
const authMiddleware = require("../auth/authMiddleware");

const router = express.Router();

// Create uploads directory for profile pictures if it doesn't exist
const uploadsDir = path.join(__dirname, "../../uploads/profile-pictures");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for profile picture uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp and user ID
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname);
    cb(null, `profile-${req.user._id}-${uniqueSuffix}${extension}`);
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

// Update profile with picture endpoint
router.put(
  "/update-profile",
  authMiddleware,
  upload.single("profileImage"),
  async (req, res) => {
    try {
      const userId = req.user._id;
      const { userName, email, phone, country, address } = req.body;

      // Find the user
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Prepare update data
      const updateData = {};

      // Update text fields if provided
      if (userName) updateData.userName = userName;
      if (email) updateData.email = email;
      if (phone) updateData.phoneNumber = Number(phone);
      if (country) updateData.country = country;
      if (address) updateData.address = address;

      // Handle profile image upload
      if (req.file) {
        // Delete old profile image if it exists
        if (user.profileImage) {
          const oldImagePath = path.join(
            __dirname,
            "../../uploads/profile-pictures",
            path.basename(user.profileImage)
          );
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
          }
        }

        // Set new profile image path (relative to server root, including uploads prefix)
        updateData.profileImage = `uploads/profile-pictures/${req.file.filename}`;
      }

      // Update user in database
      const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
        new: true,
        runValidators: true,
      }).select("-password"); // Exclude password from response

      res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        user: updatedUser,
      });
    } catch (error) {
      console.error("Profile update error:", error);

      // Clean up uploaded file if there was an error
      if (req.file) {
        const filePath = path.join(
          __dirname,
          "../../uploads/profile-pictures",
          req.file.filename
        );
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      res.status(500).json({
        success: false,
        message: "Failed to update profile",
        error: error.message,
      });
    }
  }
);

// Get current user profile endpoint
router.get("/profile", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      user: user,
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get profile",
      error: error.message,
    });
  }
});

// Refresh JWT token with updated user data endpoint
router.post("/refresh-token", authMiddleware, async (req, res) => {
  try {
    const jwt = require("jsonwebtoken");
    const user = await User.findById(req.user._id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Create new JWT token with updated user data
    const token = jwt.sign(
      { user: user },
      process.env.JWT_SECRET || "fallback-secret",
      { expiresIn: "7d" }
    );

    res.status(200).json({
      success: true,
      token: token,
      user: user,
    });
  } catch (error) {
    console.error("Token refresh error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to refresh token",
      error: error.message,
    });
  }
});

module.exports = router;
