const appRouter = require("express").Router();
const Task = require("../../database/Models/Tasks");

// get all task list....

appRouter.get("/get-all", async (req, res) => {
  try {
    const getAllTaskList = await Task.find();
    if (getAllTaskList.length === 0) {
      return res.status(204).json({
        message: "No task found",
        status: "No Content",
      });
    }
    res.status(200).json({
      taskList: getAllTaskList,
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

module.exports = appRouter;
