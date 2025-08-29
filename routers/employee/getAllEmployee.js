const Users = require("../../database/Models/Users");
const authMiddleware = require("../auth/authMiddleware");

const appRouter = require("express").Router();

appRouter.get("/get-all-employee", async (req, res) => {
  try {
   
    const getAllEmployee = await Users.find().populate('tasks');
    if (getAllEmployee.length > 0) {
      return res.status(200).json({
        employessList: getAllEmployee,
        status: "Success",
      });
    }

    res.status(200).json({
      employessList: [],
      status: "Success",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Internal Server Error",
      status: "Error",
    });
  }
});

appRouter.get("/get-employee-info", authMiddleware, async (req, res) => {
  try {
    const employeeInfo = req.user;
    res.status(200).json({
      employeeInfo: employeeInfo,
      status: "Success",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Internal server error",
      status: "Error",
    });
  }
});



module.exports = appRouter;
