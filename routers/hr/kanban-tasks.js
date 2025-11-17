const express = require("express");
const router = express.Router();
const Task = require("../../database/Models/Tasks");
const User = require("../../database/Models/Users");

// Get all kanban tasks (onboarding tasks only)
router.get("/get-kanban-tasks", async (req, res) => {
  try {
    const kanbanTasks = await Task.find({ taskType: "Onboarding" })
      .populate("assignedToID", "userName email jobDesignation")
      .populate("assignedByID", "userName")
      .sort({ createdAt: -1 });

    const formattedTasks = kanbanTasks.map((task) => ({
      id: task._id.toString(),
      taskId: task._id,
      content: task.taskTitle,
      taskTitle: task.taskTitle,
      employeeName: task.employeeName,
      employeeEmail: task.assignedToID?.email || "",
      employeePosition: task.assignedToID?.jobDesignation || "Employee",
      employeeId: task.assignedToID?._id || null,
      deadLine:
        task.deadLine ||
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
      priority: task.taskPriority || "High",
      status: task.taskStatus,
      department: "HR",
      position: task.assignedToID?.jobDesignation || "Employee",
      createdAt: task.createdAt,
      acceptedAt: task.createdAt,
      applicationId: task.applicationId || null,
      taskType: task.taskType,
      description: task.taskDescription,
      assignedBy: task.assignedByID?.userName || "HR",
      updatedAt: task.updatedAt,
      approvalType: task.approvalType || null,
      // UI styling hints for frontend
      cardClass:
        task.taskStatus === "Complete" && task.approvalType === "final_approved"
          ? "card-approved"
          : task.taskStatus === "Complete" &&
            task.approvalType === "final_rejected"
          ? "card-rejected"
          : null,
      cardGradient:
        task.taskStatus === "Complete" && task.approvalType === "final_approved"
          ? "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)"
          : task.taskStatus === "Complete" &&
            task.approvalType === "final_rejected"
          ? "linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)"
          : null,
    }));

    res.status(200).json({
      success: true,
      tasks: formattedTasks,
      count: formattedTasks.length,
    });
  } catch (error) {
    console.error("Error fetching kanban tasks:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch kanban tasks",
      error: error.message,
    });
  }
});

