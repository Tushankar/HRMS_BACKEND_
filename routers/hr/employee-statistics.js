const Users = require("../../database/Models/Users");
const OnboardingApplication = require("../../database/Models/OnboardingApplication");

const appRouter = require("express").Router();

appRouter.get("/employee-statistics", async (req, res) => {
  try {
    // Get active employees count
    const activeCount = await Users.countDocuments({
      userRole: "employee",
      accountStatus: "active",
    });

    // Get inactive employees count
    const inactiveCount = await Users.countDocuments({
      userRole: "employee",
      accountStatus: "inactive",
    });

    // Get onboarding applications count (not completed or approved)
    const onboardingCount = await OnboardingApplication.countDocuments({
      applicationStatus: { $nin: ["completed", "approved"] },
    });

    // Get onboarding issues (applications under review or rejected)
    const onboardingIssues = await OnboardingApplication.countDocuments({
      applicationStatus: { $in: ["under_review", "rejected"] },
    });

    // Get inactive employees with potential issues (for now, just count all inactive)
    // This could be enhanced later to track specific issues
    const inactiveIssues = inactiveCount;

    // Calculate recent updates (this could be enhanced with actual update tracking)
    const recentUpdates = 3; // Placeholder - could be based on recent activity

    res.status(200).json({
      activeCount,
      inactiveCount,
      onboardingCount,
      onboardingIssues,
      inactiveIssues,
      recentUpdates,
      status: "Success",
    });
  } catch (error) {
    console.error("Error fetching employee statistics:", error);
    res.status(500).json({
      message: "Internal Server Error",
      status: "Error",
    });
  }
});

module.exports = appRouter;
