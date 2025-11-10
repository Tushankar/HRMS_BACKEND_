const appRouter = require("express").Router();
const Users = require("../../database/Models/Users.js");
const bcrypt = require("bcryptjs");
const JWT = require("jsonwebtoken");
const nodemailer = require("nodemailer");

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
    subject: "Login OTP Verification",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #34495E;">Login Verification</h2>
        <p>Your OTP for login verification is:</p>
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

// Temporary storage for login OTPs (in production, use Redis or database)
const loginOtpStore = new Map();
// Temporary storage for forgot-password OTPs
const forgotOtpStore = new Map();

appRouter.post("/log-in", async (req, res) => {
  try {
    // get the details
    const { email, password } = req.body;
    console.log(email, password);
    // get user information from the db
    const isUserInfoExist = await Users.findOne({ email }).select("+password");
    if (!isUserInfoExist)
      return res.status(404).json({
        message: "User does not exist",
        status: "Error",
      });
    // check password
    const comparePassword = await bcrypt.compare(
      password,
      isUserInfoExist?.password
    );

    if (!comparePassword)
      return res.status(401).json({
        message: "Invalid username and password",
        status: "Error",
      });

    // Check if OTP is enabled
    if (isUserInfoExist.otpEnabled) {
      // Generate OTP
      const otp = generateOTP();

      // Store OTP with email (expires in 10 minutes)
      loginOtpStore.set(email, {
        otp,
        user: isUserInfoExist,
        expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
      });

      // Send OTP email
      await sendOTPEmail(email, otp);

      return res.status(200).json({
        otpRequired: true,
        message: "OTP sent to your email. Please verify to complete login.",
        status: "Success",
      });
    }

    // Normal login without OTP
    // create a session
    if (!process.env.SESSION__STRING) {
      return res.status(500).json({
        message: "Environment variable not defined",
        status: "Error",
      });
    }

    const session = JWT.sign(
      { user: isUserInfoExist },
      process.env.SESSION__STRING,
      {
        expiresIn: "2d",
      }
    );

    res.setHeader("Authorization", session);
    // return session and user information
    res.status(200).json({
      // session,
      userInfo: isUserInfoExist,
      message: `Welcome ${isUserInfoExist.userName}`,
      status: "Success",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: error,
      status: "Server error",
    });
  }
});

// Verify login OTP
appRouter.post("/verify-login-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        message: "Email and OTP are required",
        status: "Error",
      });
    }

    const storedData = loginOtpStore.get(email);
    if (!storedData) {
      return res.status(400).json({
        message: "OTP not found or expired",
        status: "Error",
      });
    }

    if (Date.now() > storedData.expiresAt) {
      loginOtpStore.delete(email);
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

    // OTP verified, complete login
    const user = storedData.user;

    // create a session
    if (!process.env.SESSION__STRING) {
      return res.status(500).json({
        message: "Environment variable not defined",
        status: "Error",
      });
    }

    const session = JWT.sign({ user: user }, process.env.SESSION__STRING, {
      expiresIn: "2d",
    });

    // Clean up OTP
    loginOtpStore.delete(email);

    res.setHeader("Authorization", session);
    // return session and user information
    res.status(200).json({
      userInfo: user,
      message: `Welcome ${user.userName}`,
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

// Resend login OTP
appRouter.post("/resend-login-otp", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Email is required",
        status: "Error",
      });
    }

    // Check if user exists and has OTP enabled
    const user = await Users.findOne({ email });
    if (!user) {
      return res.status(404).json({
        message: "User not found",
        status: "Error",
      });
    }

    if (!user.otpEnabled) {
      return res.status(400).json({
        message: "OTP is not enabled for this account",
        status: "Error",
      });
    }

    // Generate new OTP
    const otp = generateOTP();

    // Store OTP with email (expires in 10 minutes)
    loginOtpStore.set(email, {
      otp,
      user: user,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
    });

    // Send OTP email
    await sendOTPEmail(email, otp);

    return res.status(200).json({
      message: "New OTP sent to your email",
      status: "Success",
    });
  } catch (error) {
    console.error("Resend OTP error:", error);
    res.status(500).json({
      message: error.message || "Internal Server Error",
      status: "Server Error",
    });
  }
});

// Forgot password - send OTP to email for password reset
appRouter.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Email is required",
        status: "Error",
      });
    }

    const user = await Users.findOne({ email });
    if (!user) {
      return res.status(404).json({
        message: "User not found",
        status: "Error",
      });
    }

    // Generate OTP
    const otp = generateOTP();

    // Store OTP with email (expires in 10 minutes)
    forgotOtpStore.set(email, {
      otp,
      user,
      expiresAt: Date.now() + 10 * 60 * 1000,
    });

    // Send OTP email (reuse sendOTPEmail but with a different subject/body)
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset OTP",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #34495E;">Password Reset</h2>
          <p>Your OTP to reset your password is:</p>
          <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 5px;">
            <h1 style="color: #34495E; font-size: 32px; margin: 0;">${otp}</h1>
          </div>
          <p>This OTP will expire in 10 minutes.</p>
          <p>If you didn't request this, please ignore this email.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    return res.status(200).json({
      message: "OTP sent to your email for password reset",
      status: "Success",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({
      message: error.message || "Internal Server Error",
      status: "Server Error",
    });
  }
});

// Verify forgot-password OTP and reset password
appRouter.post("/verify-forgot-otp", async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        message: "Email, OTP and new password are required",
        status: "Error",
      });
    }

    const storedData = forgotOtpStore.get(email);
    if (!storedData) {
      return res.status(400).json({
        message: "OTP not found or expired",
        status: "Error",
      });
    }

    if (Date.now() > storedData.expiresAt) {
      forgotOtpStore.delete(email);
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

    // Update user's password
    const user = await Users.findOne({ email }).select("+password");
    if (!user) {
      return res
        .status(404)
        .json({ message: "User not found", status: "Error" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(newPassword, salt);
    user.password = hashed;
    await user.save();

    // Clean up store
    forgotOtpStore.delete(email);

    return res
      .status(200)
      .json({ message: "Password reset successful", status: "Success" });
  } catch (error) {
    console.error("Verify forgot OTP error:", error);
    res.status(500).json({
      message: error.message || "Internal Server Error",
      status: "Server Error",
    });
  }
});

// Change password for authenticated user
appRouter.post("/change-password", async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const token = req.headers.authorization;

    if (!token) {
      return res.status(401).json({
        message: "Authorization token required",
        status: "Error",
      });
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: "Current password and new password are required",
        status: "Error",
      });
    }

    // Verify JWT token
    let decoded;
    try {
      decoded = JWT.verify(token, process.env.SESSION__STRING);
    } catch (err) {
      return res.status(401).json({
        message: "Invalid or expired token",
        status: "Error",
      });
    }

    const userId = decoded.user._id;

    // Find user
    const user = await Users.findById(userId).select("+password");
    if (!user) {
      return res.status(404).json({
        message: "User not found",
        status: "Error",
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        message: "Current password is incorrect",
        status: "Error",
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedNewPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    user.password = hashedNewPassword;
    await user.save();

    return res.status(200).json({
      message: "Password changed successfully",
      status: "Success",
    });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({
      message: error.message || "Internal Server Error",
      status: "Server Error",
    });
  }
});

module.exports = appRouter;
