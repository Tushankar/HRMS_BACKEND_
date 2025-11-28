const appRouter = require("express").Router();
const Users = require("../../database/Models/Users.js");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");

// Temporary storage for OTPs (in production, use Redis or database)
const otpStore = new Map();

// Create transporter for nodemailer
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Generate 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send OTP email
async function sendOTPEmail(email, otp) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Email Verification OTP",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #34495E;">Email Verification</h2>
        <p>Your OTP for email verification is:</p>
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 5px;">
          <h1 style="color: #34495E; font-size: 32px; margin: 0;">${otp}</h1>
        </div>
        <p>This OTP will expire in 10 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}

appRouter.post("/register", async (req, res) => {
  try {
    // get details from body
    const { fullName, email, phoneNumber, password, userRole } = req.body;

    // Validate required fields
    if (!fullName || !email || !phoneNumber || !password) {
      return res.status(400).json({
        message: "All fields are required",
        status: "Error",
      });
    }

    // check if email exists
    const checkEmailExists = await Users.findOne({ email });
    if (checkEmailExists)
      return res.status(409).json({
        message: "Email already exists",
        status: "Error",
      });

    // Generate OTP
    const otp = generateOTP();
    console.log(`OTP generated for ${email}: ${otp}`);

    // Store OTP with email (expires in 10 minutes)
    otpStore.set(email, {
      otp,
      data: {
        fullName,
        email,
        phoneNumber,
        password,
        userRole: userRole || "employee",
      },
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
    });

    // Send OTP email
    await sendOTPEmail(email, otp);

    // return success message
    res.status(200).json({
      message:
        "OTP sent to your email. Please verify to complete registration.",
      status: "Success",
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      message: error.message || "Internal Server Error",
      status: "Server Error",
    });
  }
});

// Verify OTP and complete registration
appRouter.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        message: "Email and OTP are required",
        status: "Error",
      });
    }

    const storedData = otpStore.get(email);
    if (!storedData) {
      return res.status(400).json({
        message: "OTP not found or expired",
        status: "Error",
      });
    }

    if (Date.now() > storedData.expiresAt) {
      otpStore.delete(email);
      return res.status(400).json({
        message: "OTP has expired",
        status: "Error",
      });
    }

    if (storedData.otp !== otp) {
      return res.status(400).json({
        message: "Invalid OTP",
        status: "Error",
      });
    }

    // OTP verified, now register the user
    const userData = storedData.data;

    // hash password
    const hashedPassword = await bcrypt.hash(userData.password, 12);

    // create new user
    const newUser = await Users({
      userName: userData.fullName,
      email: userData.email,
      phoneNumber: userData.phoneNumber,
      password: hashedPassword,
      userRole: userData.userRole,
    });

    // save user to database
    await newUser.save();

    // Clean up OTP
    otpStore.delete(email);

    // return user details
    res.status(200).json({
      message: "Account created successfully",
      status: "Success",
    });
  } catch (error) {
    console.error("OTP verification error:", error);
    res.status(500).json({
      message: error.message || "Internal Server Error",
      status: "Server Error",
    });
  }
});
// Update User API
appRouter.put("/update", async (req, res) => {
  try {
    const {
      userId,
      fullName,
      email,
      phoneNumber,
      country,
      address,
      dateOfBirth,
      experience,
      jobDesignation,
      employeementType,
      userRole,
      profileImage,
      accountStatus,
    } = req.body;

    // Check if user exists
    const existingUser = await Users.findById(userId);
    if (!existingUser) {
      return res.status(404).json({
        message: "User not found",
        status: "Error",
      });
    }

    // Update fields
    existingUser.userName = fullName || existingUser.userName;
    existingUser.email = email || existingUser.email;
    existingUser.phoneNumber = phoneNumber || existingUser.phoneNumber;
    existingUser.country = country || existingUser.country;
    existingUser.address = address || existingUser.address;
    existingUser.dateOfBirth = dateOfBirth || existingUser.dateOfBirth;
    existingUser.experience = experience || existingUser.experience;
    existingUser.jobDesignation = jobDesignation || existingUser.jobDesignation;
    existingUser.employeementType =
      employeementType || existingUser.employeementType;
    existingUser.userRole = userRole || existingUser.userRole;
    existingUser.profileImage = profileImage || existingUser.profileImage;
    existingUser.accountStatus = accountStatus || existingUser.accountStatus;

    // Save changes
    await existingUser.save();

    res.status(200).json({
      message: "User updated successfully",
      status: "Success",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error", status: "Error" });
  }
});

// Toggle OTP verification for login
appRouter.post("/toggle-otp", async (req, res) => {
  try {
    const { userId, otpEnabled } = req.body;

    if (!userId) {
      return res.status(400).json({
        message: "User ID is required",
        status: "Error",
      });
    }

    const user = await Users.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: "User not found",
        status: "Error",
      });
    }

    user.otpEnabled = otpEnabled;
    await user.save();

    res.status(200).json({
      message: `OTP verification ${
        otpEnabled ? "enabled" : "disabled"
      } successfully`,
      status: "Success",
    });
  } catch (error) {
    console.error("Toggle OTP error:", error);
    res.status(500).json({
      message: error.message || "Internal Server Error",
      status: "Server Error",
    });
  }
});

module.exports = appRouter;