// Create new onboarding task when HR approves application
router.post("/create-onboarding-task", async (req, res) => {
  try {
    const {
      employeeName,
      employeeId,
      employeeEmail,
      employeePosition,
      applicationId,
      taskTitle,
      priority = "High",
      description,
      assignedByID,
      deadLine,
      approvalType = "regular",
    } = req.body;

    // Find the employee user by email or ID
    let employee;
    if (employeeId) {
      employee = await User.findById(employeeId);
    } else if (employeeEmail) {
      employee = await User.findOne({ email: employeeEmail });
    }

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    // Check if task already exists for this application
    const existingTask = await Task.findOne({
      taskType: "Onboarding",
      $or: [
        { applicationId: applicationId },
        {
          employeeName: employeeName,
          taskTitle: { $regex: "Onboarding", $options: "i" },
        },
      ],
    });

    if (existingTask) {
      return res.status(200).json({
        success: true,
        message: "Onboarding task already exists",
        task: existingTask,
        isExisting: true,
      });
    }

    // Create new onboarding task
    const newTask = new Task({
      employeeName: employeeName,
      taskTitle: taskTitle || `Complete Onboarding Process for ${employeeName}`,
      taskPriority: priority,
      deadLine: deadLine || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      taskDescription:
        description ||
        `Complete all onboarding requirements for ${employeeName}. Review all submitted forms and finalize employee setup.`,
      assignedToID: employee._id,
      assignedByID: assignedByID,
      taskType: "Onboarding",
      taskStatus: "To Do", // Default status for new tasks
      applicationId: applicationId,
      approvalType: approvalType,
    });

    const savedTask = await newTask.save();

    // Populate the saved task for response
    const populatedTask = await Task.findById(savedTask._id)
      .populate("assignedToID", "userName email jobDesignation")
      .populate("assignedByID", "userName");

    const formattedTask = {
      id: populatedTask._id.toString(),
      taskId: populatedTask._id,
      content: populatedTask.taskTitle,
      taskTitle: populatedTask.taskTitle,
      employeeName: populatedTask.employeeName,
      employeeEmail: populatedTask.assignedToID?.email || "",
      employeePosition:
        populatedTask.assignedToID?.jobDesignation || "Employee",
      employeeId: populatedTask.assignedToID?._id || null,
      deadLine: populatedTask.deadLine
        ? populatedTask.deadLine.toISOString().split("T")[0]
        : null,
      priority: populatedTask.taskPriority,
      status: populatedTask.taskStatus,
      department: "HR",
      position: populatedTask.assignedToID?.jobDesignation || "Employee",
      createdAt: populatedTask.createdAt,
      acceptedAt: populatedTask.createdAt,
      applicationId: populatedTask.applicationId,
      taskType: populatedTask.taskType,
      description: populatedTask.taskDescription,
      assignedBy: populatedTask.assignedByID?.userName || "HR",
      approvalType: populatedTask.approvalType || "regular",
      cardClass:
        populatedTask.taskStatus === "Complete" &&
        populatedTask.approvalType === "final_approved"
          ? "card-approved"
          : populatedTask.taskStatus === "Complete" &&
            populatedTask.approvalType === "final_rejected"
          ? "card-rejected"
          : null,
      cardGradient:
        populatedTask.taskStatus === "Complete" &&
        populatedTask.approvalType === "final_approved"
          ? "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)"
          : populatedTask.taskStatus === "Complete" &&
            populatedTask.approvalType === "final_rejected"
          ? "linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)"
          : null,
    };

    console.log("✅ Created new onboarding task:", formattedTask);

    res.status(201).json({
      success: true,
      message: "Onboarding task created successfully",
      task: formattedTask,
    });
  } catch (error) {
    console.error("Error creating onboarding task:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create onboarding task",
      error: error.message,
    });
  }
});

