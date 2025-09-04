const express = require("express");
const multer = require("multer");
const Users = require("../../database/Models/Users");
const bcrypt = require("bcryptjs");
const path = require("path");
const appRouter = express.Router();

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // Ensure the folder exists
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

appRouter.post("/register-employee", upload.single("profileImage"), async (req, res) => {
  try {
    const { userName, email, phoneNumber, country, password, address, dateOfBirth, experience, jobDesignation, employeementType, userRole } = req.body;
    
    // Check if user already exists
    const existingUser = await Users.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User with this email already exists." });
    }
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

   // Ensure the uploaded file path uses forward slashes
   const filePath = req.file ? path.normalize(req.file.path).replace(/\\/g, "/") : "";
    
    // Create new user
    const newUser = new Users({
      userName,
      email,
      phoneNumber,
      country,
      password: hashedPassword,
      address,
      dateOfBirth,
      experience,
      jobDesignation,
      employeementType,
      userRole,
      profileImage: filePath, // Store fixed path
    });
    
    await newUser.save();
    res.status(201).json({ message: "User registered successfully", user: newUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = appRouter;
