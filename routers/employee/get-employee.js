const authMiddleware = require("../auth/authMiddleware");

const appRouter = require("express").Router();

appRouter.get("/get-employee-info", authMiddleware, async (req, res) => {
  try {
    const employeeInfo = req.user;
    console.log(id);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Internal server error",
      status: "Error",
    });
  }
});

module.exports = appRouter;