// Update task status (for Kanban drag and drop)
router.put("/update-task-status/:taskId", async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status, reviewComments, approvalType } = req.body;

    // Map frontend status to backend status
    const statusMapping = {
      "To Do": "To Do",
      "In Progress": "In Progress",
      "In Review": "In Review",
      Complete: "Complete",
    };

    const mappedStatus = statusMapping[status] || status;

    const updateData = {
      taskStatus: mappedStatus,
      taskUpdate: reviewComments || `Status updated to ${mappedStatus}`,
      updatedAt: new Date(),
    };

    // Add approval type if provided
    if (approvalType) {
      updateData.approvalType = approvalType;
    }

    const updatedTask = await Task.findByIdAndUpdate(taskId, updateData, {
      new: true,
    })
      .populate("assignedToID", "userName email jobDesignation")
      .populate("assignedByID", "userName");

    if (!updatedTask) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    // Update the application status to reflect the task status change
    if (updatedTask.applicationId) {
      try {
        console.log(
          `🔄 Attempting to update application for applicationId: ${updatedTask.applicationId}`
        );
        console.log(`📊 Task status: ${mappedStatus}`);

        // Map task status to application form status
        let formStatus;
        if (mappedStatus === "In Progress") {
          formStatus = "under_review"; // Maps to "Under Review" on frontend
        } else if (mappedStatus === "In Review") {
          formStatus = "in_review_final"; // Maps to "Final Review" on frontend
        } else if (mappedStatus === "Complete") {
          // For final decisions, use the approval type to set proper status
          if (approvalType === "final_approved") {
            formStatus = "approved"; // Final approval
          } else if (approvalType === "final_rejected") {
            formStatus = "rejected"; // Final rejection
          } else {
            formStatus = "completed"; // Just moved to complete without final decision
          }
        } else if (mappedStatus === "To Do") {
          formStatus = "submitted"; // Maps to "Pending Review" on frontend
        }

        if (formStatus) {
          // Update OnboardingApplication status
          const OnboardingApplication = require("../../database/Models/OnboardingApplication");
          const updateResult = await OnboardingApplication.findByIdAndUpdate(
            updatedTask.applicationId,
            { applicationStatus: formStatus },
            { new: true }
          );
          console.log(
            `✅ Updated application status to ${formStatus} for applicationId: ${updatedTask.applicationId}`
          );
          console.log(`✅ Update result:`, updateResult);

          if (updateResult) {
            console.log(
              `✅ Application status is now: ${updateResult.applicationStatus}`
            );
          } else {
            console.error(
              `❌ Failed to find/update application with ID: ${updatedTask.applicationId}`
            );
          }
        }
      } catch (appError) {
        console.error("⚠️ Error updating application status:", appError);
        console.error("⚠️ Stack trace:", appError.stack);
        // Continue anyway - task update was successful
      }
    } else {
      console.warn("⚠️ No applicationId found in task:", updatedTask._id);
    }

    const formattedTask = {
      id: updatedTask._id.toString(),
      taskId: updatedTask._id,
      content: updatedTask.taskTitle,
      taskTitle: updatedTask.taskTitle,
      employeeName: updatedTask.employeeName,
      employeeEmail: updatedTask.assignedToID?.email || "",
      employeePosition: updatedTask.assignedToID?.jobDesignation || "Employee",
      employeeId: updatedTask.assignedToID?._id || null,
      deadLine: updatedTask.deadLine
        ? updatedTask.deadLine.toISOString().split("T")[0]
        : null,
      priority: updatedTask.taskPriority,
      status: updatedTask.taskStatus,
      department: "HR",
      position: updatedTask.assignedToID?.jobDesignation || "Employee",
      createdAt: updatedTask.createdAt,
      acceptedAt: updatedTask.createdAt,
      applicationId: updatedTask.applicationId,
      taskType: updatedTask.taskType,
      description: updatedTask.taskDescription,
      assignedBy: updatedTask.assignedByID?.userName || "HR",
      updatedAt: updatedTask.updatedAt,
      approvalType: updatedTask.approvalType || null,
      cardClass:
        updatedTask.taskStatus === "Complete" &&
        updatedTask.approvalType === "final_approved"
          ? "card-approved"
          : updatedTask.taskStatus === "Complete" &&
            updatedTask.approvalType === "final_rejected"
          ? "card-rejected"
          : null,
      cardGradient:
        updatedTask.taskStatus === "Complete" &&
        updatedTask.approvalType === "final_approved"
          ? "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)"
          : updatedTask.taskStatus === "Complete" &&
            updatedTask.approvalType === "final_rejected"
          ? "linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)"
          : null,
    };

    console.log(
      `✅ Updated task status: ${updatedTask.taskTitle} -> ${mappedStatus}${
        approvalType ? ` (${approvalType})` : ""
      }`
    );

    res.status(200).json({
      success: true,
      message: `Task status updated to ${mappedStatus}`,
      task: formattedTask,
    });
  } catch (error) {
    console.error("Error updating task status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update task status",
      error: error.message,
    });
  }
});

