const appRouter = require("express").Router();
const Users = require("../../database/Models/Users.js");
const bcrypt = require("bcrypt");
const JWT = require("jsonwebtoken");

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
        mesage: "Invalid username and password",
        status: "Error",
      });
    // create a session
    if (!process.env.SESSION__STRING) {
      return res.status(500).json({
        message: "Environment variable not defined",
        status: "Error",
      });
    }

    const session = JWT.sign(
      { user: isUserInfoExist},
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

module.exports = appRouter;
