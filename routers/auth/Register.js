const appRouter = require("express").Router();
const Users = require("../../database/Models/Users.js");
const bcrypt = require("bcryptjs");

appRouter.post("/register", async (req, res) => {
  try {
    // get details from body
    const {
      fullName,
      email,
      country,
      phoneNumber,
      password,
      address,
      dateOfBirth,
      userRole
    } = req.body;

    // Validate required fields
    if (!fullName || !email || !country || !phoneNumber || !password || !address || !dateOfBirth) {
      return res.status(400).json({
        message: "All fields are required",
        status: "Error",
      });
    }

    // check if emaill exists
    const checkEmailExists = await Users.findOne({ email });
    if (checkEmailExists)
      return res.status(409).json({
        message: "Email already exists",
        status: "Error",
      });

    // hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // create new user
    const newUser = await Users({
      userName: fullName,
      email,
      phoneNumber,
      country,
      address,
      password: hashedPassword,
      dateOfBirth: dateOfBirth,
      userRole: userRole || "employee"
    });
    // save user to database
    await newUser.save();
    // return user details
    res.status(200).json({
      message: "Account created successfully",
      status: "Success",
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ 
      message: error.message || "Internal Server Error", 
      status: "Server Error" 
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
    existingUser.employeementType = employeementType || existingUser.employeementType;
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

module.exports = appRouter;