// Final approval or rejection of tasks
router.put("/final-approval/:taskId", async (req, res) => {
  try {
    const { taskId } = req.params;
    const { approvalType, reviewComments } = req.body; // approvalType: "final_approved" or "final_rejected"

    if (!["final_approved", "final_rejected"].includes(approvalType)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid approval type. Must be 'final_approved' or 'final_rejected'",
      });
    }

    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      {
        approvalType: approvalType,
        taskStatus: "Complete", // Always move to complete for final decisions
        taskUpdate:
          reviewComments || `Task ${approvalType.replace("_", " ")} by HR`,
        updatedAt: new Date(),
      },
      { new: true }
    )
      .populate("assignedToID", "userName email jobDesignation")
      .populate("assignedByID", "userName");

    if (!updatedTask) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    const formattedTask = {
      id: updatedTask._id.toString(),
      taskId: updatedTask._id,
      content: updatedTask.taskTitle,
      taskTitle: updatedTask.taskTitle,
      employeeName: updatedTask.employeeName,
      employeeEmail: updatedTask.assignedToID?.email || "",
      employeePosition: updatedTask.assignedToID?.jobDesignation || "Employee",
      employeeId: updatedTask.assignedToID?._id || null,
      deadLine: updatedTask.deadLine
        ? updatedTask.deadLine.toISOString().split("T")[0]
        : null,
      priority: updatedTask.taskPriority,
      status: updatedTask.taskStatus,
      department: "HR",
      position: updatedTask.assignedToID?.jobDesignation || "Employee",
      createdAt: updatedTask.createdAt,
      acceptedAt: updatedTask.createdAt,
      applicationId: updatedTask.applicationId,
      taskType: updatedTask.taskType,
      description: updatedTask.taskDescription,
      assignedBy: updatedTask.assignedByID?.userName || "HR",
      updatedAt: updatedTask.updatedAt,
      approvalType: updatedTask.approvalType,
      cardClass:
        updatedTask.taskStatus === "Complete" &&
        updatedTask.approvalType === "final_approved"
          ? "card-approved"
          : updatedTask.taskStatus === "Complete" &&
            updatedTask.approvalType === "final_rejected"
          ? "card-rejected"
          : null,
      cardGradient:
        updatedTask.taskStatus === "Complete" &&
        updatedTask.approvalType === "final_approved"
          ? "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)"
          : updatedTask.taskStatus === "Complete" &&
            updatedTask.approvalType === "final_rejected"
          ? "linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)"
          : null,
    };

    const actionMessage =
      approvalType === "final_approved"
        ? "finally approved"
        : "finally rejected";
    console.log(`✅ Task ${actionMessage}: ${updatedTask.taskTitle}`);

    res.status(200).json({
      success: true,
      message: `Task ${actionMessage} successfully`,
      task: formattedTask,
    });
  } catch (error) {
    console.error("Error updating task approval:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update task approval",
      error: error.message,
    });
  }
});

// Delete task (optional - for cleanup)
router.delete("/delete-task/:taskId", async (req, res) => {
  try {
    const { taskId } = req.params;

    const deletedTask = await Task.findByIdAndDelete(taskId);

    if (!deletedTask) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Task deleted successfully",
      deletedTask: deletedTask,
    });
  } catch (error) {
    console.error("Error deleting task:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete task",
      error: error.message,
    });
  }
});

// Get task details
router.get("/get-task/:taskId", async (req, res) => {
  try {
    const { taskId } = req.params;

    const task = await Task.findById(taskId)
      .populate("assignedToID", "userName email jobDesignation")
      .populate("assignedByID", "userName");

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    const formattedTask = {
      id: task._id.toString(),
      taskId: task._id,
      content: task.taskTitle,
      taskTitle: task.taskTitle,
      employeeName: task.employeeName,
      employeeEmail: task.assignedToID?.email || "",
      employeePosition: task.assignedToID?.jobDesignation || "Employee",
      employeeId: task.assignedToID?._id || null,
      deadLine: task.deadLine
        ? task.deadLine.toISOString().split("T")[0]
        : null,
      priority: task.taskPriority,
      status: task.taskStatus,
      department: "HR",
      position: task.assignedToID?.jobDesignation || "Employee",
      createdAt: task.createdAt,
      acceptedAt: task.createdAt,
      applicationId: task.applicationId,
      taskType: task.taskType,
      description: task.taskDescription,
      assignedBy: task.assignedByID?.userName || "HR",
      updatedAt: task.updatedAt,
      lastUpdate: task.taskUpdate,
      approvalType: task.approvalType || null,
      cardClass:
        task.taskStatus === "Complete" && task.approvalType === "final_approved"
          ? "card-approved"
          : task.taskStatus === "Complete" &&
            task.approvalType === "final_rejected"
          ? "card-rejected"
          : null,
      cardGradient:
        task.taskStatus === "Complete" && task.approvalType === "final_approved"
          ? "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)"
          : task.taskStatus === "Complete" &&
            task.approvalType === "final_rejected"
          ? "linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)"
          : null,
    };

    res.status(200).json({
      success: true,
      task: formattedTask,
    });
  } catch (error) {
    console.error("Error fetching task details:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch task details",
      error: error.message,
    });
  }
});

module.exports = router;
