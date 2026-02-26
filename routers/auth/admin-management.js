const appRouter = require("express").Router();
const Users = require("../../database/Models/Users.js");
const bcrypt = require("bcryptjs");
const JWT = require("jsonwebtoken");

// Helper: decode and validate JWT, return user record
async function getCallerUser(req, res) {
  const token = req.headers.authorization;
  if (!token) {
    res.status(401).json({ message: "Unauthorized – no token", status: "Error" });
    return null;
  }
  let decoded;
  try {
    decoded = JWT.verify(token, process.env.SESSION__STRING);
  } catch {
    res.status(401).json({ message: "Invalid or expired token", status: "Error" });
    return null;
  }
  const caller = await Users.findById(decoded.user._id || decoded.user.id);
  if (!caller) {
    res.status(401).json({ message: "User not found", status: "Error" });
    return null;
  }
  return caller;
}

// POST /admin/setup-super-admin
// One-time setup: any admin can call this to mark themselves as super admin.
// After calling this, log out and log back in so the new JWT includes isSuperAdmin:true.
appRouter.post("/setup-super-admin", async (req, res) => {
  try {
    const token = req.headers.authorization;
    if (!token) {
      return res.status(401).json({ message: "Unauthorized – no token", status: "Error" });
    }
    let decoded;
    try {
      decoded = JWT.verify(token, process.env.SESSION__STRING);
    } catch {
      // If token is expired try decode anyway
      decoded = JWT.decode(token);
    }

    const userId = decoded?.user?._id || decoded?.user?.id;
    if (!userId) {
      return res.status(400).json({ message: "Could not identify user from token", status: "Error" });
    }

    const user = await Users.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found", status: "Error" });
    }
    if (user.userRole !== "admin" && user.userRole !== "hr") {
      return res.status(403).json({ message: "Only admin/hr users can become super admin", status: "Error" });
    }

    // Mark as super admin
    user.isSuperAdmin = true;
    await user.save();

    // Issue a fresh JWT so the sidebar picks it up immediately
    const freshUser = await Users.findById(userId);
    const newToken = JWT.sign({ user: freshUser }, process.env.SESSION__STRING, { expiresIn: "2d" });

    res.setHeader("Authorization", newToken);
    res.status(200).json({
      message: "You are now the super admin! Your session has been refreshed.",
      status: "Success",
      token: newToken,
    });
  } catch (error) {
    console.error("Setup super admin error:", error);
    res.status(500).json({ message: error.message || "Internal Server Error", status: "Error" });
  }
});

// GET /admin/me – return the current admin's live DB record (used by sidebar to check isSuperAdmin)
appRouter.get("/me", async (req, res) => {
  try {
    const token = req.headers.authorization;
    if (!token) return res.status(401).json({ message: "No token", status: "Error" });

    let decoded;
    try {
      decoded = JWT.verify(token, process.env.SESSION__STRING);
    } catch {
      decoded = JWT.decode(token);
    }

    const userId = decoded?.user?._id || decoded?.user?.id;
    if (!userId) return res.status(400).json({ message: "Invalid token", status: "Error" });

    const user = await Users.findById(userId).select("-password");
    if (!user) return res.status(404).json({ message: "User not found", status: "Error" });

    res.status(200).json({ data: user, status: "Success" });
  } catch (error) {
    console.error("Admin me error:", error);
    res.status(500).json({ message: error.message || "Internal Server Error", status: "Error" });
  }
});


// POST /admin/create-admin  – super-admin only
appRouter.post("/create-admin", async (req, res) => {
  try {
    const caller = await getCallerUser(req, res);
    if (!caller) return;

    if (!caller.isSuperAdmin || (caller.userRole !== "admin" && caller.userRole !== "hr")) {
      return res.status(403).json({
        message: "Forbidden – only the super admin can create new admins",
        status: "Error",
      });
    }

    const { fullName, email, phoneNumber, password } = req.body;

    if (!fullName || !email || !phoneNumber || !password) {
      return res.status(400).json({ message: "All fields are required", status: "Error" });
    }

    const exists = await Users.findOne({ email });
    if (exists) {
      return res.status(409).json({ message: "Email already exists", status: "Error" });
    }

    const phoneExists = await Users.findOne({ phoneNumber });
    if (phoneExists) {
      return res.status(409).json({ message: "Phone number already exists", status: "Error" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const newAdmin = new Users({
      userName: fullName,
      email,
      phoneNumber,
      password: hashedPassword,
      userRole: "hr",        // Gets full HR dashboard access
      isSuperAdmin: false,   // Cannot create more admins
      createdBy: caller._id,
    });

    await newAdmin.save();

    res.status(201).json({ message: "Admin created successfully", status: "Success" });
  } catch (error) {
    console.error("Create admin error:", error);
    res.status(500).json({ message: error.message || "Internal Server Error", status: "Error" });
  }
});

// GET /admin/list-admins  – super-admin only
appRouter.get("/list-admins", async (req, res) => {
  try {
    const caller = await getCallerUser(req, res);
    if (!caller) return;

    if (!caller.isSuperAdmin || (caller.userRole !== "admin" && caller.userRole !== "hr")) {
      return res.status(403).json({
        message: "Forbidden – only the super admin can view admin list",
        status: "Error",
      });
    }

    // Show all hr users created by the super admin (isSuperAdmin false = sub-admins)
    const admins = await Users.find({ userRole: "hr", isSuperAdmin: { $ne: true } })
      .select("-password")
      .sort({ createdAt: -1 });

    res.status(200).json({ data: admins, status: "Success" });
  } catch (error) {
    console.error("List admins error:", error);
    res.status(500).json({ message: error.message || "Internal Server Error", status: "Error" });
  }
});

// DELETE /admin/delete-admin/:id  – super-admin only
appRouter.delete("/delete-admin/:id", async (req, res) => {
  try {
    const caller = await getCallerUser(req, res);
    if (!caller) return;

    if (!caller.isSuperAdmin || (caller.userRole !== "admin" && caller.userRole !== "hr")) {
      return res.status(403).json({
        message: "Forbidden – only the super admin can delete admins",
        status: "Error",
      });
    }

    const target = await Users.findById(req.params.id);
    if (!target) {
      return res.status(404).json({ message: "Admin not found", status: "Error" });
    }

    if (target.isSuperAdmin) {
      return res.status(403).json({
        message: "Cannot delete the super admin",
        status: "Error",
      });
    }

    await Users.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: "Admin deleted successfully", status: "Success" });
  } catch (error) {
    console.error("Delete admin error:", error);
    res.status(500).json({ message: error.message || "Internal Server Error", status: "Error" });
  }
});

// PUT /admin/toggle-admin-status/:id  – super-admin only (activate / deactivate)
appRouter.put("/toggle-admin-status/:id", async (req, res) => {
  try {
    const caller = await getCallerUser(req, res);
    if (!caller) return;

    if (!caller.isSuperAdmin || (caller.userRole !== "admin" && caller.userRole !== "hr")) {
      return res.status(403).json({ message: "Forbidden", status: "Error" });
    }

    const target = await Users.findById(req.params.id);
    if (!target) {
      return res.status(404).json({ message: "Admin not found", status: "Error" });
    }

    target.accountStatus = target.accountStatus === "active" ? "inactive" : "active";
    await target.save();

    res.status(200).json({
      message: `Admin ${target.accountStatus === "active" ? "activated" : "deactivated"} successfully`,
      status: "Success",
    });
  } catch (error) {
    console.error("Toggle admin status error:", error);
    res.status(500).json({ message: error.message || "Internal Server Error", status: "Error" });
  }
});

module.exports = appRouter;
